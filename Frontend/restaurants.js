import { auth, db } from "./firebase.js";
import { collection, getDocs, addDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// DOM Elements
const restaurantList = document.getElementById("restaurant-list");
const modal = document.getElementById("restaurant-modal");
const modalContent = document.getElementById("modal-content");
const reviewsSection = document.getElementById("reviews-section");
const closeModalBtn = document.getElementById("modal-close");
const reviewForm = document.getElementById("leave-review-form");
const reviewRating = document.getElementById("review-rating");
const reviewComment = document.getElementById("review-comment");

const profileContainer = document.getElementById("profile-container");
const profileEmail = document.getElementById("profile-email");
const profileRole = document.getElementById("profile-role");
const profileLogout = document.getElementById("profile-logout");
const loginBtn = document.getElementById("nav-login");
const logoutBtn = document.getElementById("nav-logout");

// Add Restaurant form elements (must exist in restaurants.html)
const addForm = document.getElementById("add-restaurant-form");
const addName = document.getElementById("add-name");
const addCategory = document.getElementById("add-category");
const addAddress = document.getElementById("add-address");
const addImageUrl = document.getElementById("add-imageUrl");
const addStatus = document.getElementById("add-status");

let currentRestaurantId = null;
let map = null;
let markersLayer = null;

// ------------------- AUTH STATE -------------------
onAuthStateChanged(auth, async user => {
  if (user) {
    // Show profile
    const snap = await getDocs(collection(db, "users"));
    if (profileContainer) profileContainer.style.display = "block";
    if (profileEmail) profileEmail.textContent = user.email;
    if (profileRole) profileRole.textContent = "user"; // optional: fetch role if stored

    // Navbar buttons
    if (loginBtn) loginBtn.classList.add("hidden");
    if (logoutBtn) logoutBtn.classList.remove("hidden");
  } else {
    if (profileContainer) profileContainer.style.display = "none";
    if (loginBtn) loginBtn.classList.remove("hidden");
    if (logoutBtn) logoutBtn.classList.add("hidden");
  }
});

if (profileLogout) {
  profileLogout.onclick = async () => {
    await signOut(auth);
    location.reload();
  };
}

if (logoutBtn) {
  logoutBtn.onclick = async () => {
    await signOut(auth);
    location.reload();
  };
}

function apiBase() {
  // Same-origin -> ""
  // Live Server(5500) + backend(4000) -> http://localhost:4000
  return "http://localhost:4000";
}

function getLatLngFromRestaurant(r) {
  // Case 1: lat/lng fields exist
  if (r && r.lat != null && r.lng != null) {
    const lat = Number(r.lat);
    const lng = Number(r.lng);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng };
  }

  // Case 2: GeoJSON location.coordinates exists ([lng, lat])
  const coords = r?.location?.coordinates;
  if (Array.isArray(coords) && coords.length === 2) {
    const lng = Number(coords[0]);
    const lat = Number(coords[1]);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng };
  }

  return null;
}

function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ------------------- LOAD RESTAURANTS -------------------
async function loadRestaurants() {
  if (!restaurantList) return;

  // Load restaurants from backend (MongoDB)
  const res = await fetch(`${apiBase()}/api/restaurants`);
  if (!res.ok) throw new Error("Failed to fetch restaurants from backend");
  const restaurants = await res.json();

  restaurantList.innerHTML = "";

  restaurants.forEach(r => {
    // Use MongoDB _id for modal & reviews mapping
    const id = r._id || r.id;
    const name = escapeHtml(r.name);
    const cuisine = escapeHtml(r.cuisine || r.category || "");

    const div = document.createElement("div");
    div.className = "restaurant-card glass";
    div.innerHTML = `
      <h3 class="restaurant-title">${name}</h3>
      <p class="restaurant-desc">${cuisine}</p>
      <button class="view-btn" data-id="${escapeHtml(id)}">View & Review</button>
    `;
    restaurantList.appendChild(div);
  });

  // Render markers on map
  renderMarkers(restaurants);
}

function renderMarkers(restaurants) {
  if (!map || !markersLayer) return;

  markersLayer.clearLayers();

  let firstPos = null;

  restaurants.forEach(r => {
    const pos = getLatLngFromRestaurant(r);
    if (!pos) return;

    if (!firstPos) firstPos = pos;

    const popupName = escapeHtml(r.name);
    const popupAddr = escapeHtml(r.address || "");
    const popupCuisine = escapeHtml(r.cuisine || r.category || "");

    const marker = L.marker([pos.lat, pos.lng]).bindPopup(
      `<b>${popupName}</b><br>${popupCuisine}${popupAddr ? `<br>${popupAddr}` : ""}`
    );

    markersLayer.addLayer(marker);
  });

  // Center map around first valid marker
  if (firstPos) {
    map.setView([firstPos.lat, firstPos.lng], 12);
  }
}

// ------------------- ADD RESTAURANT (ADDRESS -> GEOCODING -> PIN) -------------------
async function createRestaurantOnBackend(payload) {
  const res = await fetch(`${apiBase()}/api/restaurants`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  // Try to parse JSON even on errors (backend returns {error, details})
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const msg = data?.error || "Failed to create restaurant";
    const details = data?.details ? ` (${data.details})` : "";
    throw new Error(`${msg}${details}`);
  }

  return data;
}

if (addForm) {
  addForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = addName?.value.trim();
    const category = addCategory?.value.trim();
    const address = addAddress?.value.trim();
    const imageUrl = addImageUrl?.value.trim();

    if (!name || !category || !address) {
      if (addStatus) addStatus.textContent = "Please fill in name, category, and address.";
      return;
    }

    try {
      if (addStatus) addStatus.textContent = "Saving... (geocoding address)";

      // This triggers backend geocoding and stores lat/lng in MongoDB
      await createRestaurantOnBackend({
        name,
        category,
        address,
        imageUrl: imageUrl || undefined
      });

      if (addStatus) addStatus.textContent = "Added! Reloading map...";
      addForm.reset();

      // Refresh list and markers (GET -> includes new lat/lng)
      await loadRestaurants();

      if (addStatus) addStatus.textContent = "Done.";
      setTimeout(() => {
        if (addStatus) addStatus.textContent = "";
      }, 1500);
    } catch (err) {
      console.error(err);
      if (addStatus) addStatus.textContent = err.message || "Failed to add restaurant.";
    }
  });
}

// ------------------- MODAL -------------------
if (restaurantList) {
  restaurantList.addEventListener("click", async e => {
    if (!e.target.classList.contains("view-btn")) return;
    currentRestaurantId = e.target.dataset.id;

    // Load a single restaurant from backend
    const res = await fetch(`${apiBase()}/api/restaurants/${currentRestaurantId}`);
    if (!res.ok) return;

    const r = await res.json();
    const name = escapeHtml(r.name);
    const cuisine = escapeHtml(r.cuisine || r.category || "");
    const addr = escapeHtml(r.address || "");

    if (modalContent) {
      modalContent.innerHTML = `<h3>${name}</h3><p>${cuisine}${addr ? `<br>${addr}` : ""}</p>`;
    }

    if (modal) modal.classList.remove("hidden");
    loadReviews(currentRestaurantId);
  });
}

if (closeModalBtn) {
  closeModalBtn.onclick = () => {
    if (modal) modal.classList.add("hidden");
  };
}

// ------------------- REVIEWS -------------------
async function loadReviews(restaurantId) {
  if (!reviewsSection) return;

  const q = query(
    collection(db, "reviews"),
    where("restaurantId", "==", restaurantId),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);
  reviewsSection.innerHTML = "<h4>Reviews</h4>";
  snap.forEach(docSnap => {
    const r = docSnap.data();
    const div = document.createElement("div");
    div.className = "review-item glass";
    div.innerHTML = `<strong>${escapeHtml(r.userEmail)}</strong> - <span class="rating">${"⭐".repeat(r.rating)}</span><p>${escapeHtml(r.comment)}</p>`;
    reviewsSection.appendChild(div);
  });
}

// ------------------- ADD REVIEW -------------------
if (reviewForm) {
  reviewForm.addEventListener("submit", async e => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return alert("You must be logged in to post a review.");
    if (!currentRestaurantId) return alert("Please select a restaurant first.");
    if (!reviewRating || !reviewComment) return;

    await addDoc(collection(db, "reviews"), {
      restaurantId: currentRestaurantId,
      userUid: user.uid,
      userEmail: user.email,
      rating: parseInt(reviewRating.value),
      comment: reviewComment.value.trim(),
      createdAt: Date.now()
    });

    reviewForm.reset();
    loadReviews(currentRestaurantId);
  });
}

// ------------------- MAP INIT -------------------
function initMap() {
  const mapEl = document.getElementById("map");
  if (!mapEl || typeof L === "undefined") return null;

  // Boston
  const m = L.map("map").setView([42.3601, -71.0589], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(m);

  markersLayer = L.layerGroup().addTo(m);
  return m;
}

map = initMap();

// ------------------- INIT -------------------
(async () => {
  try {
    await loadRestaurants();
  } catch (err) {
    console.error(err);
    if (restaurantList) {
      restaurantList.innerHTML = `<div class="glass" style="padding:12px;">Failed to load restaurants.</div>`;
    }
  }
})();
