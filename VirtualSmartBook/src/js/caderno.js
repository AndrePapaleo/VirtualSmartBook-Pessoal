// Estrutura de dados para armazenar notebooks, seções e páginas
let appData = {
    notebooks: {
        'notebook1': {
            name: 'Meu Primeiro Notebook',
            sections: {}
        }
    },
    activeNotebook: 'notebook1',
    activeSection: null,
    activePage: null
};

// Elementos do DOM
const sectionsList = document.getElementById('sections-list');
const pagesList = document.getElementById('pages-list');
const addSectionBtn = document.getElementById('add-section-btn');
const addPageBtn = document.getElementById('add-page-btn');
const pageContent = document.getElementById('page-content');
const currentPageTitle = document.getElementById('current-page-title');

const fontFamilySelect = document.getElementById('font-family-select');
const fontSizeSelect = document.getElementById('font-size-select');
const boldBtn = document.getElementById('bold-btn');
const italicBtn = document.getElementById('italic-btn');
const underlineBtn = document.getElementById('underline-btn');

const confirmationModal = document.getElementById('confirmation-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalInput = document.getElementById('modal-input');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const modalConfirmBtn = document.getElementById('modal-confirm-btn');

// Função para gerar um ID único
function generateUniqueId() {
    return 'id-' + Math.random().toString(36).substr(2, 9);
}

// Função para exibir o modal de confirmação/prompt
function showModal(title, message, showInput, confirmCallback) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    if (showInput) {
        modalInput.classList.remove('hidden');
        modalInput.value = ''; // Limpa o input
    } else {
        modalInput.classList.add('hidden');
    }
    confirmationModal.classList.remove('hidden');

    // Remove listeners anteriores para evitar duplicação
    modalConfirmBtn.onclick = null;
    modalCancelBtn.onclick = null;

    modalConfirmBtn.onclick = () => {
        confirmationModal.classList.add('hidden');
        confirmCallback(showInput ? modalInput.value : true);
    };
    modalCancelBtn.onclick = () => {
        confirmationModal.classList.add('hidden');
        confirmCallback(false); // Indica cancelamento
    };
}

// Renderiza as seções na sidebar
function renderSections() {
    sectionsList.innerHTML = '';
    const sections = appData.notebooks[appData.activeNotebook].sections;
    const sectionIds = Object.keys(sections);

    if (sectionIds.length === 0) {
        sectionsList.innerHTML = '<p class="text-gray-500 p-2 text-sm">Nenhuma seção. Adicione uma!</p>';
        appData.activeSection = null;
        renderPages(); // Limpa as páginas se não houver seções
        return;
    }

    sectionIds.forEach(sectionId => {
        const section = sections[sectionId];
        const sectionDiv = document.createElement('div');
        sectionDiv.className = `flex items-center justify-between p-2 rounded-md hover:bg-gray-100 transition-colors duration-200 cursor-pointer ${appData.activeSection === sectionId ? 'active-item' : ''}`;
        sectionDiv.setAttribute('data-section-id', sectionId);

        sectionDiv.innerHTML = `
            <span class="flex-grow truncate">${section.name}</span>
            <div class="flex space-x-1">
                <button class="rename-section-btn text-gray-500 hover:text-blue-500 px-1 py-0.5 rounded-md text-sm" title="Renomear">
                    ✏️
                </button>
                <button class="delete-section-btn text-gray-500 hover:text-red-500 px-1 py-0.5 rounded-md text-sm" title="Excluir">
                    🗑️
                </button>
            </div>
        `;
        sectionsList.appendChild(sectionDiv);

        // Event listener para selecionar seção
        sectionDiv.querySelector('span').addEventListener('click', () => {
            appData.activeSection = sectionId;
            appData.activePage = null; // Reseta a página ativa ao mudar de seção
            renderSections();
            renderPages();
            loadPageContent(); // Carrega conteúdo da página ativa (ou limpa)
        });

        // Event listener para renomear seção
        sectionDiv.querySelector('.rename-section-btn').addEventListener('click', (e) => {
            e.stopPropagation(); // Evita que o clique propague para a seleção da seção
            showModal('Renomear Seção', `Digite o novo nome para "${section.name}":`, true, (newName) => {
                if (newName && newName.trim() !== '') {
                    sections[sectionId].name = newName.trim();
                    renderSections();
                }
            });
        });

        // Event listener para excluir seção
        sectionDiv.querySelector('.delete-section-btn').addEventListener('click', (e) => {
            e.stopPropagation(); // Evita que o clique propague para a seleção da seção
            showModal('Excluir Seção', `Tem certeza que deseja excluir a seção "${section.name}" e todas as suas páginas?`, false, (confirmed) => {
                if (confirmed) {
                    delete sections[sectionId];
                    if (appData.activeSection === sectionId) {
                        appData.activeSection = null;
                        appData.activePage = null;
                    }
                    renderSections();
                    renderPages();
                    loadPageContent(); // Limpa o conteúdo da página
                }
            });
        });
    });

    // Se não houver seção ativa, mas houver seções, selecione a primeira
    if (!appData.activeSection && sectionIds.length > 0) {
        appData.activeSection = sectionIds[0];
        renderSections(); // Renderiza novamente para destacar a seção ativa
    }
}

// Renderiza as páginas na sidebar
function renderPages() {
    pagesList.innerHTML = '';
    const currentSection = appData.notebooks[appData.activeNotebook].sections[appData.activeSection];

    if (!currentSection || Object.keys(currentSection.pages).length === 0) {
        pagesList.innerHTML = '<p class="text-gray-500 p-2 text-sm">Nenhuma página. Adicione uma!</p>';
        appData.activePage = null;
        loadPageContent(); // Limpa o conteúdo da página
        return;
    }

    const pageIds = Object.keys(currentSection.pages);
    pageIds.forEach(pageId => {
        const page = currentSection.pages[pageId];
        const pageDiv = document.createElement('div');
        pageDiv.className = `flex items-center justify-between p-2 rounded-md hover:bg-gray-100 transition-colors duration-200 cursor-pointer ${appData.activePage === pageId ? 'active-item' : ''}`;
        pageDiv.setAttribute('data-page-id', pageId);

        pageDiv.innerHTML = `
            <span class="flex-grow truncate">${page.name}</span>
            <div class="flex space-x-1">
                <button class="rename-page-btn text-gray-500 hover:text-blue-500 px-1 py-0.5 rounded-md text-sm" title="Renomear">
                    ✏️
                </button>
                <button class="delete-page-btn text-gray-500 hover:text-red-500 px-1 py-0.5 rounded-md text-sm" title="Excluir">
                    🗑️
                </button>
            </div>
        `;
        pagesList.appendChild(pageDiv);

        // Event listener para selecionar página
        pageDiv.querySelector('span').addEventListener('click', () => {
            appData.activePage = pageId;
            renderPages();
            loadPageContent();
        });

        // Event listener para renomear página
        pageDiv.querySelector('.rename-page-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            showModal('Renomear Página', `Digite o novo nome para "${page.name}":`, true, (newName) => {
                if (newName && newName.trim() !== '') {
                    page.name = newName.trim();
                    renderPages();
                    if (appData.activePage === pageId) {
                        currentPageTitle.textContent = newName.trim();
                    }
                }
            });
        });

        // Event listener para excluir página
        pageDiv.querySelector('.delete-page-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            showModal('Excluir Página', `Tem certeza que deseja excluir a página "${page.name}"?`, false, (confirmed) => {
                if (confirmed) {
                    delete currentSection.pages[pageId];
                    if (appData.activePage === pageId) {
                        appData.activePage = null;
                    }
                    renderPages();
                    loadPageContent();
                }
            });
        });
    });

    // Se não houver página ativa, mas houver páginas, selecione a primeira
    if (!appData.activePage && pageIds.length > 0) {
        appData.activePage = pageIds[0];
        renderPages(); // Renderiza novamente para destacar a página ativa
    }
}

// Carrega o conteúdo da página ativa na área de edição
function loadPageContent() {
    const currentSection = appData.notebooks[appData.activeNotebook].sections[appData.activeSection];
    if (currentSection && appData.activePage) {
        const page = currentSection.pages[appData.activePage];
        currentPageTitle.textContent = page.name;
        pageContent.innerHTML = page.content;
        pageContent.focus(); // Coloca o foco na área de edição
    } else {
        currentPageTitle.textContent = 'Selecione uma Página';
        pageContent.innerHTML = '<p class="text-gray-500">Selecione uma seção e uma página para começar a escrever.</p>';
    }
}

// Salva o conteúdo da página da área de edição
function savePageContent() {
    const currentSection = appData.notebooks[appData.activeNotebook].sections[appData.activeSection];
    if (currentSection && appData.activePage) {
        currentSection.pages[appData.activePage].content = pageContent.innerHTML;
    }
}

// Adiciona uma nova seção
addSectionBtn.addEventListener('click', () => {
    showModal('Nova Seção', 'Digite o nome da nova seção:', true, (sectionName) => {
        if (sectionName && sectionName.trim() !== '') {
            const newSectionId = generateUniqueId();
            appData.notebooks[appData.activeNotebook].sections[newSectionId] = {
                name: sectionName.trim(),
                pages: {}
            };
            appData.activeSection = newSectionId; // Ativa a nova seção
            appData.activePage = null; // Reseta a página ativa
            renderSections();
            renderPages();
            loadPageContent(); // Limpa o conteúdo da página
        }
    });
});

// Adiciona uma nova página
addPageBtn.addEventListener('click', () => {
    if (!appData.activeSection) {
        showModal('Erro', 'Por favor, selecione ou adicione uma seção primeiro.', false, () => {});
        return;
    }
    showModal('Nova Página', 'Digite o nome da nova página:', true, (pageName) => {
        if (pageName && pageName.trim() !== '') {
            const newPageId = generateUniqueId();
            const currentSection = appData.notebooks[appData.activeNotebook].sections[appData.activeSection];
            currentSection.pages[newPageId] = {
                name: pageName.trim(),
                content: ''
            };
            appData.activePage = newPageId; // Ativa a nova página
            renderPages();
            loadPageContent();
        }
    });
});

// Event listener para salvar o conteúdo da página quando o foco sai
pageContent.addEventListener('blur', savePageContent);

// Funções de formatação de texto
function applyFormat(command, value = null) {
    document.execCommand(command, false, value);
    pageContent.focus(); // Mantém o foco na área de edição
}

fontFamilySelect.addEventListener('change', (e) => {
    applyFormat('fontName', e.target.value);
});

fontSizeSelect.addEventListener('change', (e) => {
    // document.execCommand('fontSize') usa valores de 1 a 7.
    // Precisamos mapear nossos px para esses valores ou usar styleWithCSS.
    // Usaremos styleWithCSS para aplicar o estilo diretamente.
    document.execCommand('styleWithCSS', false, true);
    applyFormat('fontSize', e.target.value);
    document.execCommand('styleWithCSS', false, false); // Desativa após aplicar
});

boldBtn.addEventListener('click', () => applyFormat('bold'));
italicBtn.addEventListener('click', () => applyFormat('italic'));
underlineBtn.addEventListener('click', () => applyFormat('underline'));

// Inicializa o aplicativo
function initializeApp() {
    // Adiciona uma seção e uma página padrão se não houver nenhuma
    if (Object.keys(appData.notebooks[appData.activeNotebook].sections).length === 0) {
        const defaultSectionId = generateUniqueId();
        appData.notebooks[appData.activeNotebook].sections[defaultSectionId] = {
            name: 'Primeira Seção',
            pages: {}
        };
        appData.activeSection = defaultSectionId;

        const defaultPageId = generateUniqueId();
        appData.notebooks[appData.activeNotebook].sections[defaultSectionId].pages[defaultPageId] = {
            name: 'Bem-vindo!',
            content: '<p></p>'
        };
        appData.activePage = defaultPageId;
    }

    renderSections();
    renderPages();
    loadPageContent();
}

// Chama a função de inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initializeApp);
