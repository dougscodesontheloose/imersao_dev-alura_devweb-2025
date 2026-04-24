const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');

const API_KEY    = '58b80fb1';
const DATA_FILE  = path.join(__dirname, 'data.json');
const POSTERS_DIR = path.join(__dirname, 'posters');

const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

function extractImdbId(link) {
    const match = (link || '').match(/tt\d+/);
    return match ? match[0] : null;
}

function get(url) {
    return new Promise((resolve, reject) => {
        const lib = url.startsWith('https') ? https : http;
        lib.get(url, res => {
            // Segue redirecionamentos
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return get(res.headers.location).then(resolve).catch(reject);
            }
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => resolve({ statusCode: res.statusCode, body, res }));
        }).on('error', reject);
    });
}

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const lib = url.startsWith('https') ? https : http;
        const file = fs.createWriteStream(dest);
        lib.get(url, res => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                file.close();
                fs.unlinkSync(dest);
                return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
            }
            res.pipe(file);
            file.on('finish', () => { file.close(); resolve(); });
            file.on('error', err => { fs.unlink(dest, () => {}); reject(err); });
        }).on('error', err => { fs.unlink(dest, () => {}); reject(err); });
    });
}

async function fetchPosterUrl(imdbId) {
    const { body } = await get(`https://www.omdbapi.com/?i=${imdbId}&apikey=${API_KEY}`);
    const json = JSON.parse(body);
    return (json.Poster && json.Poster !== 'N/A') ? json.Poster : null;
}

function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function main() {
    let baixados = 0, jaExistiam = 0, semPoster = 0, erros = 0;

    for (let i = 0; i < data.length; i++) {
        const movie = data[i];
        const imdbId = extractImdbId(movie.link);
        if (!imdbId) { semPoster++; continue; }

        const localPath = `posters/${imdbId}.jpg`;
        const fullPath  = path.join(POSTERS_DIR, `${imdbId}.jpg`);

        process.stdout.write(`[${i + 1}/${data.length}] ${movie.nome} ... `);

        // Já existe localmente
        if (fs.existsSync(fullPath)) {
            movie.poster = localPath;
            jaExistiam++;
            console.log('✓ já existe');
            continue;
        }

        try {
            const posterUrl = await fetchPosterUrl(imdbId);
            if (!posterUrl) {
                semPoster++;
                console.log('— sem poster');
                continue;
            }

            await downloadFile(posterUrl, fullPath);
            movie.poster = localPath;
            baixados++;
            console.log('↓ baixado');

            await delay(150); // respeita rate limit
        } catch (err) {
            erros++;
            console.log(`✗ erro: ${err.message}`);
        }
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

    console.log('\n─────────────────────────────────────────');
    console.log(`✅ Novos downloads : ${baixados}`);
    console.log(`✓  Já existiam    : ${jaExistiam}`);
    console.log(`—  Sem poster     : ${semPoster}`);
    console.log(`✗  Erros          : ${erros}`);
    console.log(`📁 data.json atualizado com caminhos locais`);
}

main().catch(console.error);
