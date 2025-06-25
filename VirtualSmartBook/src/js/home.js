import { auth, db } from './firebase-init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// --- Variáveis de Estado ---
let currentUserId = null;
let userData = {}; // Irá armazenar todos os dados do usuário, incluindo cadernos
const notebookCoverColors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 'bg-yellow-500', 'bg-indigo-500'];

// --- Elementos do DOM ---
const myNotebooksGrid = document.getElementById('my-notebooks-grid');
const createNotebookButton = document.getElementById('create-notebook-button');
const logoutButton = document.getElementById('logout-button'); // Botão de logout do dropdown
const userMenuButton = document.getElementById('user-menu-button');
const userMenuDropdown = document.getElementById('user-menu-dropdown');
const userDisplayName = document.getElementById('user-display-name');
const noNotebooksMessage = document.getElementById('no-notebooks-message'); // Mensagem quando não há cadernos
const quoteOfTheDayEl = document.getElementById('quote-of-the-day'); // Elemento para a citação do dia
const recentDocumentsGrid = document.getElementById('recent-documents-grid'); // Grade de documentos recentes
const noRecentDocumentsMessage = document.getElementById('no-recent-documents-message'); // Mensagem quando não há documentos recentes

// --- Elementos do Modal ---
const vsbModal = document.getElementById('vsb-modal');
const vsbModalTitle = document.getElementById('vsb-modal-title');
const vsbModalMessage = document.getElementById('vsb-modal-message');
const vsbModalInput = document.getElementById('vsb-modal-input');
const vsbModalCancelBtn = document.getElementById('vsb-modal-cancel-btn');
const vsbModalConfirmBtn = document.getElementById('vsb-modal-confirm-btn');
let modalConfirmCallback = null; // Callback para o botão de confirmação do modal

// --- Citações Motivacionais ---
const motivationalQuotes = [
    { quote: "A educação é a arma mais poderosa que você pode usar para mudar o mundo.", author: "Nelson Mandela" },
    { quote: "O único lugar onde o sucesso vem antes do trabalho é no dicionário.", author: "Vidal Sassoon" },
    { quote: "A mente que se abre a uma nova ideia jamais voltará ao seu tamanho original.", author: "Albert Einstein" },
    { quote: "Estude não para ter um diploma, mas para ter conhecimento.", author: "Autor Desconhecido" },
    { quote: "A persistência é o caminho do êxito.", author: "Charles Chaplin" },
    { quote: "Você ainda não percebeu que você é o único representante do seu sonho na Terra?", author: "Emicida" },
    { quote: "Parasita hoje, um coitado amanhã. Correria hoje, vitória amanhã.", author: "Racionais MC" },
    { quote: "Pensamento é força criadora, o amanhã é ilusório porque ainda não existe, o hoje é real. A oportunidade de mudança está no presente", author: "Racionais MC" }
];

// --- PONTO DE ENTRADA: Verifica o estado de autenticação do usuário ---
console.log("home.js: Iniciando onAuthStateChanged listener.");
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserId = user.uid;
        console.log("home.js: Usuário autenticado. UID:", currentUserId);

        const displayName = user.displayName || user.email.split('@')[0]; 
        console.log("home.js: Display Name:", displayName);
        
        document.getElementById('welcome-user-name').textContent = displayName; 
        if (userDisplayName) {
             userDisplayName.textContent = displayName;
             console.log("home.js: Nome de usuário no DOM atualizado.");
        } else {
             console.log("home.js: Elemento userDisplayName não encontrado no DOM.");
        }

        loadUserData(); 
        displayRandomQuote(); 
    } else {
        console.log("home.js: Usuário não autenticado. Redirecionando para login.html");
        window.location.href = 'login.html';
    }
});

// --- FUNÇÕES DE DADOS (FIRESTORE) ---
async function loadUserData() {
    if (!currentUserId) {
        console.error("loadUserData: currentUserId não definido.");
        return;
    }
    const userDocRef = doc(db, "notebooks", currentUserId);
    console.log("loadUserData: Tentando buscar documento do usuário no Firestore.");
    try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            userData = docSnap.data();
            console.log("loadUserData: Dados do usuário carregados:", userData);
        } else {
            userData = { notebooks: {} };
            console.log("loadUserData: Documento do usuário não encontrado, inicializando com notebooks vazios.");
        }
        renderNotebooks(); 
        renderRecentDocuments(); 
    } catch (error) {
        console.error("loadUserData: Erro ao carregar dados do usuário:", error);
    }
}

async function saveUserData() {
    if (!currentUserId) {
        console.error("saveUserData: currentUserId não definido. Não foi possível salvar dados.");
        return;
    }
    try {
        const userDocRef = doc(db, "notebooks", currentUserId);
        console.log("saveUserData: Tentando salvar dados no Firestore.", userData);
        await setDoc(userDocRef, userData);
        console.log("saveUserData: Alterações salvas no Firestore com sucesso.");
    } catch (error) {
        console.error("saveUserData: Erro ao salvar dados:", error);
    }
}

// --- FUNÇÕES DE UI ---
function renderNotebooks() {
    console.log("renderNotebooks: Iniciando renderização de Meus Cadernos.");
    myNotebooksGrid.innerHTML = ''; 
    
    const allNotebooks = Object.keys(userData.notebooks || {}).map(id => ({ id, ...userData.notebooks[id] }));

    const sortedNotebooks = allNotebooks.sort((a, b) => {
        const timestampA = parseInt(a.id.replace('notebook-', ''));
        const timestampB = parseInt(b.id.replace('notebook-', ''));
        return timestampA - timestampB; 
    });
    console.log("renderNotebooks: Cadernos ordenados por criação:", sortedNotebooks);


    if (sortedNotebooks.length === 0) {
        if (noNotebooksMessage) {
            noNotebooksMessage.classList.remove('hidden');
            console.log("renderNotebooks: Exibindo mensagem de nenhum caderno.");
        }
        return;
    } else {
        if (noNotebooksMessage) {
            noNotebooksMessage.classList.add('hidden');
            console.log("renderNotebooks: Escondendo mensagem de nenhum caderno.");
        }
    }

    sortedNotebooks.forEach(notebook => {
        const card = document.createElement('div'); // Mudado para div para comportar o menu
        card.className = "notebook-card bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-lg transition-shadow duration-200";

        const randomColor = notebookCoverColors[Math.floor(Math.random() * notebookCoverColors.length)];
        
        // Estrutura do card com link na capa e menu de opções
        card.innerHTML = `
            <a href="caderno.html?notebookId=${notebook.id}" class="block">
                <div class="notebook-card-cover ${randomColor} flex items-center justify-center">
                    <i class="fas fa-book fa-3x text-white opacity-75"></i>
                </div>
            </a>
            <div class="p-4 flex-grow relative"> <!-- Adicionado relative para o menu -->
                <a href="caderno.html?notebookId=${notebook.id}" class="block">
                    <h3 class="font-semibold text-gray-800 text-base truncate mb-1">${notebook.name}</h3>
                </a>
                <div class="absolute top-2 right-2">
                    <button class="text-gray-400 hover:text-gray-700 notebook-options-button" data-notebook-id="${notebook.id}">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div class="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-10 hidden notebook-options-dropdown">
                        <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rename-notebook-option" data-notebook-id="${notebook.id}">Renomear</a>
                        <a href="#" class="block px-4 py-2 text-sm text-red-600 hover:bg-red-50 delete-notebook-option" data-notebook-id="${notebook.id}">Excluir</a>
                    </div>
                </div>
            </div>
        `;
        myNotebooksGrid.appendChild(card);
        console.log("renderNotebooks: Card para", notebook.name, "adicionado.");
    });
}

function renderRecentDocuments() {
    console.log("renderRecentDocuments: Iniciando renderização.");
    recentDocumentsGrid.innerHTML = ''; 
    
    const allNotebooks = Object.keys(userData.notebooks || {}).map(id => ({ id, ...userData.notebooks[id] }));

    const notebooksToDisplay = allNotebooks
        .filter(notebook => notebook.lastModified)
        .sort((a, b) => b.lastModified - a.lastModified); 
    console.log("renderRecentDocuments: Cadernos ordenados para exibição:", notebooksToDisplay);

    if (notebooksToDisplay.length === 0) {
        if (noRecentDocumentsMessage) {
            noRecentDocumentsMessage.classList.remove('hidden');
            console.log("renderRecentDocuments: Exibindo mensagem de nenhum documento recente.");
        }
        return;
    } else {
        if (noRecentDocumentsMessage) {
            noRecentDocumentsMessage.classList.add('hidden');
            console.log("renderRecentDocuments: Escondendo mensagem de nenhum documento recente.");
        }
    }

    notebooksToDisplay.forEach(notebook => {
        const card = document.createElement('div'); // Mudado para div
        card.className = "notebook-card bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-lg transition-shadow duration-200";

        const randomColor = notebookCoverColors[Math.floor(Math.random() * notebookCoverColors.length)];
        const numPages = Object.keys(notebook.sections || {}).reduce((acc, sectionId) => {
            return acc + Object.keys(notebook.sections[sectionId].pages || {}).length;
        }, 0);
        
        const lastModifiedDate = new Date(notebook.lastModified).toLocaleDateString('pt-BR');

        card.innerHTML = `
            <a href="caderno.html?notebookId=${notebook.id}" class="block">
                <div class="notebook-card-cover ${randomColor} flex items-center justify-center">
                    <i class="fas fa-file-alt fa-3x text-white opacity-75"></i>
                </div>
            </a>
            <div class="p-4 flex-grow relative"> <!-- Adicionado relative para o menu -->
                <a href="caderno.html?notebookId=${notebook.id}" class="block">
                    <h3 class="font-semibold text-gray-800 text-base truncate mb-1">${notebook.name}</h3>
                </a>
                <p class="text-xs text-gray-500">${numPages} página(s)</p>
                <div class="absolute top-2 right-2">
                    <button class="text-gray-400 hover:text-gray-700 notebook-options-button" data-notebook-id="${notebook.id}">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div class="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-10 hidden notebook-options-dropdown">
                        <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rename-notebook-option" data-notebook-id="${notebook.id}">Renomear</a>
                        <a href="#" class="block px-4 py-2 text-sm text-red-600 hover:bg-red-50 delete-notebook-option" data-notebook-id="${notebook.id}">Excluir</a>
                    </div>
                </div>
                <div class="p-3 border-t border-gray-100 text-right -mx-4 -mb-4 mt-2"> <!-- Ajustado padding e margin -->
                    <span class="text-xs text-gray-400">Última mod.: ${lastModifiedDate}</span>
                </div>
            </div>
        `;
        recentDocumentsGrid.appendChild(card);
        console.log("renderRecentDocuments: Card para", notebook.name, "adicionado.");
    });
}

function displayRandomQuote() {
    if (quoteOfTheDayEl) {
        const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
        const { quote, author } = motivationalQuotes[randomIndex];
        quoteOfTheDayEl.innerHTML = `"${quote}" - <span class="font-semibold">${author}</span>`;
        console.log("displayRandomQuote: Citação atualizada.");
    } else {
        console.log("displayRandomQuote: Elemento quoteOfTheDayEl não encontrado.");
    }
}

// --- LÓGICA DO MODAL ---
function showModal(title, message, showInput, confirmCallback, inputValue = '') {
    if (!vsbModal) {
        console.error("showModal: Elemento vsbModal não encontrado.");
        return;
    }
    console.log("showModal: Abrindo modal com título:", title);

    vsbModalTitle.textContent = title;
    vsbModalMessage.textContent = message;
    vsbModalInput.value = inputValue; 
    vsbModalInput.classList.toggle('hidden', !showInput); 
    
    modalConfirmCallback = confirmCallback;

    vsbModal.classList.remove('hidden');
    void vsbModal.offsetWidth; 
    vsbModal.classList.remove('opacity-0', 'scale-95');
    vsbModal.querySelector('.modal-content').classList.remove('opacity-0', 'scale-95');
    if (showInput) vsbModalInput.focus(); 
}

function hideModal() {
    if (!vsbModal) return; 
    console.log("hideModal: Fechando modal.");

    vsbModal.classList.add('opacity-0', 'scale-95');
    setTimeout(() => {
        vsbModal.classList.add('hidden');
    }, 300); 
    
    modalConfirmCallback = null; 
    vsbModalInput.value = ''; 
}

// --- Funções para gerenciar cadernos na HOME ---
async function renameNotebook(notebookId, newName) {
    if (!currentUserId || !userData.notebooks[notebookId]) {
        console.error("renameNotebook: Dados inválidos para renomear.");
        showModal('Erro', 'Não foi possível renomear o caderno. Tente novamente.', false, () => {});
        return;
    }
    const oldName = userData.notebooks[notebookId].name;
    userData.notebooks[notebookId].name = newName.trim();
    userData.notebooks[notebookId].lastModified = Date.now(); // Atualiza a data de modificação
    await saveUserData();
    showModal('Sucesso!', `Caderno "${oldName}" renomeado para "${newName.trim()}" com sucesso!`, false, () => {});
    renderNotebooks();
    renderRecentDocuments();
}

async function deleteNotebook(notebookId) {
    if (!currentUserId || !userData.notebooks[notebookId]) {
        console.error("deleteNotebook: Dados inválidos para excluir.");
        showModal('Erro', 'Não foi possível excluir o caderno. Tente novamente.', false, () => {});
        return;
    }
    const notebookName = userData.notebooks[notebookId].name;
    delete userData.notebooks[notebookId];
    await saveUserData();
    showModal('Sucesso!', `Caderno "${notebookName}" excluído com sucesso.`, false, () => {});
    renderNotebooks();
    renderRecentDocuments();
}


// --- EVENT LISTENERS ---

// Listener para o botão "Criar Novo Caderno"
if (createNotebookButton) { 
    createNotebookButton.addEventListener('click', () => {
        console.log("createNotebookButton: Clicado no botão 'Criar Novo Caderno'.");
        showModal('Criar Novo Caderno', 'Qual será o nome do seu caderno?', true, async (notebookName) => {
            if (notebookName && notebookName.trim() !== "") {
                console.log("Modal Confirmado: Nome do caderno:", notebookName);
                const newNotebookId = `notebook-${Date.now()}`; 
                userData.notebooks[newNotebookId] = { name: notebookName.trim(), sections: {}, lastModified: Date.now() }; 
                console.log("Dados do usuário antes de salvar:", userData);
                await saveUserData(); 
                renderNotebooks(); 
                renderRecentDocuments(); 
            } else {
                console.log("Modal Cancelado ou Nome do caderno vazio.");
                showModal('Atenção', 'O nome do caderno não pode estar em branco.', false, () => {});
            }
        });
    });
} else {
    console.error("createNotebookButton: Elemento 'create-notebook-button' não encontrado no DOM.");
}

// Listener de delegação de eventos para os cartões de caderno (opções de Renomear/Excluir)
document.addEventListener('click', (event) => {
    // Clicou no botão de opções (...)
    if (event.target.closest('.notebook-options-button')) {
        const button = event.target.closest('.notebook-options-button');
        const dropdown = button.nextElementSibling; // O dropdown é o próximo irmão do botão

        // Fecha todos os outros dropdowns abertos
        document.querySelectorAll('.notebook-options-dropdown').forEach(d => {
            if (d !== dropdown) {
                d.classList.add('hidden');
            }
        });
        dropdown.classList.toggle('hidden'); // Alterna a visibilidade do dropdown clicado
        event.stopPropagation(); // Impede que o clique se propague e feche o dropdown imediatamente
    } 
    // Clicou em "Renomear"
    else if (event.target.closest('.rename-notebook-option')) {
        event.preventDefault(); // Previne o comportamento padrão do link
        const notebookId = event.target.dataset.notebookId;
        const currentName = userData.notebooks[notebookId].name;
        showModal('Renomear Caderno', 'Digite o novo nome para o caderno:', true, (newName) => {
            if (newName && newName.trim() !== "" && newName.trim() !== currentName) {
                renameNotebook(notebookId, newName.trim());
            } else if (newName.trim() === "") {
                showModal('Atenção', 'O nome do caderno não pode ser vazio.', false, () => {});
            }
        }, currentName); // Pré-preenche o input com o nome atual
        event.target.closest('.notebook-options-dropdown').classList.add('hidden'); // Fecha o dropdown
    } 
    // Clicou em "Excluir"
    else if (event.target.closest('.delete-notebook-option')) {
        event.preventDefault(); // Previne o comportamento padrão do link
        const notebookId = event.target.dataset.notebookId;
        const notebookName = userData.notebooks[notebookId].name;
        showModal('Excluir Caderno', `Tem certeza que deseja excluir o caderno "${notebookName}" e todo o seu conteúdo?`, false, (confirm) => {
            if (confirm) {
                deleteNotebook(notebookId);
            }
        });
        event.target.closest('.notebook-options-dropdown').classList.add('hidden'); // Fecha o dropdown
    } 
    // Clicou em qualquer lugar fora dos dropdowns de opções do caderno
    else if (!event.target.closest('.notebook-card')) {
        document.querySelectorAll('.notebook-options-dropdown').forEach(d => {
            d.classList.add('hidden');
        });
    }
});


// Listener para o botão de Logout (no dropdown de usuário)
if (logoutButton) {
    logoutButton.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log("logoutButton: Clicado no botão 'Sair'.");
        try {
            await signOut(auth); 
            console.log("Logout bem-sucedido. Redirecionando para login.html");
            window.location.href = 'login.html'; 
        } catch (error) {
            console.error("logoutButton: Erro ao fazer logout:", error);
        }
    });
} else {
    console.log("logoutButton: Elemento 'logout-button' não encontrado no DOM.");
}

// Listener para o botão de confirmação do modal (VSB Modal)
if (vsbModalConfirmBtn) {
    vsbModalConfirmBtn.addEventListener('click', () => {
        console.log("vsbModalConfirmBtn: Clicado no botão 'Confirmar' do modal.");
        if (modalConfirmCallback) {
            const inputValue = vsbModalInput.classList.contains('hidden') ? true : vsbModalInput.value;
            modalConfirmCallback(inputValue);
        }
        hideModal(); 
    });
} else {
    console.log("vsbModalConfirmBtn: Elemento 'vsb-modal-confirm-btn' não encontrado no DOM.");
}

// Listener para o botão de cancelamento do modal (VSB Modal)
if (vsbModalCancelBtn) {
    vsbModalCancelBtn.addEventListener('click', () => {
        console.log("vsbModalCancelBtn: Clicado no botão 'Cancelar' do modal.");
        hideModal(); 
    });
} else {
    console.log("vsbModalCancelBtn: Elemento 'vsb-modal-cancel-btn' não encontrado no DOM.");
}

// Listener para o botão do menu do usuário (para abrir/fechar o dropdown)
if (userMenuButton) {
    userMenuButton.addEventListener('click', (event) => {
        event.stopPropagation(); 
        if (userMenuDropdown) {
            userMenuDropdown.classList.toggle('hidden'); 
            console.log("userMenuButton: Dropdown de usuário alternado.");
        }
    });
} else {
    console.log("userMenuButton: Elemento 'user-menu-button' não encontrado no DOM.");
}

// Listener global para fechar o dropdown se clicar fora dele
document.addEventListener('click', (event) => {
    if (userMenuButton && userMenuDropdown && !userMenuButton.contains(event.target) && !userMenuDropdown.contains(event.target)) {
        userMenuDropdown.classList.add('hidden'); 
        console.log("Document click: Dropdown de usuário fechado (clique fora).");
    }
});

// Define o ano atual no rodapé
const currentYearEl = document.getElementById('currentYear');
if (currentYearEl) {
    currentYearEl.textContent = new Date().getFullYear();
} else {
    console.log("Elemento 'currentYear' não encontrado para atualizar o rodapé.");
}
