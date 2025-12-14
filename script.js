import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { auth, db } from "./firebase.js";

// LOAD RESTAURANTS
async function loadRestaurants() {
  const container = document.getElementById("restaurant-list");
  if (!container) return;

  const snap = await getDocs(collection(db, "restaurants"));
  container.innerHTML = "";

  snap.forEach(rDoc => {
    const r = rDoc.data();
    container.innerHTML += `
      <article class="restaurant-card glass">
        <h3 class="restaurant-title">${r.name}</h3>
        <p class="restaurant-desc">${r.cuisine}</p>
        <button class="claim-btn" data-id="${rDoc.id}">Claim this restaurant</button>
      </article>
    `;
  });
}

// CLAIM RESTAURANT
document.addEventListener("click", async e => {
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
    createdAt: Date.now()
  });

  alert("Claim submitted. Waiting for admin approval.");
});

// LOAD CLAIMS (ADMIN)
async function loadClaims() {
  const list = document.getElementById("claim-list");
  if (!list) return;

  const snap = await getDocs(collection(db, "restaurantClaims"));
  list.innerHTML = "";

  snap.forEach(c => {
    const d = c.data();
    if (d.status !== "pending") return;

    list.innerHTML += `
      <li>
        ${d.userEmail}
        <button onclick="approveClaim('${c.id}','${d.restaurantId}','${d.userUid}')">
          Approve
        </button>
      </li>
    `;
  });
}

// APPROVE CLAIM
window.approveClaim = async (claimId, restaurantId, userUid) => {
  await updateDoc(doc(db, "restaurants", restaurantId), {
    ownerUid: userUid,
    isClaimed: true
  });

  await updateDoc(doc(db, "restaurantClaims", claimId), {
    status: "approved"
  });

  loadClaims();
};

// INITIAL LOAD
loadRestaurants();
loadClaims();

// Fade-in page on load
window.addEventListener("load", () => {
  document.body.style.opacity = "1";
});

// Smooth scrolling for in-page links
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener("click", e => {
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
    setTimeout(() => { location.href = "login.html"; }, 300);
  });
}

// Hero "Create Account" smooth redirect
const heroSignup = document.getElementById("hero-signup");
if (heroSignup) {
  heroSignup.addEventListener("click", e => {
    e.preventDefault();
    document.body.style.opacity = "0";
    setTimeout(() => { location.href = "signup.html"; }, 300);
  });
}
const profileBtn = document.getElementById("nav-profile");

onAuthStateChanged(auth, async user => {
  if (user) {
    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
    profileBtn.classList.remove("hidden"); // show profile
  } else {
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
    profileBtn.classList.add("hidden"); // hide profile
  }
});
