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

  // auth utilities (demo)
  function getUsers(){ return JSON.parse(localStorage.getItem(LS_USERS) || '[]'); }
  function saveUser(u){ const arr = getUsers(); arr.push(u); localStorage.setItem(LS_USERS, JSON.stringify(arr)); }
  function setCurrentUser(u){ localStorage.setItem(LS_CURRENT, JSON.stringify(u)); updateNavForAuth(); }
  function getCurrentUser(){ return JSON.parse(localStorage.getItem(LS_CURRENT) || 'null'); }
  function logout(){ localStorage.removeItem(LS_CURRENT); updateNavForAuth(); }

  // NAV auth buttons behavior
  function updateNavForAuth(){
    const u = getCurrentUser();
    $$('.logout-btn').forEach(el => el.classList.toggle('hidden', !u));
    $$('.login-btn').forEach(el => el.classList.toggle('hidden', !!u));
  }
  // Hook nav login buttons to redirect
  $$('.login-btn').forEach(btn => btn.addEventListener('click', () => location.href = 'login.html'));

  $$('.logout-btn').forEach(btn => btn.addEventListener('click', () => { logout(); alert('Logged out'); location.href = 'index.html'; }));

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

    if (path === 'login.html') {
      const form = $('#login-form');
      form && form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = $('#login-email').value.trim();
        const password = $('#login-password').value;
        const users = getUsers();
        const found = users.find(u => u.email === email && u.password === password);
        if (found) {
          setCurrentUser({name: found.name, email: found.email, role: found.role || 'user'});
          alert('Login successful');
          location.href = 'index.html';
        } else {
          alert('Invalid credentials (demo). Try signing up.');
        }
      });
    }

    if (path === 'signup.html') {
      const form = $('#signup-form');
      form && form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = $('#signup-name').value.trim();
        const email = $('#signup-email').value.trim();
        const password = $('#signup-password').value;
        if (!name || !email || password.length < 6) {
          alert('Please complete the form and choose a password with at least 6 characters.');
          return;
        }
        // prevent duplicate emails
        const users = getUsers();
        if (users.find(u => u.email === email)) {
          alert('An account with that email already exists.');
          return;
        }
        const newUser = { name, email, password, role: 'user' };
        saveUser(newUser);
        setCurrentUser({ name, email, role: 'user' });
        alert('Account created. You are now logged in (demo).');
        location.href = 'index.html';
      });
    }

    if (path === 'admin.html') {
      // minimal admin interactions for demo
      const form = document.getElementById('admin-add-form');
      form && form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('admin-name').value.trim();
        const cuisine = document.getElementById('admin-cuisine').value.trim();
        if (!name) { alert('Provide a name'); return; }
        const list = JSON.parse(localStorage.getItem(LS_RESTAURANTS) || '[]');
        const id = 'r' + (Date.now());
        list.push({ id, name, cuisine, rating: 4.0, photo: 'img/placeholder.jpg', desc: 'Admin added (demo).' });
        localStorage.setItem(LS_RESTAURANTS, JSON.stringify(list));
        renderAdminList();
        form.reset();
      });
      renderAdminList();
    }
  }

  /* ----------------------------
    Restaurants list & modal
    ----------------------------*/
  function renderRestaurantList(){
    const container = $('#restaurant-list');
    if (!container) return;
    const list = JSON.parse(localStorage.getItem(LS_RESTAURANTS) || '[]');
    const q = (document.getElementById('filter-cuisine')?.value || '').toLowerCase();
    const sortBy = document.getElementById('sort-by')?.value || 'rating';

    let filtered = list.filter(r => {
      if (!q) return true;
      return r.name.toLowerCase().includes(q) || (r.cuisine || '').toLowerCase().includes(q);
    });

    filtered.sort((a,b) => {
      if (sortBy === 'rating') return (b.rating||0) - (a.rating||0);
      return 0;
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

  // modal handling
  function setupModal(){
    const modal = $('#restaurant-modal');
    const close = $('#modal-close');
    close && close.addEventListener('click', () => { modal.classList.add('hidden'); });
    modal && modal.addEventListener('click', (e)=> { if (e.target === modal) modal.classList.add('hidden'); });

    const form = $('#leave-review-form');
    form && form.addEventListener('submit', (e) => {
      e.preventDefault();
      const restId = form.dataset.restId;
      const rating = document.getElementById('review-rating').value;
      const comment = document.getElementById('review-comment').value.trim();
      const user = getCurrentUser();
      if (!user) { if (confirm('Login required to post a review. Login now?')) location.href = 'login.html'; return; }
      if (!rating || !comment) { alert('Complete the review form'); return; }
      const reviews = JSON.parse(localStorage.getItem(LS_REVIEWS) || '{}');
      reviews[restId] = reviews[restId] || [];
      reviews[restId].push({ rating: Number(rating), comment, author: user.name, created: Date.now() });
      localStorage.setItem(LS_REVIEWS, JSON.stringify(reviews));
      // clear fields
      form.reset();
      loadReviewsFor(restId);
      alert('Review submitted (demo).');
    });
  }

  function openRestaurantModal(id){
    const rest = (JSON.parse(localStorage.getItem(LS_RESTAURANTS) || '[]') || []).find(r => r.id === id);
    if (!rest) return;
    const modal = $('#restaurant-modal');
    const content = $('#modal-content');
    if (!modal || !content) return;
    content.innerHTML = `
      <div style="display:flex; gap:12px; align-items:center;">
        <img src="${rest.photo}" style="width:120px;height:120px;border-radius:10px;object-fit:cover" />
        <div>
          <h3 style="margin:0;color:var(--primary)">${rest.name}</h3>
          <div class="muted">${rest.cuisine || 'Various'} • ${rest.rating?.toFixed(1) || '—'} ★</div>
          <p class="muted" style="max-width:520px">${rest.desc || ''}</p>
        </div>
      </div>
    `;
    $('#leave-review-form').dataset.restId = id;
    loadReviewsFor(id);
    modal.classList.remove('hidden');
  }

  function loadReviewsFor(restId){
    const reviews = JSON.parse(localStorage.getItem(LS_REVIEWS) || '{}');
    const list = reviews[restId] || [];
    const container = $('#reviews-section');
    if (!container) return;
    container.innerHTML = `<h4>Reviews (${list.length})</h4>` + (list.length === 0 ? '<p class="muted">No reviews yet</p>' : list.map(r => `
      <div class="review-item">
        <div><span class="rating">${r.rating} ★</span> — <span class="muted">${r.author || 'Anonymous'}</span></div>
        <div style="margin-top:6px">${r.comment}</div>
      </div>
    `).join(''));
  }

  /* ----------------------------
     Admin helpers
     ----------------------------*/
  function renderAdminList(){
    const list = JSON.parse(localStorage.getItem(LS_RESTAURANTS) || '[]');
    const ul = $('#admin-rest-items');
    if (!ul) return;
    ul.innerHTML = list.map(r => `<li style="margin-bottom:8px">${r.name} <span class="muted">(${r.cuisine || '—'})</span></li>`).join('');
  }
})();
