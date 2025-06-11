document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email'); // Certifique-se que o ID no HTML é 'email'
    const senhaInput = document.getElementById('password'); // Certifique-se que o ID no HTML é 'senha'
    const errorMessageElement = document.getElementById('errorMessage');

    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Impede o envio padrão do formulário

            const emailValue = emailInput.value;
            const senhaValue = senhaInput.value;

            if (emailValue === 'admin@vsb.com' && senhaValue === 'admin') {
                // Redireciona para home.html
                window.location.href = '../pages/home.html'; // Assume que home.html está no mesmo diretório que login.html
            } else {
                if (errorMessageElement) {
                    errorMessageElement.textContent = 'E-mail ou senha inválidos.';
                } else {
                    alert('E-mail ou senha inválidos.'); // Fallback caso o elemento de erro não exista
                }
            }
        });
    } else {
        console.error('Elemento do formulário de login não encontrado. Verifique o ID.');
    }
});