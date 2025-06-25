// src/js/login.js
import { auth } from './firebase-init.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    // ==================================================================
    // INÍCIO DA CORREÇÃO: Adicionando as funções de erro
    // ==================================================================
    function showError(message) {
        // Remove erro anterior para não duplicar
        clearError();
        const form = document.querySelector('.login-card form');
        if (form) {
            const errorElement = document.createElement('p');
            errorElement.id = 'errorMessage';
            errorElement.className = 'text-red-500 text-sm text-center bg-red-100 p-2 rounded-lg mb-4';
            errorElement.textContent = message;
            // Insere a mensagem de erro no topo do formulário
            form.prepend(errorElement);
        }
    }

    function clearError() {
        const errorMessageElement = document.getElementById('errorMessage');
        if (errorMessageElement) {
            errorMessageElement.remove();
        }
    }
    // ==================================================================
    // FIM DA CORREÇÃO
    // ==================================================================

    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            // Limpa erros de tentativas anteriores
            clearError();

            const emailValue = emailInput.value.trim();
            const passwordValue = passwordInput.value;

            if (emailValue === '' || passwordValue === '') {
                showError('Por favor, preencha todos os campos.');
                return;
            }

            try {
                const userCredential = await signInWithEmailAndPassword(auth, emailValue, passwordValue);
                const user = userCredential.user;
                console.log('Usuário logado:', user.uid);
                
                // Login bem-sucedido, redireciona para a home
                window.location.href = 'home.html';

            } catch (error) {
                console.error("Erro de login:", error.code);
                // Agora esta chamada para showError vai funcionar corretamente
                showError('E-mail ou senha inválidos.');
            }
        });
    } else {
        console.error('Elemento do formulário de login não encontrado. Verifique o ID.');
    }
});