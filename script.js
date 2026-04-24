// Variáveis globais
let todosOsFilmes = [];
let temaAtual = '80s';

// === CONFIGURAÇÃO DE POSTERS ===
// Chave gratuita em: https://www.omdbapi.com/apikey.aspx
const OMDB_API_KEY = '58b80fb1';

function extractImdbId(link) {
    const match = (link || '').match(/tt\d+/);
    return match ? match[0] : null;
}

async function fetchPoster(imdbId) {
    if (!OMDB_API_KEY || !imdbId) return null;

    const cacheKey = `poster_${imdbId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached !== null) return cached === 'NONE' ? null : cached;

    try {
        const res = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_API_KEY}`);
        const data = await res.json();
        const url = (data.Poster && data.Poster !== 'N/A') ? data.Poster : null;
        localStorage.setItem(cacheKey, url || 'NONE');
        return url;
    } catch {
        return null;
    }
}

function carregarPosters(lista) {
    lista.forEach(item => {
        const imdbId = extractImdbId(item.link);
        if (!imdbId) return;

        // Poster local tem prioridade (gerado por download-posters.js)
        if (item.poster) {
            aplicarPoster(imdbId, item.poster);
            return;
        }

        // Fallback: OMDB API com cache localStorage
        const cacheKey = `poster_${imdbId}`;
        const cached = localStorage.getItem(cacheKey);

        if (cached && cached !== 'NONE') {
            aplicarPoster(imdbId, cached);
        } else if (OMDB_API_KEY) {
            fetchPoster(imdbId).then(url => {
                if (url) aplicarPoster(imdbId, url);
            });
        }
    });
}

function aplicarPoster(imdbId, url) {
    const img = document.querySelector(`.poster-img[data-imdb-id="${imdbId}"]`);
    if (!img || !url) return;
    img.onload = () => img.classList.add('loaded');
    img.src = url;
}

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

        const imdbId = extractImdbId(item.link);

        let infoData = '';
        if (item.ano) {
            infoData = `<p class="card-year">📅 ${item.ano}</p>`;
        } else if (item.data_criacao) {
            infoData = `<p class="card-year">📅 ${item.data_criacao}</p>`;
        }

        let infoCriador = '';
        if (item.criador) {
            infoCriador = `<p class="card-creator">🎬 Direção: ${item.criador}</p>`;
        }

        card.innerHTML = `
            <div class="card-content">
                <h2 class="card-title">${item.nome}</h2>
                ${infoData}
                ${infoCriador}
                <p class="card-description">${item.descricao}</p>
                <a href="${item.link}" target="_blank" class="card-link">Ver mais informações</a>
            </div>
            <div class="card-poster">
                <img
                    class="poster-img"
                    data-imdb-id="${imdbId || ''}"
                    alt="Capa de ${item.nome}"
                >
            </div>
        `;

        container.appendChild(card);
    }

    carregarPosters(lista);
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

// --- LÓGICA DE TEMAS ---

function configurarTemas() {
    const options = document.querySelectorAll('.theme-option');

    const temaSalvo = localStorage.getItem('filmes-80s-tema') || '80s';
    aplicarTema(temaSalvo);

    options.forEach(option => {
        option.addEventListener('click', () => {
            const novoTema = option.getAttribute('data-theme-value');
            aplicarTema(novoTema);
        });
    });
}

function aplicarTema(tema) {
    temaAtual = tema;
    document.body.classList.remove('theme-80s', 'theme-light', 'theme-dark');
    document.body.classList.add(`theme-${tema}`);
    document.body.setAttribute('data-theme', tema);
    localStorage.setItem('filmes-80s-tema', tema);
}

// Event listener para inicialização
document.addEventListener('DOMContentLoaded', () => {
    configurarTemas();
    buscarDados();

    const input = document.getElementById('search-input');
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') iniciarBusca();
        });
    }
});
