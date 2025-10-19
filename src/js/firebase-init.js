// src/js/firebase-init.js

// Importa as funções que você precisa dos SDKs que você precisa
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
// NOVA IMPORTAÇÃO: Adicione a importação do Storage
import { getStorage } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-storage.js";

// A configuração do seu web app do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDUK99BLgEuV4hpqxbnnM1z-nj0cnS5M6o",
    authDomain: "vsb-first.firebaseapp.com",
    projectId: "vsb-first",
    storageBucket: "vsb-first.appspot.com", // Verifique se este é o bucket correto no seu projeto Firebase
    messagingSenderId: "153261737604",
    appId: "1:153261737604:web:5fa49e2c7c53ed99d5a4d1",
    measurementId: "G-DJBSLEKDDC"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta as instâncias dos serviços que você vai usar
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
// NOVA EXPORTAÇÃO: Exporta a instância do Storage
export const storage = getStorage(app);