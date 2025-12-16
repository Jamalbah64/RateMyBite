import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// DOM Elements
const profileEmail = document.getElementById("profile-email");
const profileRole = document.getElementById("profile-role");
const userReviews = document.getElementById("user-reviews");
const profileLogout = document.getElementById("profile-logout");
const loginBtn = document.getElementById("nav-login");
const logoutBtn = document.getElementById("nav-logout");
const profileBtn = document.getElementById("nav-profile");

// AUTH STATE
onAuthStateChanged(auth, async user => {
  if (user) {
    profileEmail.textContent = user.email;
    profileRole.textContent = "user"; // Optional: fetch from users collection

    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
    profileBtn.classList.remove("hidden");

    loadUserReviews(user.uid);
  } else {
    // Redirect to login if not logged in
    location.href = "login.html";
  }
});

// LOGOUT
profileLogout.onclick = async () => {
  await signOut(auth);
  location.href = "index.html";
};
logoutBtn.onclick = async () => {
  await signOut(auth);
  location.href = "index.html";
};

// LOAD USER REVIEWS
async function loadUserReviews(uid) {
  const q = query(
    collection(db, "reviews"),
    where("userUid", "==", uid),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);

  userReviews.innerHTML = "";
  snap.forEach(docSnap => {
    const r = docSnap.data();
    const div = document.createElement("div");
    div.className = "review-item glass";
    div.innerHTML = `<strong>${r.restaurantId}</strong> - <span class="rating">${"⭐".repeat(r.rating)}</span><p>${r.comment}</p>`;
    userReviews.appendChild(div);
  });
}
