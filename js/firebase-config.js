import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCUHSwTph2yTD8HipTbQLfwD94yC3dAVl4",
  authDomain: "sphere-website-311be.firebaseapp.com",
  projectId: "sphere-website-311be",
  storageBucket: "sphere-website-311be.firebasestorage.app",
  messagingSenderId: "495675943081",
  appId: "1:495675943081:web:9b428a6f79dd6574c961b8",
  measurementId: "G-52XPWYMP6N"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
