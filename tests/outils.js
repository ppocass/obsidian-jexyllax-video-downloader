// Outils : détection, versions, empreintes.
let out = [], ok = 0;
const check = (cond, msg) => { if (cond) ok++; else out.push(msg); };

check(parseVersion('2026.08.19') === '2026.08.19' && parseVersion('ffmpeg version 6.1.1-tessus  https://…\nbuilt with') === '6.1.1' && parseVersion('deno 2.9.7 (stable, release, aarch64-apple-darwin)\nv8 14.0') === '2.9.7' && parseVersion('') === '', 'parseVersion faux');
check(expectedSum('abc\n' + 'a'.repeat(64) + '  yt-dlp_macos\n' + 'b'.repeat(64) + '  yt-dlp.exe\n', 'yt-dlp_macos') === 'a'.repeat(64), 'somme SHA2-256SUMS fausse');
check(expectedSum('C'.repeat(64) + ' *deno-aarch64-apple-darwin.zip', 'deno-aarch64-apple-darwin.zip') === 'c'.repeat(64), 'somme .sha256sum fausse');
check(expectedSum('d'.repeat(64) + '\n', 'x') === 'd'.repeat(64) && expectedSum('rien', 'x') === null, 'somme seule fausse');

const fakeFs = { existsSync: (p) => ['/plug/bin/yt-dlp', '/opt/homebrew/bin/ffmpeg', '/custom/deno'].includes(p) };
const s = Object.assign({}, DEFAULT_SETTINGS);
check(resolveTool('ytdlp', s, '/plug/bin', fakeFs) === '/plug/bin/yt-dlp', 'bin/ du plugin non prioritaire');
check(resolveTool('ffmpeg', s, '/plug/bin', fakeFs) === '/opt/homebrew/bin/ffmpeg', 'emplacement habituel non trouvé');
check(resolveTool('deno', s, '/plug/bin', fakeFs) === null, 'outil absent trouvé');
check(resolveTool('deno', Object.assign({}, s, { denoPath: '/custom/deno' }), '/plug/bin', fakeFs) === '/custom/deno', 'chemin explicite ignoré');
check(resolveTool('deno', Object.assign({}, s, { denoPath: '/nulle/part' }), '/plug/bin', fakeFs) === null, 'chemin explicite faux accepté à la place d\'un autre');
check(candidatePaths('ytdlp', '/plug/bin')[0] === '/plug/bin/yt-dlp', 'ordre des candidats faux');
for (const n of Object.keys(TOOLS)) check(TOOLS[n].asset['darwin-arm64'] && TOOLS[n].asset['darwin-x64'] && TOOLS[n].asset['linux-x64'] && TOOLS[n].asset['win32-x64'], 'binaire manquant pour ' + n);
check(splitPath('/a/b/c.tar.gz').stem === 'c.tar' && splitPath('/a/b/c.tar.gz').ext === '.gz' && splitPath('/a/b/c.tar.gz').dir === '/a/b' && splitPath('x.mkv').dir === '.', 'splitPath faux');

out.length ? ('ECHECS:\n' + out.join('\n')) : (ok + ' vérifications (outils) passées')
