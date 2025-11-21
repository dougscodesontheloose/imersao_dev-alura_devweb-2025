// Variável global para armazenar os dados
let todosOsFilmes = [];

// Função para carregar dados do JSON
async function buscarDados() {
    try {
        const response = await fetch('data.json');
        
        if (!response.ok) {
            throw new Error('Erro ao carregar dados');
        }
        
        const dados = await response.json();
        
        if (!Array.isArray(dados) || dados.length === 0) {
            throw new Error('Dados inválidos');
        }
        
        todosOsFilmes = dados;
        renderizarCards(todosOsFilmes);
        
    } catch (erro) {
        mostrarErro();
        console.error('Erro:', erro);
    }
}

// Função para renderizar os cards
function renderizarCards(lista) {
    const container = document.getElementById('card-container');
    container.innerHTML = '';
    
    if (lista.length === 0) {
        container.innerHTML = '<p class="no-results">Nenhum resultado encontrado.</p>';
        return;
    }
    
    for (const item of lista) {
        const card = document.createElement('article');
        card.className = 'card';
        
        // Determina se usa ano ou data_criacao
        let infoData = '';
        if (item.ano) {
            infoData = `<p class="card-year">📅 ${item.ano}</p>`;
        } else if (item.data_criacao) {
            infoData = `<p class="card-year">📅 ${item.data_criacao}</p>`;
        }
        
        // Adiciona informação do criador se existir
        let infoCriador = '';
        if (item.criador) {
            infoCriador = `<p class="card-creator">🎬 Direção: ${item.criador}</p>`;
        }
        
        card.innerHTML = `
            <h2 class="card-title">${item.nome}</h2>
            ${infoData}
            ${infoCriador}
            <p class="card-description">${item.descricao}</p>
            <a href="${item.link}" target="_blank" class="card-link">Ver mais informações</a>
        `;
        
        container.appendChild(card);
    }
}

// Função para mostrar mensagem de erro
function mostrarErro() {
    const container = document.getElementById('card-container');
    container.innerHTML = '<div class="error-message">Erro ao carregar dados. Tente novamente mais tarde.</div>';
}

// Função para buscar/filtrar
function iniciarBusca() {
    const input = document.getElementById('search-input');
    const termo = input.value.toLowerCase().trim();
    
    if (termo === '') {
        renderizarCards(todosOsFilmes);
        return;
    }
    
    const resultados = todosOsFilmes.filter(item => {
        const nomeMatch = item.nome.toLowerCase().includes(termo);
        const descricaoMatch = item.descricao.toLowerCase().includes(termo);
        return nomeMatch || descricaoMatch;
    });
    
    renderizarCards(resultados);
}

// Event listener para busca ao pressionar Enter
document.addEventListener('DOMContentLoaded', () => {
    buscarDados();
    
    const input = document.getElementById('search-input');
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            iniciarBusca();
        }
    });
});
