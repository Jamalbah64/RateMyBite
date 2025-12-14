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

let currentRestaurantId = null;

// ------------------- AUTH STATE -------------------
onAuthStateChanged(auth, async user => {
  if (user) {
    // Show profile
    const snap = await getDocs(collection(db, "users"));
    profileContainer.style.display = "block";
    profileEmail.textContent = user.email;
    profileRole.textContent = "user"; // optional: fetch role if stored

    // Navbar buttons
    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
  } else {
    profileContainer.style.display = "none";
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
  }
});

profileLogout.onclick = async () => {
  await signOut(auth);
  location.reload();
};

logoutBtn.onclick = async () => {
  await signOut(auth);
  location.reload();
};

// ------------------- LOAD RESTAURANTS -------------------
async function loadRestaurants() {
  const snap = await getDocs(collection(db, "restaurants"));
  restaurantList.innerHTML = "";
  snap.forEach(docSnap => {
    const r = docSnap.data();
    const div = document.createElement("div");
    div.className = "restaurant-card glass";
    div.innerHTML = `
      <h3 class="restaurant-title">${r.name}</h3>
      <p class="restaurant-desc">${r.cuisine}</p>
      <button class="view-btn" data-id="${docSnap.id}">View & Review</button>
    `;
    restaurantList.appendChild(div);
  });
}

// ------------------- MODAL -------------------
restaurantList.addEventListener("click", async e => {
  if (!e.target.classList.contains("view-btn")) return;
  currentRestaurantId = e.target.dataset.id;

  const snap = await getDocs(collection(db, "restaurants"));
  const rDoc = snap.docs.find(d => d.id === currentRestaurantId);
  const r = rDoc.data();

  modalContent.innerHTML = `<h3>${r.name}</h3><p>${r.cuisine}</p>`;
  modal.classList.remove("hidden");
  loadReviews(currentRestaurantId);
});

closeModalBtn.onclick = () => modal.classList.add("hidden");

// ------------------- REVIEWS -------------------
async function loadReviews(restaurantId) {
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
    div.innerHTML = `<strong>${r.userEmail}</strong> - <span class="rating">${"⭐".repeat(r.rating)}</span><p>${r.comment}</p>`;
    reviewsSection.appendChild(div);
  });
}

// ------------------- ADD REVIEW -------------------
reviewForm.addEventListener("submit", async e => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return alert("You must be logged in to post a review.");

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

// ------------------- INIT -------------------
loadRestaurants();
