// Elementos da UI
const sectionList = document.getElementById('section-list');
const addSectionBtn = document.getElementById('add-section-btn');
const renameSectionInput = document.getElementById('rename-section-input');

const pageList = document.getElementById('page-list');
const addPageBtn = document.getElementById('add-page-btn');
const currentSectionNamePages = document.getElementById('current-section-name-pages');

const pageTitleInput = document.getElementById('page-title-input');
const contentEditor = document.getElementById('content-editor');

const fontFamilySelect = document.getElementById('font-family-select');
const fontSizeInput = document.getElementById('font-size-input');
const boldBtn = document.getElementById('bold-btn');
const italicBtn = document.getElementById('italic-btn');
const underlineBtn = document.getElementById('underline-btn');
const textColorPicker = document.getElementById('text-color-picker');
const clearFormatBtn = document.getElementById('clear-format-btn');

const currentSectionIndicator = document.getElementById('current-section-indicator');
const currentPageIndicator = document.getElementById('current-page-indicator');


// Dados da aplicação (em memória)
let appData = {
    sections: [], // { id: 'uuid', name: 'Nome da Seção', pages: [], activePageIndex: -1 }
    activeSectionId: null,
};

// --- Funções Utilitárias ---
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// --- Funções de Renderização ---
function renderSections() {
    sectionList.innerHTML = ''; // Limpa a lista atual
    if (appData.sections.length === 0) {
        sectionList.innerHTML = '<li class="text-gray-500 text-sm">Nenhuma seção criada.</li>';
    }
    appData.sections.forEach((section, index) => {
        const listItem = document.createElement('li');
        listItem.className = `p-2 rounded-md cursor-pointer flex justify-between items-center list-item ${section.id === appData.activeSectionId ? 'active' : ''}`;
        listItem.textContent = section.name;
        listItem.dataset.sectionId = section.id;

        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'space-x-1';

        const renameBtn = document.createElement('button');
        renameBtn.innerHTML = '<i class="fas fa-edit text-xs"></i>';
        renameBtn.className = 'text-gray-500 hover:text-indigo-600 p-1';
        renameBtn.title = 'Renomear Seção';
        renameBtn.onclick = (e) => {
            e.stopPropagation();
            promptRenameSection(section.id, section.name);
        };

        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt text-xs"></i>';
        deleteBtn.className = 'text-gray-500 hover:text-red-600 p-1';
        deleteBtn.title = 'Excluir Seção';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteSection(section.id);
        };
        
        controlsDiv.appendChild(renameBtn);
        controlsDiv.appendChild(deleteBtn);
        listItem.appendChild(controlsDiv);

        listItem.addEventListener('click', () => {
            selectSection(section.id);
        });
        sectionList.appendChild(listItem);
    });
    addPageBtn.disabled = !appData.activeSectionId; // Habilita/desabilita botão de adicionar página
}

function renderPages() {
    pageList.innerHTML = ''; // Limpa a lista atual
    const activeSection = appData.sections.find(s => s.id === appData.activeSectionId);

    if (!activeSection) {
        currentSectionNamePages.textContent = 'Nenhuma seção selecionada';
        pageList.innerHTML = '<li class="text-gray-500 text-sm">Selecione uma seção para ver as páginas.</li>';
        clearEditor();
        return;
    }

    currentSectionNamePages.textContent = `Em: ${activeSection.name}`;
    currentSectionIndicator.textContent = `Seção: ${activeSection.name}`;

    if (activeSection.pages.length === 0) {
        pageList.innerHTML = '<li class="text-gray-500 text-sm">Nenhuma página nesta seção.</li>';
        clearEditor(); // Limpa o editor se não houver páginas
        currentPageIndicator.textContent = '';
    }

    activeSection.pages.forEach((page, index) => {
        const listItem = document.createElement('li');
        listItem.className = `p-2 rounded-md cursor-pointer flex justify-between items-center list-item ${index === activeSection.activePageIndex ? 'active' : ''}`;
        listItem.textContent = page.name;
        listItem.dataset.pageIndex = index;

        const deletePageBtn = document.createElement('button');
        deletePageBtn.innerHTML = '<i class="fas fa-trash-alt text-xs"></i>';
        deletePageBtn.className = 'text-gray-500 hover:text-red-600 p-1';
        deletePageBtn.title = 'Excluir Página';
        deletePageBtn.onclick = (e) => {
            e.stopPropagation();
            deletePage(activeSection.id, page.id);
        };
        listItem.appendChild(deletePageBtn);


        listItem.addEventListener('click', () => {
            selectPage(index);
        });
        pageList.appendChild(listItem);
    });

    // Carrega o conteúdo da página ativa (se houver)
    if (activeSection.activePageIndex !== -1 && activeSection.pages[activeSection.activePageIndex]) {
        loadPageContent(activeSection.pages[activeSection.activePageIndex]);
    } else {
        clearEditor();
        currentPageIndicator.textContent = '';
    }
}

function clearEditor() {
    pageTitleInput.value = '';
    contentEditor.innerHTML = 'Selecione ou crie uma página para começar.';
    pageTitleInput.disabled = true;
    contentEditor.contentEditable = false;
    disableToolbar(true);
    currentPageIndicator.textContent = '';
}

function disableToolbar(disabled) {
    fontFamilySelect.disabled = disabled;
    fontSizeInput.disabled = disabled;
    boldBtn.disabled = disabled;
    italicBtn.disabled = disabled;
    underlineBtn.disabled = disabled;
    textColorPicker.disabled = disabled;
    clearFormatBtn.disabled = disabled;
    contentEditor.style.backgroundColor = disabled ? '#f3f4f6' : 'white';
}


function loadPageContent(page) {
    if (page) {
        pageTitleInput.value = page.name;
        contentEditor.innerHTML = page.content || 'Clique aqui para começar a escrever...';
        pageTitleInput.disabled = false;
        contentEditor.contentEditable = true;
        disableToolbar(false);
        currentPageIndicator.textContent = `Página: ${page.name}`;
    } else {
        clearEditor();
    }
}

// --- Funções de Manipulação de Dados ---
function addSection() {
    const sectionName = prompt("Digite o nome da nova seção:", "Nova Seção");
    if (sectionName && sectionName.trim() !== "") {
        const newSection = {
            id: generateId(),
            name: sectionName.trim(),
            pages: [],
            activePageIndex: -1
        };
        appData.sections.push(newSection);
        selectSection(newSection.id); // Seleciona a nova seção automaticamente
    } else if (sectionName !== null) { // Se o usuário não cancelou, mas deixou em branco
        // Removido o alert daqui, pois o CodePen não suporta alert/prompt/confirm diretamente na execução inicial do JS em alguns contextos.
        // Se precisar de feedback, use um elemento na UI.
        console.warn("O nome da seção não pode estar vazio.");
    }
}

function promptRenameSection(sectionId, currentName) {
    const newName = prompt("Digite o novo nome para a seção:", currentName);
    if (newName && newName.trim() !== "" && newName.trim() !== currentName) {
        const section = appData.sections.find(s => s.id === sectionId);
        if (section) {
            section.name = newName.trim();
            renderSections();
            if (appData.activeSectionId === sectionId) { // Atualiza o nome no painel de páginas se for a seção ativa
                currentSectionNamePages.textContent = `Em: ${section.name}`;
                currentSectionIndicator.textContent = `Seção: ${section.name}`;
            }
        }
    } else if (newName !== null && newName.trim() === "") {
        // alert("O nome da seção não pode estar vazio.");
        console.warn("O nome da seção não pode estar vazio.");
    }
}

function deleteSection(sectionId) {
    // const confirmation = confirm("Tem certeza que deseja excluir esta seção e todas as suas páginas?");
    // CodePen não lida bem com confirm() no carregamento. Para um protótipo simples, podemos remover a confirmação ou usar um modal customizado.
    // Por simplicidade, vamos assumir que o usuário quer deletar.
    // if (true) { // Removendo o confirm para CodePen
    if (confirm("Tem certeza que deseja excluir esta seção e todas as suas páginas? (Esta mensagem pode não funcionar bem no CodePen)")) {
        appData.sections = appData.sections.filter(s => s.id !== sectionId);
        if (appData.activeSectionId === sectionId) {
            appData.activeSectionId = null;
            if (appData.sections.length > 0) {
                selectSection(appData.sections[0].id); // Seleciona a primeira seção se houver
            } else {
                clearEditor(); // Limpa tudo se não houver mais seções
                currentSectionNamePages.textContent = 'Nenhuma seção selecionada';
                currentSectionIndicator.textContent = '';
                currentPageIndicator.textContent = '';
            }
        }
        renderSections();
        renderPages(); // Atualiza o painel de páginas
    }
}


function addPage() {
    const activeSection = appData.sections.find(s => s.id === appData.activeSectionId);
    if (!activeSection) {
        // alert("Selecione uma seção antes de adicionar uma página.");
        console.warn("Selecione uma seção antes de adicionar uma página.");
        return;
    }

    const pageName = prompt("Digite o nome da nova página:", "Nova Página");
    if (pageName && pageName.trim() !== "") {
        const newPage = {
            id: generateId(),
            name: pageName.trim(),
            content: ""
        };
        activeSection.pages.push(newPage);
        activeSection.activePageIndex = activeSection.pages.length - 1; // Define a nova página como ativa
        renderPages();
        loadPageContent(newPage); // Carrega a nova página (vazia)
    } else if (pageName !== null) {
         // alert("O nome da página não pode estar vazio.");
         console.warn("O nome da página não pode estar vazio.");
    }
}

function deletePage(sectionId, pageId) {
    const section = appData.sections.find(s => s.id === sectionId);
    if (section) {
        const pageIndex = section.pages.findIndex(p => p.id === pageId);
        // if (pageIndex > -1 && confirm(`Tem certeza que deseja excluir a página "${section.pages[pageIndex].name}"?`)) {
        // Removendo confirm para CodePen
        if (pageIndex > -1 && confirm(`Tem certeza que deseja excluir a página "${section.pages[pageIndex].name}"? (Esta mensagem pode não funcionar bem no CodePen)`)) {
            section.pages.splice(pageIndex, 1);
            // Ajustar activePageIndex se a página excluída era a ativa ou antes dela
            if (section.activePageIndex === pageIndex) {
                section.activePageIndex = section.pages.length > 0 ? Math.max(0, pageIndex -1) : -1;
            } else if (section.activePageIndex > pageIndex) {
                section.activePageIndex--;
            }
            renderPages(); // Re-renderiza a lista de páginas
            // Carrega a nova página ativa ou limpa o editor
            if (section.activePageIndex !== -1 && section.pages[section.activePageIndex]) {
                loadPageContent(section.pages[section.activePageIndex]);
            } else {
                clearEditor();
            }
        }
    }
}


function selectSection(sectionId) {
    appData.activeSectionId = sectionId;
    const section = appData.sections.find(s => s.id === sectionId);
    if (section && section.pages.length > 0 && section.activePageIndex === -1) {
        section.activePageIndex = 0; // Seleciona a primeira página por padrão se nenhuma estiver ativa
    }
    renderSections();
    renderPages();
}

function selectPage(pageIndex) {
    const activeSection = appData.sections.find(s => s.id === appData.activeSectionId);
    if (activeSection) {
        activeSection.activePageIndex = pageIndex;
        renderPages(); // Re-renderiza para destacar a página ativa
        loadPageContent(activeSection.pages[pageIndex]);
    }
}

function saveCurrentPageData() {
    const activeSection = appData.sections.find(s => s.id === appData.activeSectionId);
    if (activeSection && activeSection.activePageIndex !== -1 && activeSection.pages[activeSection.activePageIndex]) {
        const activePage = activeSection.pages[activeSection.activePageIndex];
        if (activePage) {
            activePage.name = pageTitleInput.value.trim() || "Página Sem Título";
            activePage.content = contentEditor.innerHTML;
            // Atualiza o nome na lista de páginas se mudou
            renderPages(); // Isso pode ser um pouco demais, mas garante a atualização visual
        }
    }
}

// --- Funções da Toolbar ---
function formatDoc(command, value = null) {
    if (contentEditor.contentEditable === 'true') {
        document.execCommand(command, false, value);
        contentEditor.focus(); // Manter o foco no editor
    }
}

// --- Event Listeners ---
// É importante garantir que os elementos existam antes de adicionar listeners,
// especialmente em ambientes como CodePen onde o JS pode rodar antes do DOM estar completo.
// Uma forma é envolver tudo em DOMContentLoaded ou colocar o script no final do body.
// Como o script já está no final, isso deve ser ok.

if (addSectionBtn) addSectionBtn.addEventListener('click', addSection);
if (addPageBtn) addPageBtn.addEventListener('click', addPage);

if (pageTitleInput) {
    pageTitleInput.addEventListener('input', saveCurrentPageData);
    pageTitleInput.addEventListener('blur', () => {
        saveCurrentPageData(); // Garante que o nome da página seja salvo na lista
        const activeSection = appData.sections.find(s => s.id === appData.activeSectionId);
        if (activeSection && activeSection.activePageIndex !== -1 && activeSection.pages[activeSection.activePageIndex]) {
            currentPageIndicator.textContent = `Página: ${activeSection.pages[activeSection.activePageIndex].name}`;
        }
    });
}
if (contentEditor) contentEditor.addEventListener('input', saveCurrentPageData);

// Toolbar events
if (fontFamilySelect) fontFamilySelect.addEventListener('change', () => formatDoc('fontName', fontFamilySelect.value));
if (fontSizeInput) fontSizeInput.addEventListener('change', () => {
    // alert("A alteração de tamanho de fonte para seleção específica é complexa com execCommand e não está totalmente implementada neste protótipo simples. Considere usar os cabeçalhos (H1, H2, etc.) ou formatação global se necessário.");
    console.warn("A alteração de tamanho de fonte para seleção específica é complexa com execCommand e não está totalmente implementada neste protótipo simples.");
});

if (boldBtn) boldBtn.addEventListener('click', () => formatDoc('bold'));
if (italicBtn) italicBtn.addEventListener('click', () => formatDoc('italic'));
if (underlineBtn) underlineBtn.addEventListener('click', () => formatDoc('underline'));
if (textColorPicker) textColorPicker.addEventListener('input', () => formatDoc('foreColor', textColorPicker.value));
if (clearFormatBtn) clearFormatBtn.addEventListener('click', () => {
    formatDoc('removeFormat');
    if(textColorPicker) textColorPicker.value = '#000000';
});

// Atalhos de teclado básicos
if (contentEditor) {
    contentEditor.addEventListener('keydown', (e) => {
        if (e.ctrlKey) {
            switch (e.key.toLowerCase()) {
                case 'b':
                    e.preventDefault();
                    formatDoc('bold');
                    break;
                case 'i':
                    e.preventDefault();
                    formatDoc('italic');
                    break;
                case 'u':
                    e.preventDefault();
                    formatDoc('underline');
                    break;
            }
        }
    });
}

// --- Inicialização ---
function initializeApp() {
    const initialSectionId = generateId();
    appData.sections.push({
        id: initialSectionId,
        name: "Minhas Notas",
        pages: [
            { id: generateId(), name: "Primeira Nota", content: "<h1>Bem-vindo!</h1><p>Este é um protótipo simples inspirado no OneNote.</p><p>Use os painéis à esquerda para organizar suas <b>seções</b> e <i>páginas</i>.</p><p>Utilize a <font color='#4f46e5'>barra de ferramentas</font> acima para formatar seu texto.</p>" }
        ],
        activePageIndex: 0
    });
    appData.activeSectionId = initialSectionId;

    renderSections();
    renderPages();
    if (appData.sections[0] && appData.sections[0].pages.length > 0) {
         loadPageContent(appData.sections[0].pages[0]);
    } else {
        clearEditor();
    }
}

function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('oneNotePrototypeData');
        if (savedData) {
            appData = JSON.parse(savedData);
            appData.sections.forEach(section => {
                if (!section.pages) section.pages = [];
                if (section.activePageIndex === undefined || section.activePageIndex >= section.pages.length) {
                    section.activePageIndex = section.pages.length > 0 ? 0 : -1;
                }
            });
        }
    } catch (e) {
        console.error("Erro ao carregar dados do localStorage:", e);
        // Se houver erro (ex: localStorage desabilitado ou dados corrompidos),
        // appData continuará como o objeto vazio inicializado acima.
    }
}

function saveToLocalStorage() {
    try {
        localStorage.setItem('oneNotePrototypeData', JSON.stringify(appData));
    } catch (e) {
        console.error("Erro ao salvar dados no localStorage:", e);
    }
}

// Inicialização
loadFromLocalStorage();
if (appData.sections.length === 0) {
    initializeApp();
} else {
    renderSections();
    if (appData.activeSectionId) {
        const sectionExists = appData.sections.some(s => s.id === appData.activeSectionId);
        if (!sectionExists && appData.sections.length > 0) { // Se a seção ativa salva não existe mais, seleciona a primeira
            appData.activeSectionId = appData.sections[0].id;
        } else if (!sectionExists && appData.sections.length === 0) { // Nenhuma seção salva
             appData.activeSectionId = null;
        }
        
        if (appData.activeSectionId) {
            selectSection(appData.activeSectionId);
            const activeSection = appData.sections.find(s => s.id === appData.activeSectionId);
            if (activeSection && activeSection.activePageIndex !== -1 && activeSection.pages[activeSection.activePageIndex]) {
                loadPageContent(activeSection.pages[activeSection.activePageIndex]);
            } else if (activeSection && activeSection.pages.length > 0) {
                activeSection.activePageIndex = 0;
                loadPageContent(activeSection.pages[0]);
            } else if (activeSection) { // Seção ativa existe mas não tem páginas
                 clearEditor();
            } else { // Nenhuma seção ativa válida
                clearEditor();
            }
        } else {
             clearEditor();
        }

    } else if (appData.sections.length > 0) { // Se não há seção ativa, mas há seções, seleciona a primeira
        appData.activeSectionId = appData.sections[0].id;
        selectSection(appData.activeSectionId);
         const activeSection = appData.sections.find(s => s.id === appData.activeSectionId);
         if (activeSection && activeSection.pages.length > 0) {
             activeSection.activePageIndex = 0;
             loadPageContent(activeSection.pages[0]);
         } else {
            clearEditor();
         }
    }
     else {
        clearEditor();
    }
}

// Adiciona salvamento ao localStorage em cada modificação relevante
const originalSavePageData = saveCurrentPageData;
saveCurrentPageData = function() {
    originalSavePageData();
    saveToLocalStorage();
}
const originalAddSection = addSection;
addSection = function() {
    originalAddSection();
    saveToLocalStorage();
}
const originalAddPage = addPage;
addPage = function() {
    originalAddPage();
    saveToLocalStorage();
}
 const originalDeleteSection = deleteSection;
deleteSection = function(sectionId) {
    originalDeleteSection(sectionId);
    saveToLocalStorage();
}
const originalDeletePage = deletePage;
deletePage = function(sectionId, pageId) {
    originalDeletePage(sectionId, pageId);
    saveToLocalStorage();
}
const originalPromptRenameSection = promptRenameSection;
promptRenameSection = function(sectionId, currentName) {
    originalPromptRenameSection(sectionId, currentName);
    saveToLocalStorage();
}
