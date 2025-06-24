const userMenuButtonHome = document.getElementById('user-menu-button-home');
const userMenuDropdownHome = document.getElementById('user-menu-dropdown-home');

if (userMenuButtonHome && userMenuDropdownHome) {
    userMenuButtonHome.addEventListener('click', (event) => {
        event.stopPropagation();
        userMenuDropdownHome.classList.toggle('hidden');
    });

    document.addEventListener('click', (event) => {
        if (!userMenuButtonHome.contains(event.target) && !userMenuDropdownHome.contains(event.target)) {
            userMenuDropdownHome.classList.add('hidden');
        }
    });
}

const createBlankNotebookButton = document.getElementById('create-blank-notebook');
const myNotebooksGrid = document.getElementById('my-notebooks-grid');

const vsbModal = document.getElementById('vsb-modal');
const vsbModalTitle = document.getElementById('vsb-modal-title');
const vsbModalMessage = document.getElementById('vsb-modal-message');
const vsbModalInput = document.getElementById('vsb-modal-input');
const vsbModalCancelBtn = document.getElementById('vsb-modal-cancel-btn');
const vsbModalConfirmBtn = document.getElementById('vsb-modal-confirm-btn');

let modalConfirmCallback = null;

function showVsbModal(title, message, showInput = false, placeholder = "Digite aqui...", confirmCallback) {
    if (!vsbModal) return;

    vsbModalTitle.textContent = title;
    vsbModalMessage.textContent = message;
    modalConfirmCallback = confirmCallback;

    if (showInput) {
        vsbModalInput.classList.remove('hidden');
        vsbModalInput.value = '';
        vsbModalInput.placeholder = placeholder;
        setTimeout(() => vsbModalInput.focus(), 50);
    } else {
        vsbModalInput.classList.add('hidden');
    }
    vsbModal.classList.remove('hidden');
    void vsbModal.offsetWidth; 
    vsbModal.classList.remove('opacity-0');
    vsbModal.querySelector('.modal-content').classList.remove('scale-95');
}

function hideVsbModal() {
    if (vsbModal) {
         vsbModal.classList.add('opacity-0');
         vsbModal.querySelector('.modal-content').classList.add('scale-95');
         setTimeout(() => {
            vsbModal.classList.add('hidden');
         }, 300);
    }
    if (vsbModalInput) vsbModalInput.value = '';
}

if (vsbModalConfirmBtn) {
    vsbModalConfirmBtn.addEventListener('click', () => {
        if (modalConfirmCallback) {
            const inputValue = vsbModalInput.classList.contains('hidden') ? true : vsbModalInput.value;
            modalConfirmCallback(inputValue);
        }
        hideVsbModal();
    });
}

if (vsbModalCancelBtn) {
    vsbModalCancelBtn.addEventListener('click', () => {
        if (modalConfirmCallback) {
            modalConfirmCallback(false); 
        }
        hideVsbModal();
    });
}
if(vsbModal){
    vsbModal.classList.add('opacity-0');
    const modalContent = vsbModal.querySelector('.modal-content');
    if(modalContent) modalContent.classList.add('scale-95');
}


if (createBlankNotebookButton && myNotebooksGrid) { 
    createBlankNotebookButton.addEventListener('click', function(event) {
        event.preventDefault();

        showVsbModal(
            "Novo Caderno",
            "Digite o nome para o novo caderno:",
            true, 
            "Nome do Caderno", 
            (notebookNameInput) => {
                if (notebookNameInput && typeof notebookNameInput === 'string' && notebookNameInput.trim() !== "") {
                    const notebookName = notebookNameInput.trim();
                    
                    const newNotebookToListCard = document.createElement('a');
                    newNotebookToListCard.href = "#";
                    newNotebookToListCard.className = "notebook-card bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col";

                    const notebookCover = document.createElement('div');
                    const coverColors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 'bg-yellow-500', 'bg-indigo-500'];
                    const randomColor = coverColors[Math.floor(Math.random() * coverColors.length)];
                    notebookCover.className = `notebook-card-cover ${randomColor}`;
                    const notebookIcon = document.createElement('i');
                    notebookIcon.className = "fas fa-book fa-3x text-white opacity-75";
                    notebookCover.appendChild(notebookIcon);

                    const notebookBody = document.createElement('div');
                    notebookBody.className = "p-4 flex-grow";
                    const notebookTitle = document.createElement('h3');
                    notebookTitle.className = "font-semibold text-gray-800 text-base truncate mb-1";
                    notebookTitle.textContent = notebookName;
                    const notebookPages = document.createElement('p');
                    notebookPages.className = "text-xs text-gray-500";
                    notebookPages.textContent = "0 páginas";
                    notebookBody.appendChild(notebookTitle);
                    notebookBody.appendChild(notebookPages);

                    const notebookFooter = document.createElement('div');
                    notebookFooter.className = "p-3 border-t border-gray-100 text-right";
                    const notebookDate = document.createElement('span');
                    notebookDate.className = "text-xs text-gray-400";
                    notebookDate.textContent = "Criado hoje";
                    notebookFooter.appendChild(notebookDate);
                    
                    newNotebookToListCard.appendChild(notebookCover);
                    newNotebookToListCard.appendChild(notebookBody);
                    newNotebookToListCard.appendChild(notebookFooter);

                    myNotebooksGrid.prepend(newNotebookToListCard);
                    
                    showVsbModal("Sucesso!", `Caderno "${notebookName}" criado com sucesso e adicionado a 'Meus Cadernos'!`, false, () => {});

                } else if (notebookNameInput !== false) { 
                     showVsbModal("Atenção", "O nome do caderno não pode estar em branco.", false, () => {});
                }
            }
        );
    });
}
