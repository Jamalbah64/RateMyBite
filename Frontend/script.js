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

/**
 * Backend base URL for MongoDB API.
 * - If frontend is served from the same Express server, you can return "".
 * - If frontend runs on 3000 and backend runs on 4000, use "http://localhost:4000".
 */
function apiBase() {
  return "http://localhost:4000";
}

function initMapIfNeeded() {
  // Restaurants page uses <div id="map">
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

/**
 * Home map init (index.html uses <div id="home-map">)
 * This is separate from restaurants page map to avoid collisions.
 */
let homeMap = null;
let homeMarkersLayer = null;

function initHomeMapIfNeeded() {
  const el = document.getElementById("home-map");
  if (!el) return;

  if (typeof L === "undefined") {
    console.error("Leaflet (L) is not loaded. Check Leaflet script order in index.html.");
    return;
  }

  if (homeMap) return;

  // Default view (Boston)
  homeMap = L.map("home-map").setView([42.3601, -71.0589], 11);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(homeMap);

  homeMarkersLayer = L.layerGroup().addTo(homeMap);
}

function isValidCoord(lat, lng) {
  const a = Number(lat);
  const b = Number(lng);
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a) <= 90 && Math.abs(b) <= 180;
}

/**
 * Accepts:
 * - Firestore format: { lat, lng }
 * - MongoDB format: { location: { type:"Point", coordinates:[lng, lat] } }
 */
function getLatLngAny(r) {
  // Case 1: lat/lng fields exist
  if (r && r.lat != null && r.lng != null && isValidCoord(r.lat, r.lng)) {
    return { lat: Number(r.lat), lng: Number(r.lng) };
  }

  // Case 2: GeoJSON location.coordinates exists ([lng, lat])
  const coords = r?.location?.coordinates;
  if (Array.isArray(coords) && coords.length === 2) {
    const lng = Number(coords[0]);
    const lat = Number(coords[1]);
    if (isValidCoord(lat, lng)) return { lat, lng };
  }

  return null;
}

function escapeHtml(str) {
  return String(str ?? "")
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

  // Map init (restaurants page)
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

    const pos = getLatLngAny(r);
    if (markersLayer && pos) {
      const marker = L.marker([pos.lat, pos.lng]).addTo(markersLayer);

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

      bounds.push([pos.lat, pos.lng]);
    }
  });

  // Fit map to markers
  if (map && bounds.length > 0) {
    map.fitBounds(bounds, { padding: [30, 30] });
  }
}

// ===========================
// HOME SEARCH + HOME MAP (MongoDB backend)
// ===========================

/**
 * Cache to avoid refetching on every keypress.
 * - If you want "always latest", you can skip caching and fetch every time.
 */
let homeRestaurantsCache = null;

/**
 * Fetch restaurants from backend (MongoDB).
 * Returns array (and caches it).
 */
async function fetchHomeRestaurantsFromBackend() {
  // If already fetched, reuse
  if (Array.isArray(homeRestaurantsCache)) return homeRestaurantsCache;

  const res = await fetch(`${apiBase()}/api/restaurants`);
  if (!res.ok) throw new Error("Failed to fetch restaurants from backend");

  const restaurants = await res.json();
  homeRestaurantsCache = Array.isArray(restaurants) ? restaurants : [];
  return homeRestaurantsCache;
}

/**
 * Render markers on home map, using MongoDB restaurant objects.
 * If keyword is provided, filter by name/cuisine/address.
 */
function renderHomeMapMarkers(restaurants, keyword = "") {
  if (!homeMap || !homeMarkersLayer) return;

  homeMarkersLayer.clearLayers();
  const bounds = [];

  const q = keyword.trim().toLowerCase();

  const filtered = (q.length === 0)
    ? restaurants
    : restaurants.filter((r) => {
        const name = String(r?.name ?? "").toLowerCase();
        const cuisine = String(r?.cuisine ?? r?.category ?? "").toLowerCase();
        const addr = String(r?.address ?? "").toLowerCase();
        return name.includes(q) || cuisine.includes(q) || addr.includes(q);
      });

  filtered.forEach((r) => {
    const pos = getLatLngAny(r);
    if (!pos) return;

    const name = escapeHtml(r.name ?? "Unnamed");
    const cuisine = escapeHtml(r.cuisine ?? r.category ?? "");
    const addr = escapeHtml(r.address ?? "");

    const marker = L.marker([pos.lat, pos.lng]).addTo(homeMarkersLayer);
    marker.bindPopup(`
      <div style="min-width:200px;">
        <div style="font-weight:700; margin-bottom:6px;">${name}</div>
        <div style="opacity:.85; margin-bottom:6px;">${cuisine}</div>
        ${addr ? `<div style="font-size:13px;">${addr}</div>` : ""}
      </div>
    `);

    bounds.push([pos.lat, pos.lng]);
  });

  // Fit home map to markers
  if (bounds.length > 0) {
    homeMap.fitBounds(bounds, { padding: [30, 30] });
  }
}

/**
 * Load home map markers from backend (MongoDB).
 * Optionally pass keyword to filter.
 */
async function loadHomeMapRestaurants(keyword = "") {
  // Only run on Home page
  const el = document.getElementById("home-map");
  if (!el) return;

  initHomeMapIfNeeded();
  if (!homeMap || !homeMarkersLayer) return;

  try {
    const restaurants = await fetchHomeRestaurantsFromBackend();
    renderHomeMapMarkers(restaurants, keyword);
  } catch (err) {
    console.error("[Home Map] Failed to load restaurants:", err);
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
  // restaurants page (Firestore list + map pins)
  loadRestaurants();

  // home page (MongoDB pins)
  loadHomeMapRestaurants();

  // home page search (MongoDB filter -> pins update)
  const globalSearch = document.getElementById("global-search");
  if (globalSearch) {
    // Trigger once to warm cache (optional; harmless)
    fetchHomeRestaurantsFromBackend().catch(() => {});

    // Update pins as user types
    globalSearch.addEventListener("input", (e) => {
      loadHomeMapRestaurants(e.target.value);
    });

    // Optional: press Enter -> jump to restaurants page with query (if you want)
    // globalSearch.addEventListener("keydown", (e) => {
    //   if (e.key === "Enter") {
    //     const q = encodeURIComponent(globalSearch.value.trim());
    //     location.href = `restaurants.html?q=${q}`;
    //   }
    // });
  }

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
