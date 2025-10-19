import { auth, db } from './firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-functions.js";


// --- Variáveis de Estado Globais ---
const functions = getFunctions();
const summarizeText = httpsCallable(functions, 'summarizeText');
let userData = {};
let currentUserId = null;
let activeNotebookId = null;
let activeSectionId = null;
let activePageId = null;
let saveTimeout = null; 

// --- Elementos do DOM ---
const activeNotebookNameEl = document.getElementById('active-notebook-name');
const sectionsList = document.getElementById('sections-list');
const pagesList = document.getElementById('pages-list');
const addSectionBtn = document.getElementById('add-section-btn');
const addPageBtn = document.getElementById('add-page-btn');
const pageContent = document.getElementById('page-content');
const currentPageTitle = document.getElementById('current-page-title');
const pageRenderArea = document.getElementById('page-render-area'); // Wrapper para exportação
const customContextMenu = document.getElementById('custom-context-menu');
const summarizeBtn = document.getElementById('summarize-btn');


// --- Elementos do Modal ---
const confirmationModal = document.getElementById('confirmation-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalInput = document.getElementById('modal-input');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const modalConfirmBtn = document.getElementById('modal-confirm-btn');
let modalConfirmCallback = null;

// --- Elementos da Toolbar ---
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
const fontFamilySelect = document.getElementById('font-family-select');
const fontSizeSelect = document.getElementById('font-size-select');

// --- Botões de Gestão ---
const renameNotebookBtn = document.getElementById('rename-notebook-btn');
const deleteNotebookBtn = document.getElementById('delete-notebook-btn');
const renameSectionBtn = document.getElementById('rename-section-btn');
const deleteSectionBtn = document.getElementById('delete-section-btn');
const renamePageBtn = document.getElementById('rename-page-btn');
const deletePageBtn = document.getElementById('delete-page-btn');

// --- NOVOS Botões de Exportação ---
const exportMdBtn = document.getElementById('export-md-btn');
const exportPdfBtn = document.getElementById('export-pdf-btn');


// =================================================================================
// PONTO DE ENTRADA E LÓGICA DE DADOS
// =================================================================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserId = user.uid;
        const urlParams = new URLSearchParams(window.location.search);
        activeNotebookId = urlParams.get('notebookId');
        if (!activeNotebookId) {
            document.body.innerHTML = '<h1>Erro: ID do caderno não fornecido. Volte para a página inicial.</h1>';
            return;
        }
        loadInitialData();
    } else {
        window.location.href = 'login.html';
    }
});

async function loadInitialData() {
    const userDocRef = doc(db, "notebooks", currentUserId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
        userData = docSnap.data();
        if (userData.notebooks && userData.notebooks[activeNotebookId]) {
            userData.notebooks[activeNotebookId].lastModified = Date.now();
            await saveChanges(false);
        }
        render();
    } else {
        document.body.innerHTML = '<h1>Erro: Não foi possível carregar os dados do utilizador.</h1>';
    }
}

async function saveChanges(showStatus = true) {
    if (!currentUserId) return;
    if (saveStatusEl && showStatus) {
        saveStatusEl.textContent = 'A salvar...';
        saveStatusEl.classList.remove('text-gray-500', 'text-green-600', 'text-red-500');
        saveStatusEl.classList.add('text-blue-500');
    }
    try {
        const userDocRef = doc(db, "notebooks", currentUserId);
        await setDoc(userDocRef, userData);
        if (saveStatusEl && showStatus) {
            saveStatusEl.textContent = 'Salvo!';
            saveStatusEl.classList.remove('text-blue-500', 'text-red-500');
            saveStatusEl.classList.add('text-green-600');
            setTimeout(() => {
                saveStatusEl.textContent = '';
            }, 2000);
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
// FUNÇÕES DE EXPORTAÇÃO
// =================================================================================

function exportToMarkdown() {
    if (!activePageId) {
        showModal('Atenção', 'Por favor, selecione uma página para exportar.', false, () => {});
        return;
    }
    // Inicializa o serviço Turndown
    const turndownService = new TurndownService();
    // Para a exportação, juntamos o título e o conteúdo
    const completeHtml = `<h1>${currentPageTitle.textContent}</h1>${pageContent.innerHTML}`;
    const markdown = turndownService.turndown(completeHtml);
    
    const pageName = currentPageTitle.textContent || 'documento';
    // Cria um Blob (Binary Large Object) com o conteúdo Markdown
    const blob = new Blob([markdown], { type: 'text/markdown' });
    // Cria um link temporário para o download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${pageName.replace(/ /g, '_')}.md`; // Define o nome do ficheiro
    link.click(); // Simula o clique no link para iniciar o download
    URL.revokeObjectURL(link.href); // Liberta a memória do URL do objeto
}

function exportToPDF() {
    if (!activePageId) {
        showModal('Atenção', 'Por favor, selecione uma página para exportar.', false, () => {});
        return;
    }
    const { jsPDF } = window.jspdf;
    const pageName = currentPageTitle.textContent || 'documento';

    saveStatusEl.textContent = 'A gerar PDF...';
    saveStatusEl.classList.add('text-blue-500');

    // Usa html2canvas para capturar a área de renderização como uma imagem (canvas)
    html2canvas(pageRenderArea, {
        scale: 2, // Aumenta a resolução para melhor qualidade
        useCORS: true
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        
        let imgWidth = pdfWidth;
        let imgHeight = imgWidth / ratio;

        // Ajusta as dimensões da imagem para caber na página do PDF
        if (imgHeight > pdfHeight) {
            imgHeight = pdfHeight;
            imgWidth = imgHeight * ratio;
        }

        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(`${pageName.replace(/ /g, '_')}.pdf`);
        
        saveStatusEl.textContent = 'PDF gerado!';
        setTimeout(() => { saveStatusEl.textContent = ''; }, 2000);
    }).catch(err => {
        console.error("Erro ao gerar PDF:", err);
        saveStatusEl.textContent = 'Erro ao gerar PDF!';
        saveStatusEl.classList.add('text-red-500');
    });
}


// =================================================================================
// FUNÇÕES DE RENDERIZAÇÃO E GESTÃO
// =================================================================================

function render() {
    const notebook = userData.notebooks?.[activeNotebookId];
    if (!notebook) {
        window.location.href = 'home.html';
        return;
    }
    const sections = notebook.sections || {};
    if (Object.keys(sections).length > 0 && !sections[activeSectionId]) {
        activeSectionId = Object.keys(sections)[0];
    }
    if (Object.keys(sections).length === 0) activeSectionId = null;

    const activeSection = sections[activeSectionId];
    const pages = activeSection?.pages || {};
    if (Object.keys(pages).length > 0 && !pages[activePageId]) {
        activePageId = Object.keys(pages)[0];
    }
    if (Object.keys(pages).length === 0) activePageId = null;

    renderNotebookName(notebook.name);
    renderSectionsList(sections);
    renderPagesList(pages);
    renderPageContent();
    toggleManagementButtons();
}

function renderNotebookName(name) { activeNotebookNameEl.textContent = name; }

function renderSectionsList(sections) {
    sectionsList.innerHTML = '';
    if (Object.keys(sections).length === 0) {
        sectionsList.innerHTML = `<p class="text-gray-500 p-2 text-sm">Nenhuma secção.</p>`;
        return;
    }
    for (const sectionId in sections) {
        const div = document.createElement('div');
        div.className = `p-2 rounded-md hover:bg-gray-100 cursor-pointer ${activeSectionId === sectionId ? 'active-item' : ''}`;
        div.textContent = sections[sectionId].name;
        div.dataset.sectionId = sectionId;
        div.addEventListener('click', () => {
            if (activeSectionId !== sectionId) {
                activeSectionId = sectionId;
                activePageId = null;
                render();
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
        div.dataset.pageId = pageId;
        div.addEventListener('click', () => {
            if (activePageId !== pageId) {
                activePageId = pageId;
                render();
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

function toggleManagementButtons() {
    renameNotebookBtn.disabled = false;
    deleteNotebookBtn.disabled = false;
    renameSectionBtn.disabled = !activeSectionId;
    deleteSectionBtn.disabled = !activeSectionId;
    renamePageBtn.disabled = !activePageId;
    deletePageBtn.disabled = !activePageId;
}

function showModal(title, message, showInput, confirmCallback, inputValue = '') {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modalInput.value = inputValue;
    modalInput.classList.toggle('hidden', !showInput);
    confirmationModal.classList.remove('hidden');
    modalConfirmCallback = confirmCallback;
    if(showInput) modalInput.focus();
}

function hideModal() {
    confirmationModal.classList.add('hidden');
    modalConfirmCallback = null;
}



// =================================================================================
// EVENT LISTENERS
// =================================================================================

// --- NOVOS Event Listeners para Exportação ---
if (exportMdBtn) {
    exportMdBtn.addEventListener('click', exportToMarkdown);
}
if (exportPdfBtn) {
    exportPdfBtn.addEventListener('click', exportToPDF);
}

// --- Listeners de Gestão ---
addSectionBtn.addEventListener('click', () => {
    showModal('Criar Nova Secção', 'Qual será o nome da nova secção?', true, async (name) => {
        if (name && name.trim() !== "") {
            const id = `section-${Date.now()}`;
            const notebook = userData.notebooks[activeNotebookId];
            if (!notebook.sections) notebook.sections = {};
            notebook.sections[id] = { name: name.trim(), pages: {} };
            activeSectionId = id;
            activePageId = null;
            notebook.lastModified = Date.now();
            await saveChanges();
            render();
        }
    });
});

addPageBtn.addEventListener('click', () => {
    if (!activeSectionId) {
        showModal('Atenção', 'Por favor, selecione uma secção antes de adicionar uma página.', false, () => {});
        return;
    }
    showModal('Criar Nova Página', 'Qual será o nome da nova página?', true, async (name) => {
        if (name && name.trim() !== "") {
            const id = `page-${Date.now()}`;
            const section = userData.notebooks[activeNotebookId].sections[activeSectionId];
            if (!section.pages) section.pages = {};
            section.pages[id] = { name: name.trim(), content: '' };
            activePageId = id;
            userData.notebooks[activeNotebookId].lastModified = Date.now();
            await saveChanges();
            render();
        }
    });
});

renameNotebookBtn.addEventListener('click', () => {
    const currentName = userData.notebooks[activeNotebookId].name;
    showModal('Renomear Caderno', 'Novo nome para o caderno:', true, async (newName) => {
        if (newName && newName.trim() !== "" && newName.trim() !== currentName) {
            userData.notebooks[activeNotebookId].name = newName.trim();
            userData.notebooks[activeNotebookId].lastModified = Date.now();
            await saveChanges();
            renderNotebookName(newName.trim());
        }
    }, currentName);
});

deleteNotebookBtn.addEventListener('click', () => {
    const notebookName = userData.notebooks[activeNotebookId].name;
    showModal('Excluir Caderno', `Tem a certeza que deseja excluir o caderno "${notebookName}" e todo o seu conteúdo?`, false, async (confirm) => {
        if (confirm) {
            delete userData.notebooks[activeNotebookId];
            await saveChanges();
            window.location.href = 'home.html';
        }
    });
});

renameSectionBtn.addEventListener('click', () => {
    if (!activeSectionId) return;
    const currentName = userData.notebooks[activeNotebookId].sections[activeSectionId].name;
    showModal('Renomear Secção', 'Novo nome para a secção:', true, async (newName) => {
        if (newName && newName.trim() !== "" && newName.trim() !== currentName) {
            userData.notebooks[activeNotebookId].sections[activeSectionId].name = newName.trim();
            userData.notebooks[activeNotebookId].lastModified = Date.now();
            await saveChanges();
            render();
        }
    }, currentName);
});

deleteSectionBtn.addEventListener('click', () => {
    if (!activeSectionId) return;
    const sectionName = userData.notebooks[activeNotebookId].sections[activeSectionId].name;
    showModal('Excluir Secção', `Tem a certeza que deseja excluir a secção "${sectionName}" e todas as suas páginas?`, false, async (confirm) => {
        if (confirm) {
            delete userData.notebooks[activeNotebookId].sections[activeSectionId];
            userData.notebooks[activeNotebookId].lastModified = Date.now();
            const remainingSectionIds = Object.keys(userData.notebooks[activeNotebookId].sections);
            activeSectionId = remainingSectionIds.length > 0 ? remainingSectionIds[0] : null;
            activePageId = null;
            await saveChanges();
            render();
        }
    });
});

renamePageBtn.addEventListener('click', () => {
    if (!activePageId) return;
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

deletePageBtn.addEventListener('click', () => {
    if (!activePageId) return;
    const pageName = userData.notebooks[activeNotebookId].sections[activeSectionId].pages[activePageId].name;
    showModal('Excluir Página', `Tem a certeza que deseja excluir a página "${pageName}"?`, false, async (confirm) => {
        if (confirm) {
            delete userData.notebooks[activeNotebookId].sections[activeSectionId].pages[activePageId];
            userData.notebooks[activeNotebookId].lastModified = Date.now();
            const remainingPageIds = Object.keys(userData.notebooks[activeNotebookId].sections[activeSectionId].pages);
            activePageId = remainingPageIds.length > 0 ? remainingPageIds[0] : null;
            await saveChanges();
            render();
        }
    });
});

pageContent.addEventListener('input', () => {
    clearTimeout(saveTimeout);
    if (saveStatusEl) {
        saveStatusEl.textContent = 'A digitar...';
        saveStatusEl.classList.remove('text-green-600', 'text-red-500');
        saveStatusEl.classList.add('text-gray-500');
    }
    saveTimeout = setTimeout(async () => {
        if (!activePageId || !activeSectionId || !activeNotebookId) return;
        const page = userData.notebooks[activeNotebookId].sections[activeSectionId].pages[activePageId];
        if (page.content !== pageContent.innerHTML) {
            page.content = pageContent.innerHTML;
            userData.notebooks[activeNotebookId].lastModified = Date.now();
            await saveChanges();
        } else {
            if (saveStatusEl) {
                saveStatusEl.textContent = 'Salvo!';
                saveStatusEl.classList.remove('text-gray-500');
                saveStatusEl.classList.add('text-green-600');
                setTimeout(() => { saveStatusEl.textContent = ''; }, 2000);
            }
        }
    }, 1500);
});

modalConfirmBtn.addEventListener('click', () => {
    if (modalConfirmCallback) {
        const inputValue = modalInput.classList.contains('hidden') ? true : modalInput.value;
        modalConfirmCallback(inputValue);
    }
    hideModal();
});

modalCancelBtn.addEventListener('click', hideModal);

// --- Listeners de Formatação de Texto ---
document.execCommand('defaultParagraphSeparator', false, 'p');

if (boldBtn) boldBtn.addEventListener('click', () => document.execCommand('bold'));
if (italicBtn) italicBtn.addEventListener('click', () => document.execCommand('italic'));
if (underlineBtn) underlineBtn.addEventListener('click', () => document.execCommand('underline'));
if (strikethroughBtn) strikethroughBtn.addEventListener('click', () => document.execCommand('strikeThrough'));

if (headingSelect) {
    headingSelect.addEventListener('change', () => {
        document.execCommand('formatBlock', false, headingSelect.value);
        pageContent.focus();
    });
}

if (alignLeftBtn) alignLeftBtn.addEventListener('click', () => document.execCommand('justifyLeft'));
if (alignCenterBtn) alignCenterBtn.addEventListener('click', () => document.execCommand('justifyCenter'));
if (alignRightBtn) alignRightBtn.addEventListener('click', () => document.execCommand('justifyRight'));
if (alignJustifyBtn) alignJustifyBtn.addEventListener('click', () => document.execCommand('justifyFull'));

if (ulBtn) ulBtn.addEventListener('click', () => document.execCommand('insertUnorderedList'));
if (olBtn) olBtn.addEventListener('click', () => document.execCommand('insertOrderedList'));

if (removeFormatBtn) removeFormatBtn.addEventListener('click', () => document.execCommand('removeFormat'));

if (fontFamilySelect) {
    fontFamilySelect.addEventListener('change', () => {
        document.execCommand('fontName', false, fontFamilySelect.value);
        pageContent.focus();
    });
}

if (fontSizeSelect) {
    fontSizeSelect.addEventListener('change', () => {
        document.execCommand('fontSize', false, fontSizeSelect.value);
        pageContent.focus();
    });
}

// --- Lógica para o Resumo com Gemini ---

// 1. Ouve o evento de clique com o botão direito DENTRO da área de texto
pageContent.addEventListener('contextmenu', (event) => {
    event.preventDefault(); // Impede o menu padrão do navegador de aparecer
    const selectedText = window.getSelection().toString().trim();

    // 2. Se o usuário selecionou algum texto, mostra nosso menu personalizado
    if (selectedText.length > 20) { // Mostra só se o texto for relevante
        customContextMenu.style.top = `${event.pageY}px`;
        customContextMenu.style.left = `${event.pageX}px`;
        customContextMenu.classList.remove('hidden'); // Torna o menu visível
    }
});

// 3. Ouve o clique no nosso botão "Resumir Texto"
summarizeBtn.addEventListener('click', () => {
    const selectedText = window.getSelection().toString().trim();

    if (selectedText) {
        // Mostra um pop-up de "carregando"
        showModal('Gerando Resumo', 'Aguarde, estamos processando...', false, () => {});

        // 4. CHAMA A SUA CLOUD FUNCTION, enviando o texto selecionado
        summarizeText({ text: selectedText })
            .then((result) => {
                // 5. QUANDO A FUNÇÃO RETORNA O RESUMO, ele é exibido no pop-up
                const summary = result.data.summary;
                showModal('Resumo Gerado pela IA', summary, false, () => {});
            })
            .catch((error) => {
                // Se der erro, mostra uma mensagem de erro
                showModal('Erro', 'Não foi possível gerar o resumo.', false, () => {});
            });
    }
    customContextMenu.classList.add('hidden'); // Esconde o menu após o clique
});

// Bônus: Esconde o menu se o usuário clicar em qualquer outro lugar da página
document.addEventListener('click', () => {
    customContextMenu.classList.add('hidden');
});

// Última atualização para forçar o deploy.