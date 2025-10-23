// Função para alternar o modo escuro
function toggleDarkMode(force) {
    const body = document.body;
    let isDark;
    if (typeof force === 'boolean') {
        isDark = force;
    } else {
        isDark = !body.classList.contains('dark-mode');
    }
    body.classList.toggle('dark-mode', isDark);
    localStorage.setItem('vsb-dark-mode', isDark ? '1' : '0');
}

// Detecta preferência do usuário no sistema
function detectSystemDarkMode() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

// Aplica preferência salva ou do sistema ao carregar
(function() {
    const saved = localStorage.getItem('vsb-dark-mode');
    if (saved === '1') {
        document.body.classList.add('dark-mode');
    } else if (saved === '0') {
        document.body.classList.remove('dark-mode');
    } else if (detectSystemDarkMode()) {
        document.body.classList.add('dark-mode');
    }
})();

// Cria botão de alternância se não existir
function createDarkModeToggleButton() {
    if (document.getElementById('dark-mode-toggle-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'dark-mode-toggle-btn';
    btn.title = 'Alternar modo escuro/claro';
    btn.style.position = 'fixed';
    btn.style.bottom = '24px';
    btn.style.right = '24px';
    btn.style.zIndex = '9999';
    btn.style.background = '#3b82f6';
    btn.style.color = 'white';
    btn.style.border = 'none';
    btn.style.borderRadius = '50%';
    btn.style.width = '48px';
    btn.style.height = '48px';
    btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    btn.style.fontSize = '1.5rem';
    btn.style.cursor = 'pointer';
    btn.innerHTML = '<span id="dark-mode-toggle-icon">🌙</span>';
    btn.onclick = function() {
        const isDark = !document.body.classList.contains('dark-mode');
        toggleDarkMode(isDark);
        document.getElementById('dark-mode-toggle-icon').textContent = isDark ? '☀️' : '🌙';
    };
    document.body.appendChild(btn);
    // Atualiza ícone ao carregar
    btn.querySelector('#dark-mode-toggle-icon').textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
}

document.addEventListener('DOMContentLoaded', createDarkModeToggleButton);
