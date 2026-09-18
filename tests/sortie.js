// Lecture de la sortie de yt-dlp.
let out = [], ok = 0;
const check = (cond, msg) => { if (cond) ok++; else out.push(msg); };

let p = parseLine('[download]  45.3% of  120.50MiB at    2.10MiB/s ETA 00:30');
check(p && p.phase === 'download' && p.pct === 45.3 && p.speed === '2.10MiB/s' && p.eta === '00:30', 'progression mal lue : ' + JSON.stringify(p));
p = parseLine('[download] 100% of   12.00MiB in 00:00:05 at 2.40MiB/s');
check(p && p.pct === 100, '100 % mal lu : ' + JSON.stringify(p));
p = parseLine('[download]   0.0% of ~ 512.00KiB at  Unknown B/s ETA Unknown');
check(p && p.pct === 0 && p.eta === 'Unknown', 'taille approximative mal lue : ' + JSON.stringify(p));
p = parseLine('[download] Destination: /Users/p.pocass/Downloads/Titre.f137.mp4');
check(p && p.file === '/Users/p.pocass/Downloads/Titre.f137.mp4', 'destination mal lue');
p = parseLine('[Merger] Merging formats into "/Users/p.pocass/Downloads/Titre.mkv"');
check(p && p.phase === 'merge' && p.file === '/Users/p.pocass/Downloads/Titre.mkv', 'fusion mal lue : ' + JSON.stringify(p));
p = parseLine('ERROR: [youtube] abc: Video unavailable');
check(p && p.phase === 'error' && p.message === '[youtube] abc: Video unavailable', 'erreur mal lue');
check(parseLine('[info] abc: Downloading 1 format(s): 137+251') === null, 'ligne sans intérêt retenue');
check(parseLine('') === null, 'ligne vide retenue');
check(parseLine("[Exec] Executing command: '/x/yt-subs-fix.py' '/y.mkv'").phase === 'subs' && parseLine('[SubtitlesConvertor] Converting subtitles').phase === 'subs', 'phase sous-titres non reconnue');
check(baseName('/a/b/c.mkv') === 'c.mkv' && baseName('c.mkv') === 'c.mkv', 'baseName faux');
check(safeName('  a/b\\c:d*e?f"g<h>i|j  ') === 'a-b-c-d-e-f-g-h-i-j', 'safeName faux : ' + safeName('  a/b\\c:d*e?f"g<h>i|j  '));

out.length ? ('ECHECS:\n' + out.join('\n')) : (ok + ' vérifications (sortie yt-dlp) passées')
