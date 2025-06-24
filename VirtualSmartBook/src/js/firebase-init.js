// src/js/firebase-init.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDUK99BLgEuV4hpqxbnnM1z-nj0cnS5M6o",
    authDomain: "vsb-first.firebaseapp.com",
    projectId: "vsb-first",
    storageBucket: "vsb-first.firebasestorage.app",
    messagingSenderId: "153261737604",
    appId: "1:153261737604:web:5fa49e2c7c53ed99d5a4d1",
    measurementId: "G-DJBSLEKDDC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export a instância dos serviços que você vai usar
export const auth = getAuth(app);
export const db = getFirestore(app);