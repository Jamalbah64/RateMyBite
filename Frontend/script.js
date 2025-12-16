// ===== Firebase imports =====
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { auth, db } from "./firebase.js";

// ===========================
// Map (Leaflet) - Simple Version
// ===========================
let map = null;
let markersLayer = null;

function initMapIfNeeded() {
  const mapEl = document.getElementById("map");
  if (!mapEl) return; 

  if (typeof L === "undefined") {
    console.error("Leaflet (L) is not loaded. Check Leaflet script order in restaurants.html.");
    return;
  }

  if (map) return;

  // First Location （Boston）
  map = L.map("map").setView([42.3601, -71.0589], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

markersLayer = L.layerGroup().addTo(map);

}

function isValidCoord(lat, lng) {
  const a = Number(lat);
  const b = Number(lng);
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a) <= 90 && Math.abs(b) <= 180;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ===========================
// LOAD RESTAURANTS (Firestore)
// ===========================
async function loadRestaurants() {
  const container = document.getElementById("restaurant-list");
  if (!container) return; 

  // Map init
  initMapIfNeeded();
  if (markersLayer) markersLayer.clearLayers();
  const bounds = [];

  const snap = await getDocs(collection(db, "restaurants"));
  container.innerHTML = "";

  snap.forEach((rDoc) => {
    const r = rDoc.data();

    // --- UI card ---
    container.innerHTML += `
      <article class="restaurant-card glass">
        <h3 class="restaurant-title">${escapeHtml(r.name ?? "Unnamed")}</h3>
        <p class="restaurant-desc">${escapeHtml(r.cuisine ?? r.category ?? "Unknown")}</p>
        <button class="claim-btn" data-id="${rDoc.id}">Claim this restaurant</button>
      </article>
    `;

    if (markersLayer && isValidCoord(r.lat, r.lng)) {
      const lat = Number(r.lat);
      const lng = Number(r.lng);

      const marker = L.marker([lat, lng]).addTo(markersLayer);

      const ratingText = (r.avgRating !== undefined && r.avgRating !== null)
        ? `⭐ ${Number(r.avgRating).toFixed(1)} (${r.reviewCount ?? 0})`
        : "";

      marker.bindPopup(`
        <div style="min-width:180px;">
          <div style="font-weight:700; margin-bottom:6px;">${escapeHtml(r.name ?? "Unnamed")}</div>
          <div style="opacity:.85; margin-bottom:6px;">${escapeHtml(r.cuisine ?? r.category ?? "Unknown")}</div>
          <div style="font-size:13px;">${escapeHtml(ratingText)}</div>
        </div>
      `);

      bounds.push([lat, lng]);
    }
  });

  // Fit map to markers
  if (map && bounds.length > 0) {
    map.fitBounds(bounds, { padding: [30, 30] });
  }
}

// ===========================
// CLAIM RESTAURANT
// ===========================
document.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("claim-btn")) return;

  const user = auth.currentUser;
  if (!user) {
    alert("You must be logged in to claim a restaurant.");
    return;
  }

  await addDoc(collection(db, "restaurantClaims"), {
    restaurantId: e.target.dataset.id,
    userUid: user.uid,
    userEmail: user.email,
    status: "pending",
    createdAt: Date.now(),
  });

  alert("Claim submitted. Waiting for admin approval.");
});

// ===========================
// LOAD CLAIMS (ADMIN page only)
// ===========================
async function loadClaims() {
  const list = document.getElementById("claim-list");
  if (!list) return; 

  const snap = await getDocs(collection(db, "restaurantClaims"));
  list.innerHTML = "";

  snap.forEach((c) => {
    const d = c.data();
    if (d.status !== "pending") return;

    list.innerHTML += `
      <li>
        ${escapeHtml(d.userEmail ?? "unknown")}
        <button data-claim-id="${c.id}" data-restaurant-id="${d.restaurantId}" data-user-uid="${d.userUid}" class="approve-btn">
          Approve
        </button>
      </li>
    `;
  });
}

// Approve button handler
document.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("approve-btn")) return;

  const claimId = e.target.dataset.claimId;
  const restaurantId = e.target.dataset.restaurantId;
  const userUid = e.target.dataset.userUid;

  await updateDoc(doc(db, "restaurants", restaurantId), {
    ownerUid: userUid,
    isClaimed: true,
  });

  await updateDoc(doc(db, "restaurantClaims", claimId), {
    status: "approved",
  });

  loadClaims();
});

// ===========================
// INITIAL LOAD (page-safe)
// ===========================
document.addEventListener("DOMContentLoaded", () => {
  // restaurants page
  loadRestaurants();

  // admin claims page (if exists)
  loadClaims();

  // Fade-in
  document.body.style.opacity = "1";

  // Smooth scrolling for in-page links
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute("href"));
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
  });

  // Navbar login button smooth redirect
  const loginBtn = document.getElementById("nav-login");
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      document.body.style.opacity = "0";
      setTimeout(() => {
        location.href = "login.html";
      }, 300);
    });
  }

  // Hero "Create Account" smooth redirect
  const heroSignup = document.getElementById("hero-signup");
  if (heroSignup) {
    heroSignup.addEventListener("click", (e) => {
      e.preventDefault();
      document.body.style.opacity = "0";
      setTimeout(() => {
        location.href = "signup.html";
      }, 300);
    });
  }

  // Auth UI toggle (guards for missing elements)
  const logoutBtn = document.getElementById("nav-logout");
  const profileBtn = document.getElementById("nav-profile");

  onAuthStateChanged(auth, (user) => {
    if (!loginBtn || !logoutBtn) return;

    if (user) {
      loginBtn.classList.add("hidden");
      logoutBtn.classList.remove("hidden");
      if (profileBtn) profileBtn.classList.remove("hidden");
    } else {
      loginBtn.classList.remove("hidden");
      logoutBtn.classList.add("hidden");
      if (profileBtn) profileBtn.classList.add("hidden");
    }
  });
});
