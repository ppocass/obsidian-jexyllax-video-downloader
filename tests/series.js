// Mode Série : numérotation, dossiers, playlists, autocomplétion des dossiers.
let out = [], ok = 0;
const check = (cond, msg) => { if (cond) ok++; else out.push(msg); };

check(pad(3, 2) === '03' && pad(12, 5) === '00012' && pad('x', 2) === '00' && pad(123456, 5) === '123456', 'pad faux');
check(episodeName('Ma série: saison', 1, 7) === 'Ma série- saison S01E00007', 'nom d\'épisode faux : ' + episodeName('Ma série: saison', 1, 7));
check(episodeName('S', 2, 1, 'Titre') === 'S S02E00001 - Titre', 'nom avec titre faux');

const s = Object.assign({}, DEFAULT_SETTINGS, { seriesBase: '~/Downloads/TV Shows', subsFixPath: '' });
const form = { text: 'https://youtu.be/a\n\n pas un lien \nhttps://youtu.be/b.\nhttps://www.youtube.com/playlist?list=PL1', mode: 'series',
  seriesName: 'Cours', season: 1, startEpisode: 4, seriesTitle: true, seriesBase: '', quality: '720', container: 'mkv', subtitles: true };
const r = jobsFromPanel(form, s);
check(!r.error && r.jobs.length === 3, 'nombre de travaux faux : ' + JSON.stringify(r));
check(r.jobs[0].episode === 4 && r.jobs[1].episode === 5 && r.jobs[2].episode === 6, 'numérotation fausse');
check(r.jobs[1].url === 'https://youtu.be/b', 'lien non nettoyé');
check(r.jobs[0].destination === HOME + '/Downloads/TV Shows/Cours', 'dossier de série faux : ' + r.jobs[0].destination);
check(r.jobs[0].batch === r.jobs[2].batch && r.jobs[0].series === 'Cours' && r.jobs[0].season === 1, 'lot/série faux');
const a = buildArgs(r.jobs[1], s);
const after = (x) => a[a.indexOf(x) + 1];
check(after('-o') === HOME + '/Downloads/TV Shows/Cours/Cours S01E%(autonumber)05d - %(title)s.%(ext)s', 'sortie série fausse : ' + after('-o'));
check(after('--autonumber-start') === '5', 'autonumber faux : ' + after('--autonumber-start'));
check(after('-f') === 'bestvideo[height<=720]+bestaudio/best[height<=720]', 'qualité du panneau ignorée');
const b = buildArgs(Object.assign({}, r.jobs[0], { seriesTitle: false }), s);
check(b[b.indexOf('-o') + 1].endsWith('/Cours S01E%(autonumber)05d.%(ext)s'), 'sortie sans titre fausse');

check(jobsFromPanel(Object.assign({}, form, { seriesName: '  ' }), s).error === 'view.noSeriesName', 'série sans nom acceptée');
check(jobsFromPanel(Object.assign({}, form, { text: 'rien' }), s).error === 'view.noUrls', 'texte sans lien accepté');
const v = jobsFromPanel(Object.assign({}, form, { mode: 'videos', destination: '/tmp/v', container: 'mp4' }), s);
check(v.jobs.length === 3 && !v.jobs[0].series && v.jobs[0].destination === '/tmp/v' && v.jobs[0].container === 'mp4' && v.jobs[0].filename === '', 'mode vidéos faux : ' + JSON.stringify(v.jobs[0]));
check(jobLabel(r.jobs[0]) === 'Cours S01E00004' && jobLabel({ url: 'https://x/y' }) === 'https://x/y' && jobLabel({ url: 'u', file: '/a/b.mkv' }) === 'b.mkv', 'jobLabel faux');

// éléments d'une playlist
const it = parseLine('[download] Downloading item 3 of 12');
check(it && it.phase === 'item' && it.index === 3 && it.count === 12, 'élément de playlist mal lu');

// autocomplétion : faux disque
const fakeFs = { readdirSync: (dir) => {
  if (dir === HOME) return [{ name: 'Downloads', isDirectory: () => true }, { name: 'Desktop', isDirectory: () => true }, { name: '.ssh', isDirectory: () => true }, { name: 'notes.txt', isDirectory: () => false }];
  if (dir === HOME + '/Downloads') return [{ name: 'TV Shows', isDirectory: () => true }];
  throw new Error('ENOENT');
} };
check(JSON.stringify(folderSuggestions('~/D', fakeFs)) === JSON.stringify(['~/Desktop', '~/Downloads']), 'suggestions ~ fausses : ' + JSON.stringify(folderSuggestions('~/D', fakeFs)));
check(JSON.stringify(folderSuggestions(HOME + '/Downloads/', fakeFs)) === JSON.stringify([HOME + '/Downloads/TV Shows']), 'suggestions absolues fausses');
check(folderSuggestions('', fakeFs).length === 2 && folderSuggestions('/nulle/part/', fakeFs).length === 0, 'cas vide ou inexistant faux');
check(!folderSuggestions('~/', fakeFs).some((x) => x.includes('.ssh') || x.includes('notes')), 'fichiers ou dossiers cachés proposés');

out.length ? ('ECHECS:\n' + out.join('\n')) : (ok + ' vérifications (séries et dossiers) passées')
