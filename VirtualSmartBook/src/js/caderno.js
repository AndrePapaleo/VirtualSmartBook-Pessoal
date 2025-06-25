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

// --- Novos Elementos da Toolbar (já existentes, apenas re-referenciados para clareza) ---
const saveStatusEl = document.getElementById('save-status');
const boldBtn = document.getElementById('bold-btn');
const italicBtn = document.getElementById('italic-btn');
const underlineBtn = document.getElementById('underline-btn');
const strikethroughBtn = document.getElementById('strikethrough-btn');
const headingSelect = document.getElementById('heading-select');
const alignLeftBtn = document.getElementById('align-left-btn');
const alignCenterBtn = document.getElementById('align-center-btn');
const alignRightBtn = document.getElementById('align-right-btn');
const alignJustifyBtn = document.getElementById('align-justify-btn');
const ulBtn = document.getElementById('ul-btn');
const olBtn = document.getElementById('ol-btn');
const removeFormatBtn = document.getElementById('remove-format-btn');

// --- Novos Botões de Gerenciamento (Caderno, Seção, Página) ---
const renameNotebookBtn = document.getElementById('rename-notebook-btn'); // NOVO
const deleteNotebookBtn = document.getElementById('delete-notebook-btn'); // NOVO
const renameSectionBtn = document.getElementById('rename-section-btn');
const deleteSectionBtn = document.getElementById('delete-section-btn');
const renamePageBtn = document.getElementById('rename-page-btn');
const deletePageBtn = document.getElementById('delete-page-btn');


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
        // Ao carregar um caderno, atualiza seu lastModified para a data atual
        if (userData.notebooks && userData.notebooks[activeNotebookId]) {
            userData.notebooks[activeNotebookId].lastModified = Date.now();
            await saveChanges(false); // Salva essa atualização imediatamente, sem exibir "Salvo!"
        }
        render(); // A função principal que desenha toda a tela
    } else {
        document.body.innerHTML = '<h1>Erro: Não foi possível carregar os dados do usuário.</h1>';
    }
}

async function saveChanges(showStatus = true) {
    if (!currentUserId) return;
    if (saveStatusEl && showStatus) {
        saveStatusEl.textContent = 'Salvando...';
        saveStatusEl.classList.remove('text-gray-500', 'text-green-600', 'text-red-500'); // Garante que classes anteriores são removidas
        saveStatusEl.classList.add('text-blue-500');
    }
    try {
        const userDocRef = doc(db, "notebooks", currentUserId);
        await setDoc(userDocRef, userData);
        console.log("Alterações salvas no Firestore.");
        if (saveStatusEl && showStatus) {
            saveStatusEl.textContent = 'Salvo!';
            saveStatusEl.classList.remove('text-blue-500', 'text-red-500');
            saveStatusEl.classList.add('text-green-600');
            setTimeout(() => {
                saveStatusEl.textContent = '';
            }, 2000); // Limpa a mensagem após 2 segundos
        }
    } catch (error) {
        console.error("Erro ao salvar dados:", error);
        if (saveStatusEl && showStatus) {
            saveStatusEl.textContent = 'Erro ao salvar!';
            saveStatusEl.classList.remove('text-blue-500', 'text-green-600');
            saveStatusEl.classList.add('text-red-500');
        }
    }
}

// =================================================================================
// FUNÇÃO DE RENDERIZAÇÃO PRINCIPAL ("A Mágica Acontece Aqui")
// =================================================================================
function render() {
    const notebook = userData.notebooks?.[activeNotebookId];
    if (!notebook) {
        // Se o caderno não existe (ex: foi excluído), redireciona
        window.location.href = 'home.html';
        return;
    }

    // Define os IDs ativos se não estiverem definidos
    const sections = notebook.sections || {};
    if (Object.keys(sections).length > 0 && !sections[activeSectionId]) {
        activeSectionId = Object.keys(sections)[0];
    }
    // Se não há seções, zera activeSectionId
    if (Object.keys(sections).length === 0) {
        activeSectionId = null;
    }


    const activeSection = sections[activeSectionId];
    const pages = activeSection?.pages || {};
    if (Object.keys(pages).length > 0 && !pages[activePageId]) {
        activePageId = Object.keys(pages)[0];
    }
    // Se não há páginas na seção ativa, zera activePageId
    if (Object.keys(pages).length === 0) {
        activePageId = null;
    }

    // Chama as sub-funções para desenhar cada parte da tela
    renderNotebookName(notebook.name);
    renderSectionsList(sections);
    renderPagesList(pages);
    renderPageContent();

    // Desabilita/habilita botões de gerenciar com base na seleção
    toggleManagementButtons();
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
        div.dataset.sectionId = sectionId; // Armazena o ID no dataset
        div.addEventListener('click', () => {
            if (activeSectionId !== sectionId) {
                activeSectionId = sectionId;
                activePageId = null; // Reseta a página ao trocar de seção
                // Atualiza o lastModified do caderno quando uma seção é clicada
                if (userData.notebooks && userData.notebooks[activeNotebookId]) {
                    userData.notebooks[activeNotebookId].lastModified = Date.now();
                    saveChanges(false); // Salva essa atualização
                }
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
        div.dataset.pageId = pageId; // Armazena o ID no dataset
        div.addEventListener('click', () => {
            if (activePageId !== pageId) {
                activePageId = pageId;
                // Atualiza o lastModified do caderno quando uma página é clicada
                if (userData.notebooks && userData.notebooks[activeNotebookId]) {
                    userData.notebooks[activeNotebookId].lastModified = Date.now();
                    saveChanges(false); // Salva essa atualização
                }
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
        pageContent.focus(); // Coloca o foco na área de edição
    } else {
        currentPageTitle.textContent = 'Nenhuma página selecionada';
        pageContent.innerHTML = '<p class="text-gray-400">Selecione uma página ou crie uma nova para começar.</p>';
        pageContent.contentEditable = 'false';
    }
}

function toggleManagementButtons() {
    // Botões de Caderno (sempre habilitados nesta página, pois um caderno ativo é obrigatório)
    if (renameNotebookBtn) renameNotebookBtn.disabled = false;
    if (deleteNotebookBtn) deleteNotebookBtn.disabled = false;

    // Botões de Seção
    const hasSections = Object.keys(userData.notebooks?.[activeNotebookId]?.sections || {}).length > 0;
    if (renameSectionBtn) renameSectionBtn.disabled = !activeSectionId || !hasSections;
    if (deleteSectionBtn) deleteSectionBtn.disabled = !activeSectionId || !hasSections;

    // Botões de Página
    const hasPages = Object.keys(userData.notebooks?.[activeNotebookId]?.sections?.[activeSectionId]?.pages || {}).length > 0;
    if (renamePageBtn) renamePageBtn.disabled = !activePageId || !hasPages;
    if (deletePageBtn) deletePageBtn.disabled = !activePageId || !hasPages;
}


// =================================================================================
// LÓGICA DOS MODAIS E EVENTOS
// =================================================================================
function showModal(title, message, showInput, confirmCallback, inputValue = '') {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modalInput.value = inputValue; // Define o valor inicial
    modalInput.classList.toggle('hidden', !showInput);
    confirmationModal.classList.remove('hidden');
    modalConfirmCallback = confirmCallback;
    if(showInput) modalInput.focus();
}

function hideModal() {
    confirmationModal.classList.add('hidden');
    modalConfirmCallback = null;
}

// --- Listeners dos Botões de Ação (Adicionar) ---
addSectionBtn.addEventListener('click', () => {
    showModal('Criar Nova Seção', 'Qual será o nome da nova seção?', true, async (name) => {
        if (name && name.trim() !== "") {
            const id = `section-${Date.now()}`;
            const notebook = userData.notebooks[activeNotebookId];
            if (!notebook.sections) notebook.sections = {};
            notebook.sections[id] = { name: name.trim(), pages: {} };
            activeSectionId = id; // Ativa a nova seção
            activePageId = null; // Nenhuma página na nova seção
            notebook.lastModified = Date.now(); // Atualiza o lastModified ao criar nova seção
            await saveChanges();
            render(); // Redesenha tudo
        }
    });
});

addPageBtn.addEventListener('click', () => {
    if (!activeSectionId) {
        showModal('Atenção', 'Por favor, selecione uma seção antes de adicionar uma página.', false, () => {});
        return;
    }
    showModal('Criar Nova Página', 'Qual será o nome da nova página?', true, async (name) => {
        if (name && name.trim() !== "") {
            const id = `page-${Date.now()}`;
            const section = userData.notebooks[activeNotebookId].sections[activeSectionId];
            if (!section.pages) section.pages = {};
            section.pages[id] = { name: name.trim(), content: '' };
            activePageId = id; // Ativa a nova página
            userData.notebooks[activeNotebookId].lastModified = Date.now(); // Atualiza o lastModified ao criar nova página
            await saveChanges();
            render(); // Redesenha tudo
        }
    });
});

// --- Listeners dos Botões de Gerenciamento (Caderno, Seção, Página) ---

// Renomear Caderno
if (renameNotebookBtn) {
    renameNotebookBtn.addEventListener('click', () => {
        const currentName = userData.notebooks[activeNotebookId].name;
        showModal('Renomear Caderno', 'Novo nome para o caderno:', true, async (newName) => {
            if (newName && newName.trim() !== "" && newName.trim() !== currentName) {
                userData.notebooks[activeNotebookId].name = newName.trim();
                userData.notebooks[activeNotebookId].lastModified = Date.now();
                await saveChanges();
                renderNotebookName(newName.trim()); // Apenas atualiza o nome exibido
            }
        }, currentName);
    });
}

// Excluir Caderno
if (deleteNotebookBtn) {
    deleteNotebookBtn.addEventListener('click', () => {
        const notebookName = userData.notebooks[activeNotebookId].name;
        showModal('Excluir Caderno', `Tem certeza que deseja excluir o caderno "${notebookName}" e todo o seu conteúdo?`, false, async (confirm) => {
            if (confirm) {
                delete userData.notebooks[activeNotebookId];
                // Não há lastModified aqui pois o caderno foi excluído.
                await saveChanges();
                window.location.href = 'home.html'; // Redireciona para a home após exclusão
            }
        });
    });
}

// Renomear Seção
if (renameSectionBtn) {
    renameSectionBtn.addEventListener('click', () => {
        if (!activeSectionId) {
            showModal('Atenção', 'Por favor, selecione uma seção para renomear.', false, () => {});
            return;
        }
        const currentName = userData.notebooks[activeNotebookId].sections[activeSectionId].name;
        showModal('Renomear Seção', 'Novo nome para a seção:', true, async (newName) => {
            if (newName && newName.trim() !== "" && newName.trim() !== currentName) {
                userData.notebooks[activeNotebookId].sections[activeSectionId].name = newName.trim();
                userData.notebooks[activeNotebookId].lastModified = Date.now();
                await saveChanges();
                render();
            }
        }, currentName);
    });
}

// Excluir Seção
if (deleteSectionBtn) {
    deleteSectionBtn.addEventListener('click', () => {
        if (!activeSectionId) {
            showModal('Atenção', 'Por favor, selecione uma seção para excluir.', false, () => {});
            return;
        }
        const sectionName = userData.notebooks[activeNotebookId].sections[activeSectionId].name;
        showModal('Excluir Seção', `Tem certeza que deseja excluir a seção "${sectionName}" e todas as suas páginas?`, false, async (confirm) => {
            if (confirm) {
                delete userData.notebooks[activeNotebookId].sections[activeSectionId];
                userData.notebooks[activeNotebookId].lastModified = Date.now();

                // Após exclusão, tentar selecionar a próxima seção ou a anterior
                const remainingSectionIds = Object.keys(userData.notebooks[activeNotebookId].sections);
                if (remainingSectionIds.length > 0) {
                    activeSectionId = remainingSectionIds[0]; // Seleciona a primeira seção restante
                } else {
                    activeSectionId = null; // Nenhuma seção restante
                    activePageId = null;
                }
                await saveChanges();
                render();
            }
        });
    });
}

// Renomear Página
if (renamePageBtn) {
    renamePageBtn.addEventListener('click', () => {
        if (!activePageId) {
            showModal('Atenção', 'Por favor, selecione uma página para renomear.', false, () => {});
            return;
        }
        const currentPageName = userData.notebooks[activeNotebookId].sections[activeSectionId].pages[activePageId].name;
        showModal('Renomear Página', 'Novo nome para a página:', true, async (newName) => {
            if (newName && newName.trim() !== "" && newName.trim() !== currentPageName) {
                userData.notebooks[activeNotebookId].sections[activeSectionId].pages[activePageId].name = newName.trim();
                userData.notebooks[activeNotebookId].lastModified = Date.now();
                await saveChanges();
                render();
            }
        }, currentPageName);
    });
}

// Excluir Página
if (deletePageBtn) {
    deletePageBtn.addEventListener('click', () => {
        if (!activePageId) {
            showModal('Atenção', 'Por favor, selecione uma página para excluir.', false, () => {});
            return;
        }
        const pageName = userData.notebooks[activeNotebookId].sections[activeSectionId].pages[activePageId].name;
        showModal('Excluir Página', `Tem certeza que deseja excluir a página "${pageName}"?`, false, async (confirm) => {
            if (confirm) {
                delete userData.notebooks[activeNotebookId].sections[activeSectionId].pages[activePageId];
                userData.notebooks[activeNotebookId].lastModified = Date.now();

                // Após exclusão, tentar selecionar a próxima página ou a primeira da seção
                const remainingPageIds = Object.keys(userData.notebooks[activeNotebookId].sections[activeSectionId].pages);
                if (remainingPageIds.length > 0) {
                    activePageId = remainingPageIds[0]; // Seleciona a primeira página restante
                } else {
                    activePageId = null; // Nenhuma página restante na seção
                }
                await saveChanges();
                render();
            }
        });
    });
}


pageContent.addEventListener('input', () => {
    // Salva o conteúdo 1.5 segundos depois que o usuário para de digitar
    clearTimeout(saveTimeout);
    if (saveStatusEl) {
        saveStatusEl.textContent = 'Digitando...';
        saveStatusEl.classList.remove('text-green-600', 'text-red-500');
        saveStatusEl.classList.add('text-gray-500');
    }

    saveTimeout = setTimeout(async () => {
        if (!activePageId || !activeSectionId || !activeNotebookId) return;
        const page = userData.notebooks[activeNotebookId].sections[activeSectionId].pages[activePageId];
        if (page.content !== pageContent.innerHTML) {
            page.content = pageContent.innerHTML;
            userData.notebooks[activeNotebookId].lastModified = Date.now(); // Atualiza o lastModified ao editar conteúdo
            await saveChanges();
        } else {
            if (saveStatusEl) {
                saveStatusEl.textContent = 'Salvo!'; // Se não houve mudança real, apenas indica salvo
                saveStatusEl.classList.remove('text-gray-500');
                saveStatusEl.classList.add('text-green-600');
                setTimeout(() => {
                    saveStatusEl.textContent = '';
                }, 2000);
            }
        }
    }, 1500);
});

// Listeners dos botões do modal
modalConfirmBtn.addEventListener('click', () => {
    if (modalConfirmCallback) {
        // Se o input não estiver visível, passa true como confirmação (para modais de sim/não)
        // Caso contrário, passa o valor do input
        const inputValue = modalInput.classList.contains('hidden') ? true : modalInput.value;
        modalConfirmCallback(inputValue);
    }
    hideModal();
});

modalCancelBtn.addEventListener('click', hideModal);

// --- Listeners dos botões de formatação de texto (execCommand) ---
document.execCommand('defaultParagraphSeparator', false, 'p'); // Garante que a quebra de linha seja um <p>

// Basic
if (boldBtn) boldBtn.addEventListener('click', () => document.execCommand('bold'));
if (italicBtn) italicBtn.addEventListener('click', () => document.execCommand('italic'));
if (underlineBtn) underlineBtn.addEventListener('click', () => document.execCommand('underline'));
if (strikethroughBtn) strikethroughBtn.addEventListener('click', () => document.execCommand('strikeThrough'));

// Headings
if (headingSelect) {
    headingSelect.addEventListener('change', () => {
        document.execCommand('formatBlock', false, headingSelect.value);
        pageContent.focus(); // Mantém o foco na área de edição
    });
}

// Alignment
if (alignLeftBtn) alignLeftBtn.addEventListener('click', () => document.execCommand('justifyLeft'));
if (alignCenterBtn) alignCenterBtn.addEventListener('click', () => document.execCommand('justifyCenter'));
if (alignRightBtn) alignRightBtn.addEventListener('click', () => document.execCommand('justifyRight'));
if (alignJustifyBtn) alignJustifyBtn.addEventListener('click', () => document.execCommand('justifyFull'));

// Lists
if (ulBtn) ulBtn.addEventListener('click', () => document.execCommand('insertUnorderedList'));
if (olBtn) olBtn.addEventListener('click', () => document.execCommand('insertOrderedList'));

// Clear Formatting
if (removeFormatBtn) removeFormatBtn.addEventListener('click', () => document.execCommand('removeFormat'));


// --- Funcionalidade de seleção de fonte e tamanho ---
const fontFamilySelect = document.getElementById('font-family-select');
const fontSizeSelect = document.getElementById('font-size-select');

if (fontFamilySelect) {
    fontFamilySelect.addEventListener('change', () => {
        document.execCommand('fontName', false, fontFamilySelect.value);
        // Atualiza o lastModified do caderno ao mudar a fonte (com debouncing)
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(async () => {
            if (activeNotebookId) {
                userData.notebooks[activeNotebookId].lastModified = Date.now();
                await saveChanges();
            }
        }, 500); // Curto delay para não salvar a cada mudança de fonte
        pageContent.focus(); // Mantém o foco na área de edição
    });
}

if (fontSizeSelect) {
    fontSizeSelect.addEventListener('change', () => {
        // execCommand 'fontSize' usa um valor de 1 a 7.
        // O valor do select é mapeado para esses números.
        document.execCommand('fontSize', false, fontSizeSelect.value);
        // Atualiza o lastModified do caderno ao mudar o tamanho da fonte (com debouncing)
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(async () => {
            if (activeNotebookId) {
                userData.notebooks[activeNotebookId].lastModified = Date.now();
                await saveChanges();
            }
        }, 500); // Curto delay para não salvar a cada mudança de tamanho
        pageContent.focus(); // Mantém o foco na área de edição
    });
}
