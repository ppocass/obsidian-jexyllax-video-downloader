// Construction des arguments yt-dlp : mêmes options que la fonction shell `movie`, sans shell.
let out = [], ok = 0;
const check = (cond, msg) => { if (cond) ok++; else out.push(msg); };

const s = Object.assign({}, DEFAULT_SETTINGS, { cookiesBrowser: 'safari', subLangs: 'fr,en' });
const tools = { ytdlp: '/opt/homebrew/bin/yt-dlp', ffmpeg: '/opt/homebrew/bin/ffmpeg', deno: '/opt/homebrew/bin/deno' };
const job = { url: 'https://youtu.be/abc', quality: '1080', container: 'mkv', subtitles: true, subLangs: 'fr,en', filename: '', destination: '/Users/p.pocass/Downloads/' };
const a = buildArgs(job, s, tools);
const has = (x) => a.includes(x);
const after = (x) => a[a.indexOf(x) + 1];

check(has('--newline') && has('--no-colors'), 'progression ligne par ligne absente');
check(has('--embed-chapters') && has('--embed-metadata'), 'chapitres/métadonnées absents');
check(after('--ffmpeg-location') === '/opt/homebrew/bin/ffmpeg', 'ffmpeg non localisé');
check(has('--no-quiet') && has('--no-simulate') && after('--print') === 'after_move:JXVD_FILE:%(filepath)s', 'chemin final non demandé');
check(after('--cookies-from-browser') === 'safari', 'cookies Safari absents');
check(after('-f') === 'bestvideo[height<=1080]+bestaudio/best[height<=1080]', 'filtre MKV faux : ' + after('-f'));
check(after('--merge-output-format') === 'mkv', 'fusion mkv absente');
check(has('--write-subs') && has('--write-auto-subs') && after('--sub-langs') === 'fr,en' && after('--sub-format') === 'srt' && after('--convert-subs') === 'srt', 'options sous-titres incomplètes');
check(!has('--embed-subs'), '--embed-subs présent (proscrit)');
check(!has('--exec'), '--exec présent : le post-traitement est interne');
check(after('-o') === '/Users/p.pocass/Downloads/%(title)s.%(ext)s', 'sortie fausse : ' + after('-o'));
check(a[a.length - 2] === '--' && a[a.length - 1] === 'https://youtu.be/abc', 'URL pas en dernier après --');

// MP4 / WebM / 720p / sans sous-titres / nom imposé
const b = buildArgs(Object.assign({}, job, { container: 'mp4', quality: '720', subtitles: false, filename: 'Mon film: la suite?' }), s, tools);
const afterB = (x) => b[b.indexOf(x) + 1];
check(afterB('-f') === 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]', 'filtre MP4 faux : ' + afterB('-f'));
check(!b.includes('--merge-output-format'), 'fusion mkv présente en MP4');
check(!b.includes('--write-subs'), 'sous-titres présents alors que désactivés');
check(afterB('-o') === '/Users/p.pocass/Downloads/Mon film- la suite-.%(ext)s', 'nom non nettoyé : ' + afterB('-o'));
const c = buildArgs(Object.assign({}, job, { container: 'webm', quality: '1440' }), s, tools);
check(c[c.indexOf('-f') + 1] === 'bestvideo[height<=1440][ext=webm]+bestaudio[ext=webm]/best[ext=webm]', 'filtre WebM faux');

// sans cookies, sans script de sous-titres
const d = buildArgs(job, Object.assign({}, s, { cookiesBrowser: 'none' }), {});
check(!d.includes('--cookies-from-browser') && !d.includes('--ffmpeg-location') && d.includes('--write-subs'), 'cookies/ffmpeg présents alors qu\'absents');


// destinations : le premier dossier renseigné est le défaut, ~ est développé
const dests = destinationsList(Object.assign({}, s, { destinations: [{ name: '', path: '' }, { name: 'Assets', path: '~/Vault/Pierre/assets' }, { name: '', path: '/tmp/x/' }] }));
check(dests.length === 2 && dests[0].name === 'Assets' && dests[0].path === HOME + '/Vault/Pierre/assets' && dests[1].name === 'x' && dests[1].path === '/tmp/x', 'liste des dossiers fausse : ' + JSON.stringify(dests));
const dj = defaultJob('https://youtu.be/z.', s);
check(dj.url === 'https://youtu.be/z' && dj.destination === HOME + '/Downloads' && dj.quality === '1080' && dj.container === 'mkv' && dj.subtitles === true && dj.filename === '', 'téléchargement par défaut faux : ' + JSON.stringify(dj));

out.length ? ('ECHECS:\n' + out.join('\n')) : (ok + ' vérifications (commande yt-dlp) passées')
