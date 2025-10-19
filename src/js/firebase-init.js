// src/js/firebase-init.js

// Importa as funções que você precisa dos SDKs que você precisa
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
// Linha corrigida: importa getAuth e GoogleAuthProvider juntos
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// A configuração do seu web app do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDUK99BLgEuV4hpqxbnnM1z-nj0cnS5M6o",
    authDomain: "vsb-first.firebaseapp.com",
    projectId: "vsb-first",
    storageBucket: "vsb-first.firebasestorage.app",
    messagingSenderId: "153261737604",
    appId: "1:153261737604:web:5fa49e2c7c53ed99d5a4d1",
    measurementId: "G-DJBSLEKDDC"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta as instâncias dos serviços que você vai usar
export const auth = getAuth(app);
export const db = getFirestore(app);
// Nova exportação necessária para o login com Google
export const googleProvider = new GoogleAuthProvider();