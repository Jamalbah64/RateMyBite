import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBuXCNdpVUd-9IVvMTPy91wgE-jPIt43f8",
  authDomain: "ratemybite-32a5f.firebaseapp.com",
  projectId: "ratemybite-32a5f",
  storageBucket: "ratemybite-32a5f.appspot.com",
  messagingSenderId: "497204249372",
  appId: "1:497204249372:web:508ffe2e5cf25a4de930d9"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
