// src/js/cadastro.js
import { auth } from './firebase-init.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', function() {
    const registrationForm = document.querySelector('form');
    const fullNameInput = document.getElementById('fullname');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const termsCheckbox = document.getElementById('terms');

    // Suas funções de ajuda para mostrar e limpar erros
    function showError(inputElement, message) {
        // Encontra o elemento pai mais próximo para adicionar a mensagem de erro
        const parent = inputElement.closest('div');
        const error = document.createElement('p');
        error.className = 'text-red-500 text-xs mt-1 error-message';
        error.textContent = message;
        parent.appendChild(error);
        inputElement.classList.add('border-red-500');
    }

    function clearErrors() {
        document.querySelectorAll('.error-message').forEach(e => e.remove());
        document.querySelectorAll('.border-red-500').forEach(e => e.classList.remove('border-red-500'));
    }


    if (registrationForm) {
        registrationForm.addEventListener('submit', async function(event) {
            event.preventDefault(); // Impede o envio padrão do formulário

            // 1. Limpa mensagens de erro da tentativa anterior
            clearErrors();

            // 2. Define a variável de controle da validação
            let isValid = true;

            // 3. Executa toda a lógica de validação
            if (fullNameInput.value.trim() === '') {
                showError(fullNameInput, 'O nome completo é obrigatório.');
                isValid = false;
            }
            if (emailInput.value.trim() === '') {
                showError(emailInput, 'O email é obrigatório.');
                isValid = false;
            }
            if (passwordInput.value.length < 6) {
                showError(passwordInput, 'A senha deve ter no mínimo 6 caracteres.');
                isValid = false;
            }
            if (passwordInput.value !== confirmPasswordInput.value) {
                showError(confirmPasswordInput, 'As senhas não correspondem.');
                isValid = false;
            }
            if (!termsCheckbox.checked) {
                // Para o checkbox, o erro é mostrado próximo ao elemento pai dele
                showError(termsCheckbox.parentElement, 'Você deve aceitar os termos de serviço.');
                isValid = false;
            }

            // 4. Se, e somente se, todas as validações passaram, tenta criar o usuário
            if (isValid) {
                try {
                    const userCredential = await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
                    const user = userCredential.user;
                    console.log('Usuário criado:', user);

                    alert('Cadastro realizado com sucesso! Você será redirecionado para o login.');
                    window.location.href = 'login.html';

                } catch (error) {
                    console.error("Erro ao criar usuário:", error);
                    if (error.code === 'auth/email-already-in-use') {
                        showError(emailInput, 'Este e-mail já está em uso.');
                    } else {
                         // Mostra um erro genérico no formulário
                        const formErrorContainer = registrationForm.querySelector('button[type="submit"]').parentElement;
                        showError(formErrorContainer, 'Ocorreu um erro. Tente novamente.');
                    }
                }
            }
        });
    }
});