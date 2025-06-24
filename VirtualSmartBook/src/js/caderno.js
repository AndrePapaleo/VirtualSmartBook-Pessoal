import { auth, db } from './firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// --- Variáveis de Estado Globais ---
let userData = {};
let currentUserId = null;
let activeNotebookId = null;
let activeSectionId = null;
let activePageId = null;
let saveTimeout = null; // Para otimizar o salvamento do conteúdo

// --- Elementos do DOM ---
const activeNotebookNameEl = document.getElementById('active-notebook-name');
const sectionsList = document.getElementById('sections-list');
const pagesList = document.getElementById('pages-list');
const addSectionBtn = document.getElementById('add-section-btn');
const addPageBtn = document.getElementById('add-page-btn');
const pageContent = document.getElementById('page-content');
const currentPageTitle = document.getElementById('current-page-title');

// --- Elementos do Modal ---
const confirmationModal = document.getElementById('confirmation-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalInput = document.getElementById('modal-input');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const modalConfirmBtn = document.getElementById('modal-confirm-btn');
let modalConfirmCallback = null;

// =================================================================================
// PONTO DE ENTRADA PRINCIPAL
// =================================================================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserId = user.uid;
        const urlParams = new URLSearchParams(window.location.search);
        activeNotebookId = urlParams.get('notebookId');
        if (!activeNotebookId) {
            document.body.innerHTML = '<h1>Erro: ID do caderno não fornecido. Volte para a página inicial e tente novamente.</h1>';
            return;
        }
        loadInitialData();
    } else {
        window.location.href = 'login.html';
    }
});

// =================================================================================
// FUNÇÕES DE DADOS (COMUNICAÇÃO COM O FIRESTORE)
// =================================================================================
async function loadInitialData() {
    const userDocRef = doc(db, "notebooks", currentUserId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
        userData = docSnap.data();
        render(); // A função principal que desenha toda a tela
    } else {
        document.body.innerHTML = '<h1>Erro: Não foi possível carregar os dados do usuário.</h1>';
    }
}

async function saveChanges() {
    if (!currentUserId) return;
    try {
        const userDocRef = doc(db, "notebooks", currentUserId);
        await setDoc(userDocRef, userData);
        console.log("Alterações salvas no Firestore.");
    } catch (error) {
        console.error("Erro ao salvar dados:", error);
    }
}

// =================================================================================
// FUNÇÃO DE RENDERIZAÇÃO PRINCIPAL ("A Mágica Acontece Aqui")
// =================================================================================
function render() {
    const notebook = userData.notebooks?.[activeNotebookId];
    if (!notebook) {
        document.body.innerHTML = '<h1>Erro: Caderno não encontrado nos seus dados.</h1>';
        return;
    }

    // Define os IDs ativos se não estiverem definidos
    const sections = notebook.sections || {};
    if (Object.keys(sections).length > 0 && !sections[activeSectionId]) {
        activeSectionId = Object.keys(sections)[0];
    }

    const activeSection = sections[activeSectionId];
    const pages = activeSection?.pages || {};
    if (Object.keys(pages).length > 0 && !pages[activePageId]) {
        activePageId = Object.keys(pages)[0];
    } else if (Object.keys(pages).length === 0) {
        activePageId = null;
    }

    // Chama as sub-funções para desenhar cada parte da tela
    renderNotebookName(notebook.name);
    renderSectionsList(sections);
    renderPagesList(pages);
    renderPageContent();
}

// --- Sub-funções de Renderização ---
function renderNotebookName(name) {
    activeNotebookNameEl.textContent = name;
}

function renderSectionsList(sections) {
    sectionsList.innerHTML = '';
    if (Object.keys(sections).length === 0) {
        sectionsList.innerHTML = `<p class="text-gray-500 p-2 text-sm">Nenhuma seção.</p>`;
        return;
    }
    for (const sectionId in sections) {
        const div = document.createElement('div');
        div.className = `p-2 rounded-md hover:bg-gray-100 cursor-pointer ${activeSectionId === sectionId ? 'active-item' : ''}`;
        div.textContent = sections[sectionId].name;
        div.addEventListener('click', () => {
            if (activeSectionId !== sectionId) {
                activeSectionId = sectionId;
                activePageId = null; // Reseta a página ao trocar de seção
                render(); // Redesenha a tela inteira com a nova seleção
            }
        });
        sectionsList.appendChild(div);
    }
}

function renderPagesList(pages) {
    pagesList.innerHTML = '';
    if (!activeSectionId || Object.keys(pages).length === 0) {
        pagesList.innerHTML = `<p class="text-gray-500 p-2 text-sm">Nenhuma página.</p>`;
        return;
    }
    for (const pageId in pages) {
        const div = document.createElement('div');
        div.className = `p-2 rounded-md hover:bg-gray-100 cursor-pointer ${activePageId === pageId ? 'active-item' : ''}`;
        div.textContent = pages[pageId].name;
        div.addEventListener('click', () => {
            if (activePageId !== pageId) {
                activePageId = pageId;
                render(); // Redesenha a tela inteira com a nova seleção
            }
        });
        pagesList.appendChild(div);
    }
}

function renderPageContent() {
    const page = userData.notebooks?.[activeNotebookId]?.sections?.[activeSectionId]?.pages?.[activePageId];
    if (page) {
        currentPageTitle.textContent = page.name;
        pageContent.innerHTML = page.content || '';
        pageContent.contentEditable = 'true';
    } else {
        currentPageTitle.textContent = 'Nenhuma página selecionada';
        pageContent.innerHTML = '<p class="text-gray-400">Selecione uma página ou crie uma nova para começar.</p>';
        pageContent.contentEditable = 'false';
    }
}

// =================================================================================
// LÓGICA DOS MODAIS E EVENTOS (AGORA FUNCIONAL)
// =================================================================================
function showModal(title, message, showInput, confirmCallback) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modalInput.value = '';
    modalInput.classList.toggle('hidden', !showInput);
    confirmationModal.classList.remove('hidden');
    modalConfirmCallback = confirmCallback;
    if(showInput) modalInput.focus();
}

function hideModal() {
    confirmationModal.classList.add('hidden');
    modalConfirmCallback = null;
}

// --- Listeners dos Botões ---
addSectionBtn.addEventListener('click', () => {
    showModal('Criar Nova Seção', 'Qual será o nome da nova seção?', true, async (name) => {
        if (name && name.trim() !== "") {
            const id = `section-${Date.now()}`;
            const notebook = userData.notebooks[activeNotebookId];
            if (!notebook.sections) notebook.sections = {};
            notebook.sections[id] = { name: name.trim(), pages: {} };
            activeSectionId = id; // Ativa a nova seção
            activePageId = null; // Nenhuma página na nova seção
            await saveChanges();
            render(); // Redesenha tudo
        }
    });
});

addPageBtn.addEventListener('click', () => {
    if (!activeSectionId) {
        alert("Por favor, selecione uma seção antes de adicionar uma página.");
        return;
    }
    showModal('Criar Nova Página', 'Qual será o nome da nova página?', true, async (name) => {
        if (name && name.trim() !== "") {
            const id = `page-${Date.now()}`;
            const section = userData.notebooks[activeNotebookId].sections[activeSectionId];
            if (!section.pages) section.pages = {};
            section.pages[id] = { name: name.trim(), content: '' };
            activePageId = id; // Ativa a nova página
            await saveChanges();
            render(); // Redesenha tudo
        }
    });
});

pageContent.addEventListener('input', () => {
    // Salva o conteúdo 1.5 segundos depois que o usuário para de digitar
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
        if (!activePageId) return;
        const page = userData.notebooks[activeNotebookId].sections[activeSectionId].pages[activePageId];
        if (page.content !== pageContent.innerHTML) {
            page.content = pageContent.innerHTML;
            await saveChanges();
        }
    }, 1500);
});

// Listeners dos botões do modal
modalConfirmBtn.addEventListener('click', () => {
    if (modalConfirmCallback) {
        modalConfirmCallback(modalInput.value);
    }
    hideModal();
});

modalCancelBtn.addEventListener('click', hideModal);

// Listeners dos botões de formatação de texto
document.getElementById('bold-btn').addEventListener('click', () => document.execCommand('bold'));
document.getElementById('italic-btn').addEventListener('click', () => document.execCommand('italic'));
document.getElementById('underline-btn').addEventListener('click', () => document.execCommand('underline'));