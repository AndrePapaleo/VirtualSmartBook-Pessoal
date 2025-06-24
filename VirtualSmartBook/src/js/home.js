import { auth, db } from './firebase-init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// --- Variáveis de Estado ---
let currentUserId = null;
let userData = {};

// --- Elementos do DOM ---
const myNotebooksGrid = document.getElementById('my-notebooks-grid');
const createNotebookButton = document.getElementById('create-notebook-button');
const logoutButton = document.getElementById('logout-button');

// --- Elementos do Modal ---
const vsbModal = document.getElementById('vsb-modal');
const vsbModalTitle = document.getElementById('vsb-modal-title');
const vsbModalMessage = document.getElementById('vsb-modal-message');
const vsbModalInput = document.getElementById('vsb-modal-input');
const vsbModalCancelBtn = document.getElementById('vsb-modal-cancel-btn');
const vsbModalConfirmBtn = document.getElementById('vsb-modal-confirm-btn');
let modalConfirmCallback = null;

// --- PONTO DE ENTRADA ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserId = user.uid;
        loadUserData();
    } else {
        window.location.href = 'login.html';
    }
});

// --- FUNÇÕES DE DADOS (FIRESTORE) ---
async function loadUserData() {
    const userDocRef = doc(db, "notebooks", currentUserId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
        userData = docSnap.data();
    } else {
        userData = { notebooks: {} };
    }
    renderNotebooks();
}

async function saveUserData() {
    const userDocRef = doc(db, "notebooks", currentUserId);
    await setDoc(userDocRef, userData);
}

// --- FUNÇÕES DE UI ---
function renderNotebooks() {
    myNotebooksGrid.innerHTML = '';
    if (Object.keys(userData.notebooks).length === 0) {
        myNotebooksGrid.innerHTML = `<p class="text-gray-500 col-span-full">Você ainda não tem cadernos. Clique em "Criar Novo Caderno" para começar!</p>`;
        return;
    }
    for (const notebookId in userData.notebooks) {
        const notebook = userData.notebooks[notebookId];
        const card = document.createElement('a');
        card.href = `caderno.html?notebookId=${notebookId}`;
        card.className = "notebook-card bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-lg transition-shadow";
        card.innerHTML = `
            <div class="notebook-card-cover bg-yellow-500 flex items-center justify-center">
                <i class="fas fa-book fa-3x text-white opacity-75"></i>
            </div>
            <div class="p-4 flex-grow">
                <h3 class="font-semibold text-gray-800 text-base truncate mb-1">${notebook.name}</h3>
            </div>
        `;
        myNotebooksGrid.appendChild(card);
    }
}

// --- LÓGICA DO MODAL (CORRIGIDA) ---
function showModal(title, message, showInput, confirmCallback) {
    vsbModalTitle.textContent = title;
    vsbModalMessage.textContent = message;
    vsbModalInput.value = '';
    vsbModalInput.classList.toggle('hidden', !showInput);
    vsbModal.classList.remove('hidden');
    modalConfirmCallback = confirmCallback;
}

function hideModal() {
    vsbModal.classList.add('hidden');
    modalConfirmCallback = null;
}

// --- EVENT LISTENERS ---
createNotebookButton.addEventListener('click', () => {
    showModal('Criar Novo Caderno', 'Qual será o nome do seu caderno?', true, async (notebookName) => {
        if (notebookName && notebookName.trim() !== "") {
            const newNotebookId = `notebook-${Date.now()}`;
            userData.notebooks[newNotebookId] = { name: notebookName.trim(), sections: {} };
            await saveUserData();
            renderNotebooks();
        }
    });
});

logoutButton.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        await signOut(auth);
        window.location.href = 'login.html';
    } catch (error) {
        console.error("Erro ao fazer logout:", error);
    }
});

vsbModalConfirmBtn.addEventListener('click', () => {
    if (modalConfirmCallback) {
        const inputValue = vsbModalInput.classList.contains('hidden') ? true : vsbModalInput.value;
        modalConfirmCallback(inputValue);
    }
    hideModal();
});

vsbModalCancelBtn.addEventListener('click', () => {
    hideModal();
});