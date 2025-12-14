import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const ADMIN_EMAIL = "ratemybiteadmin@gmail.com";
const path = location.pathname;

// ---------------- SIGNUP ----------------
if (path.endsWith("signup.html")) {
  const form = document.getElementById("signup-form");
  const emailInput = document.getElementById("signup-email");
  const passwordInput = document.getElementById("signup-password");

  if (form) {
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const email = emailInput.value.trim().toLowerCase();
      const password = passwordInput.value;

      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);

        // Assign role properly
        await setDoc(doc(db, "users", cred.user.uid), {
          email,
          role: email === ADMIN_EMAIL ? "admin" : "user",
          authorizedRestaurants: []
        });

        // Smooth transition to login page
        document.body.style.opacity = "0";
        setTimeout(() => { location.href = "login.html"; }, 300);

      } catch (err) {
        console.error(err);
        alert("Signup error: " + err.message);
      }
    });
  }

  const loginLink = document.getElementById("signup-login");
  if (loginLink) {
    loginLink.addEventListener("click", e => {
      e.preventDefault();
      document.body.style.opacity = "0";
      setTimeout(() => { location.href = "login.html"; }, 300);
    });
  }
}

// ---------------- LOGIN ----------------
if (path.endsWith("login.html")) {
  const form = document.getElementById("login-form");
  const emailInput = document.getElementById("login-email");
  const passwordInput = document.getElementById("login-password");

  if (form) {
    form.addEventListener("submit", async e => {
      e.preventDefault();
      try {
        await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);

        // Smooth transition to restaurants page
        document.body.style.opacity = "0";
        setTimeout(() => { location.href = "restaurants.html"; }, 300);

      } catch (err) {
        console.error(err);
        alert("Login error: " + err.message);
      }
    });
  }

  const signupLink = document.getElementById("login-signup");
  if (signupLink) {
    signupLink.addEventListener("click", e => {
      e.preventDefault();
      document.body.style.opacity = "0";
      setTimeout(() => { location.href = "signup.html"; }, 300);
    });
  }
}

// ---------------- AUTH STATE ----------------
onAuthStateChanged(auth, async user => {
  const loginBtn = document.getElementById("nav-login");
  const logoutBtn = document.getElementById("nav-logout");
  const profileBtn = document.getElementById("nav-profile");

  if (user) {
    if (loginBtn) loginBtn.classList.add("hidden");
    if (logoutBtn) logoutBtn.classList.remove("hidden");
    if (profileBtn) profileBtn.classList.remove("hidden");
  } else {
    if (loginBtn) loginBtn.classList.remove("hidden");
    if (logoutBtn) logoutBtn.classList.add("hidden");
    if (profileBtn) profileBtn.classList.add("hidden");
  }
});

// ---------------- LOGOUT ----------------
document.querySelectorAll(".logout-btn").forEach(btn => {
  btn.onclick = async () => {
    await signOut(auth);
    document.body.style.opacity = "0";
    setTimeout(() => { location.href = "index.html"; }, 300);
  };
});

// ---------------- PROFILE BUTTON ----------------
const profileBtn = document.getElementById("nav-profile");
if (profileBtn) {
  profileBtn.addEventListener("click", () => {
    document.body.style.opacity = "0";
    setTimeout(() => { location.href = "profile.html"; }, 300);
  });
}
