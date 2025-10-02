// src/js/cadastro.js
import { auth } from './firebase-init.js';
import { createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js"; // Importa updateProfile

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
        let error = parent.querySelector('.error-message'); // Verifica se já existe um erro
        if (!error) {
            error = document.createElement('p');
            error.className = 'text-red-500 text-xs mt-1 error-message';
            parent.appendChild(error);
        }
        error.textContent = message;
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
                // Busca o container mais próximo que envolva o checkbox para exibir o erro de forma mais controlada
                const termsContainer = termsCheckbox.closest('.flex.items-start'); 
                if (termsContainer) {
                    showError(termsContainer, 'Você deve aceitar os termos de serviço.');
                } else {
                    // Fallback se a estrutura do HTML mudar
                    showError(termsCheckbox.parentElement, 'Você deve aceitar os termos de serviço.');
                }
                isValid = false;
            }

            // 4. Se, e somente se, todas as validações passaram, tenta criar o usuário
            if (isValid) {
                try {
                    console.log('Tentando criar usuário com email:', emailInput.value);
                    const userCredential = await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
                    const user = userCredential.user;
                    
                    console.log('Usuário criado com sucesso. UID:', user.uid);
                    console.log('Valor do campo Nome Completo (fullNameInput):', fullNameInput.value.trim());

                    // --- ATUALIZA O PERFIL DO USUÁRIO COM O NOME COMPLETO ---
                    await updateProfile(user, {
                        displayName: fullNameInput.value.trim() // Define o nome de exibição
                    });
                    console.log('Perfil do usuário atualizado. displayName definido como:', fullNameInput.value.trim());
                    // --- FIM DA LÓGICA DE ATUALIZAÇÃO ---

                    console.log('Usuário criado e perfil atualizado:', user);

                    // Substituído alert() por uma mensagem na UI, conforme melhores práticas
                    const formSubmitButtonParent = registrationForm.querySelector('button[type="submit"]').parentElement;
                    let successMessageEl = registrationForm.querySelector('#successMessage');
                    if (!successMessageEl) {
                        successMessageEl = document.createElement('p');
                        successMessageEl.id = 'successMessage';
                        successMessageEl.className = 'text-green-600 text-sm text-center bg-green-100 p-2 rounded-lg mb-4';
                        formSubmitButtonParent.prepend(successMessageEl);
                    }
                    successMessageEl.textContent = 'Cadastro realizado com sucesso! Você será redirecionado para o login.';
                    successMessageEl.classList.remove('hidden');


                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000); // Redireciona após 2 segundos para dar tempo de ler a mensagem

                } catch (error) {
                    console.error("Erro ao criar usuário:", error);
                    let errorMessage = 'Ocorreu um erro ao cadastrar. Tente novamente.';
                    if (error.code === 'auth/email-already-in-use') {
                        errorMessage = 'Este e-mail já está em uso. Por favor, use outro.';
                        showError(emailInput, errorMessage);
                    } else if (error.code === 'auth/invalid-email') {
                        errorMessage = 'O formato do e-mail é inválido.';
                        showError(emailInput, errorMessage);
                    } else if (error.code === 'auth/weak-password') {
                        errorMessage = 'A senha é muito fraca. Escolha uma senha mais forte.';
                        showError(passwordInput, errorMessage);
                    } else {
                         // Mostra um erro genérico no formulário
                        const formSubmitButtonParent = registrationForm.querySelector('button[type="submit"]').parentElement;
                        showError(formSubmitButtonParent, errorMessage);
                    }
                }
            }
        });
    }
});