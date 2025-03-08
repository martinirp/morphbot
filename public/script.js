document.addEventListener('DOMContentLoaded', () => {
    const botStatus = document.getElementById('botStatus');
    const playButton = document.getElementById('playButton');
    const pauseButton = document.getElementById('pauseButton');
    const resumeButton = document.getElementById('resumeButton');
    const stopButton = document.getElementById('stopButton');
    const searchInput = document.getElementById('searchInput');
    const emptyFieldModal = new bootstrap.Modal(document.getElementById('emptyFieldModal'));
    const queueList = document.getElementById('queueList');
    const libraryList = document.getElementById('libraryList');
    const volumeSlider = document.getElementById('volumeSlider');

    // Função para atualizar o status do bot
    const updateStatus = async () => {
        try {
            const response = await fetch('/status');
            const data = await response.json();
            botStatus.textContent = data.status;
            botStatus.className = data.status === 'Online' ? 'badge bg-success' : 'badge bg-danger';
        } catch (error) {
            console.error('Erro ao buscar status:', error);
        }
    };

    // Função para carregar a biblioteca de músicas
    const loadLibrary = async () => {
        try {
            const response = await fetch('data/links.json');
            const data = await response.json();
            libraryList.innerHTML = data.map(song => `
                <li class="list-group-item">${song.NAME}</li>
            `).join('');
        } catch (error) {
            console.error('Erro ao carregar a biblioteca:', error);
        }
    };

    // Botão Play
    playButton.addEventListener('click', async () => {
        const query = searchInput.value.trim();
        if (!query) {
            emptyFieldModal.show();
            return;
        }

        try {
            const response = await fetch('/execute/play', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query }),
            });
            const result = await response.json();
            alert(result.message || 'Música adicionada à fila!');
            // Atualiza a fila de músicas
            queueList.innerHTML += `<li class="list-group-item">${query}</li>`;
        } catch (error) {
            console.error('Erro ao executar o comando play:', error);
            alert('Erro ao reproduzir a música.');
        }
    });

    // Botão Pause
    pauseButton.addEventListener('click', async () => {
        try {
            const response = await fetch('/execute/pause', { method: 'POST' });
            const result = await response.json();
            alert(result.message || 'Música pausada!');
        } catch (error) {
            console.error('Erro ao executar o comando pause:', error);
            alert('Erro ao pausar a música.');
        }
    });

    // Botão Resume
    resumeButton.addEventListener('click', async () => {
        try {
            const response = await fetch('/execute/resume', { method: 'POST' });
            const result = await response.json();
            alert(result.message || 'Música retomada!');
        } catch (error) {
            console.error('Erro ao executar o comando resume:', error);
            alert('Erro ao retomar a música.');
        }
    });

    // Botão Stop
    stopButton.addEventListener('click', async () => {
        try {
            const response = await fetch('/execute/stop', { method: 'POST' });
            const result = await response.json();
            alert(result.message || 'Música parada!');
            // Limpa a fila de músicas
            queueList.innerHTML = '';
        } catch (error) {
            console.error('Erro ao executar o comando stop:', error);
            alert('Erro ao parar a música.');
        }
    });

    // Slider de Volume
    volumeSlider.addEventListener('input', async (e) => {
        const volume = e.target.value;
        try {
            await fetch('/execute/volume', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ volume }),
            });
        } catch (error) {
            console.error('Erro ao ajustar o volume:', error);
        }
    });

    // Atualiza o status e carrega a biblioteca ao carregar a página
    updateStatus();
    loadLibrary();
});