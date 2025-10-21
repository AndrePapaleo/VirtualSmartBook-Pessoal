import { auth, storage, db } from './firebase-init.js';
import { onAuthStateChanged, updateProfile, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-storage.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    // Seletores para os elementos que exibem os dados do usuário
    const headerUserName = document.querySelector('header .flex.items-center.space-x-2.cursor-pointer span');
    const headerUserImage = document.querySelector('header .rounded-full img');
    const profileName = document.querySelector('main h2.text-3xl');
    const profileEmail = document.getElementById('profile-user-email');
    const profileImage = document.querySelector('main .rounded-full img');
    
    // Seletores para os botões de ação
    const uploadButton = document.getElementById('upload-button');
    const editProfileButton = document.getElementById('edit-profile-button');

    // Seletores para as estatísticas
    const statsCadernosEl = document.getElementById('stats-cadernos');
    const statsTempoEl = document.getElementById('stats-tempo');
    const statsDocumentosEl = document.getElementById('stats-documentos');

    // Cria e insere o botão de alterar senha
    const changePasswordButton = document.createElement('button');
    changePasswordButton.id = 'change-password-button';
    changePasswordButton.className = 'bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-gray-300 transition ml-0 mt-2 md:ml-4 md:mt-0';
    changePasswordButton.textContent = 'Alterar Senha';
    
    const buttonContainer = document.querySelector('.mt-4');
    if (buttonContainer) {
        buttonContainer.appendChild(changePasswordButton);
    }

    let currentUser = null;

    // Observador do estado de autenticação
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            displayUserData(user);
            loadUserStats(user.uid);
        } else {
            window.location.href = 'login.html';
        }
    });

    // Função para exibir os dados do usuário na UI
    function displayUserData(user) {
        if (!user) return;

        const displayName = user.displayName || 'Usuário';
        const email = user.email;
        const photoURL = user.photoURL;

        // Atualiza o nome e email na tela
        if (headerUserName) headerUserName.textContent = displayName;
        if (profileName) profileName.textContent = displayName;
        if (profileEmail) profileEmail.textContent = email;

        // Atualiza a foto de perfil (cabeçalho e corpo)
        if (photoURL) {
            if (headerUserImage) headerUserImage.src = photoURL;
            if (profileImage) profileImage.src = photoURL;
        } else {
            // Se não houver foto, usa um placeholder com as iniciais
            const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            const placeholderUrl = `https://placehold.co/160x160/cbd5e1/4b5563?text=${initials}`;
            if (headerUserImage) headerUserImage.src = placeholderUrl.replace('160x160', '32x32');
            if (profileImage) profileImage.src = placeholderUrl;
        }
    }

    // --- NOVA FUNÇÃO PARA FORMATAR O TEMPO ---
    function formatStudyTime(totalSeconds) {
        if (!totalSeconds || totalSeconds < 60) {
            return "0m";
        }
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    // --- FUNÇÃO DE ESTATÍSTICAS ATUALIZADA ---
    async function loadUserStats(userId) {
        if (!userId) return;

        const userDocRef = doc(db, "notebooks", userId);
        try {
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
                const userData = docSnap.data();
                
                // Contagem de cadernos
                const notebookCount = Object.keys(userData.notebooks || {}).length;
                if (statsCadernosEl) {
                    statsCadernosEl.textContent = notebookCount;
                }
                
                // Tempo de estudo
                const totalSeconds = userData.totalStudyTimeInSeconds || 0;
                if (statsTempoEl) {
                    statsTempoEl.textContent = formatStudyTime(totalSeconds);
                }

                // Documentos compartilhados (placeholder)
                if (statsDocumentosEl) statsDocumentosEl.textContent = '0';

            } else {
                // Se o usuário não tiver um documento de dados ainda
                if (statsCadernosEl) statsCadernosEl.textContent = '0';
                if (statsTempoEl) statsTempoEl.textContent = '0m';
                if (statsDocumentosEl) statsDocumentosEl.textContent = '0';
            }
        } catch (error) {
            console.error("Erro ao carregar estatísticas do usuário:", error);
        }
    }

    // --- Lógica para Editar o Nome ---
    if (editProfileButton) {
        editProfileButton.addEventListener('click', () => {
            const newName = prompt('Digite seu novo nome:', currentUser.displayName || '');
            if (newName && newName.trim() !== '') {
                updateProfile(currentUser, {
                    displayName: newName.trim()
                }).then(() => {
                    alert('Nome atualizado com sucesso!');
                    displayUserData(currentUser);
                }).catch((error) => {
                    console.error("Erro ao atualizar o nome:", error);
                    alert('Ocorreu um erro ao atualizar o nome.');
                });
            }
        });
    }

    // --- Lógica para Upload da Foto ---
    if (uploadButton) {
        uploadButton.addEventListener('click', () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file || !currentUser) return;

                const storageRef = ref(storage, `profile_pictures/${currentUser.uid}`);

                try {
                    alert('Enviando imagem, por favor aguarde...');
                    const snapshot = await uploadBytes(storageRef, file);
                    const photoURL = await getDownloadURL(snapshot.ref);

                    await updateProfile(currentUser, { photoURL });

                    displayUserData(currentUser);
                    alert('Foto de perfil atualizada com sucesso!');
                } catch (error) {
                    console.error("Erro no upload da imagem:", error);
                    alert('Ocorreu um erro ao enviar a imagem.');
                }
            };
            fileInput.click();
        });
    }

    // --- Lógica para Alterar a Senha ---
    if (changePasswordButton) {
        changePasswordButton.addEventListener('click', () => {
            if (!currentUser || !currentUser.email) return;

            const confirmReset = confirm("Um e-mail para redefinição de senha será enviado para o seu endereço. Deseja continuar?");
            
            if (confirmReset) {
                sendPasswordResetEmail(auth, currentUser.email)
                    .then(() => {
                        alert('E-mail de redefinição de senha enviado! Verifique sua caixa de entrada.');
                    })
                    .catch((error) => {
                        console.error("Erro ao enviar e-mail de redefinição:", error);
                        alert(`Ocorreu um erro: ${error.message}`);
                    });
            }
        });
    }
});