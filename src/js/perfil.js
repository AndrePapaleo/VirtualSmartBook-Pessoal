// Aguarda o DOM estar completamente carregado antes de executar o script
document.addEventListener('DOMContentLoaded', () => {
    console.log('Script do perfil carregado com sucesso!');

    // Lógica para o botão "Editar Perfil"
    const editButton = document.getElementById('edit-profile-button');
    if (editButton) {
        editButton.addEventListener('click', () => {
            alert('Você clicou em Editar Perfil!');
            // Aqui você pode adicionar a lógica para redirecionar para a página de edição ou mostrar um modal.
        });
    }

    // Lógica para o botão de upload de foto
    const uploadButton = document.getElementById('upload-button');
    if (uploadButton) {
        uploadButton.addEventListener('click', () => {
            alert('Você clicou em Mudar Foto!');
            // Aqui você pode adicionar a lógica para abrir a janela de seleção de arquivos.
        });
    }
});
