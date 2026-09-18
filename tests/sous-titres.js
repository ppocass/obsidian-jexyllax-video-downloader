// Sous-titres : le port JavaScript de yt-subs-fix.py doit faire exactement la même chose.
let out = [], ok = 0;
const check = (cond, msg) => { if (cond) ok++; else out.push(msg); };

check(parseTs('00:01:02,500') === 62.5 && parseTs('01:00:00.250') === 3600.25, 'parseTs faux');
check(fmtTs(62.5) === '00:01:02,500' && fmtTs(-1) === '00:00:00,000' && fmtTs(3661.0004) === '01:01:01,000', 'fmtTs faux : ' + fmtTs(62.5));

// un .srt « rolling » de YouTube : 1 ligne par cue, chevauchements, balises, répétitions
const rolling = '﻿1\n00:00:00,000 --> 00:00:02,500\n<c>Bonjour</c> à  tous\n\n2\n00:00:01,000 --> 00:00:03,500\nBonjour à tous\n\n3\n00:00:02,000 --> 00:00:04,500\naujourd\'hui on parle\n\n4\n00:00:03,000 --> 00:00:05,500\nde plugins\n\n5\n00:00:20,000 --> 00:00:22,000\nbien plus tard\n\n6\n00:00:21,000 --> 00:00:23,000\nla suite\n';
const cues = readSrt(rolling);
check(cues.length === 6 && cues[0][2] === 'Bonjour à tous' && cues[0][0] === 0 && cues[0][1] === 2.5, 'lecture srt fausse : ' + JSON.stringify(cues[0]));
check(!alreadyClean(cues), 'chevauchements non détectés');
const dd = dedupCues(cues);
check(dd.length === 5 && dd[0][1] === 3.5, 'dédoublonnage faux : ' + JSON.stringify(dd[0]));
const blocks = buildBlocks(dd);
check(blocks.length === 3, 'nombre de blocs faux : ' + blocks.length);
check(blocks[0][2].length === 2 && blocks[0][2][0] === 'Bonjour à tous' && blocks[0][2][1] === 'aujourd\'hui on parle', 'appariement faux : ' + JSON.stringify(blocks[0]));
check(blocks[0][0] === 0 && blocks[0][1] === 3, 'bornes du premier bloc fausses : ' + blocks[0][0] + '-' + blocks[0][1]);
check(blocks[1][2].length === 1 && blocks[1][2][0] === 'de plugins', 'silence non respecté : ' + JSON.stringify(blocks[1]));
check(blocks[2][2].length === 2 && blocks[2][0] === 20 && blocks[2][1] === 23, 'dernier bloc faux : ' + JSON.stringify(blocks[2]));
for (let k = 0; k < blocks.length - 1; k++) check(blocks[k][1] <= blocks[k + 1][0], 'chevauchement entre blocs ' + k + ' et ' + (k + 1));
for (const b of blocks) check(b[1] - b[0] >= SUB_MIN_DUR - 1e-9 && b[1] - b[0] <= SUB_MAX_DUR + 1e-9, 'durée hors bornes : ' + (b[1] - b[0]));
const txt = writeSrt(blocks);
check(txt.startsWith('1\n00:00:00,000 --> 00:00:03,000\nBonjour à tous\naujourd\'hui on parle\n\n2\n'), 'écriture srt fausse : ' + txt.slice(0, 80));
check(alreadyClean(readSrt(txt)), 'le résultat n\'est pas reconnu comme propre');

// un fichier déjà propre n'est pas touché ; un fichier trop court non plus
check(alreadyClean(readSrt('1\n00:00:00,000 --> 00:00:02,000\na\n\n2\n00:00:02,000 --> 00:00:04,000\nb\n\n3\n00:00:04,000 --> 00:00:06,000\nc\n')), 'fichier propre jugé sale');
check(alreadyClean([[0, 1, 'a']]), 'fichier court jugé sale');

// fixSrtFile sur un faux disque
const disk = { '/v/Film.en.srt': rolling };
const fakeFs = { readFileSync: (p) => { if (!(p in disk)) throw new Error('ENOENT'); return disk[p]; }, writeFileSync: (p, d) => { disk[p] = d; }, renameSync: (a, b) => { disk[b] = disk[a]; delete disk[a]; },
  readdirSync: () => ['Film.en.srt', 'Film.fr-orig.srt', 'Film.mkv', 'Film.en.srt.bak', 'Autre.en.srt', 'Film.txt', 'Film.srt'] };
check(fixSrtFile('/v/Film.en.srt', fakeFs) === true && disk['/v/Film.en.srt'].startsWith('1\n00:00:00,000') && !('/v/Film.en.srt.tmp' in disk), 'fixSrtFile faux');
check(fixSrtFile('/v/Film.en.srt', fakeFs) === false, 'fichier propre réécrit');
check(fixSrtFile('/v/absent.srt', fakeFs) === false, 'fichier absent : erreur non absorbée');

// .srt voisins et langues
const side = findSidecars('/v/Film.mkv', fakeFs);
check(JSON.stringify(side) === JSON.stringify(['/v/Film.en.srt', '/v/Film.fr-orig.srt', '/v/Film.srt']), 'voisins faux : ' + JSON.stringify(side));
check(langOf('/v/Film.en.srt', '/v/Film.mkv').iso === 'eng' && langOf('/v/Film.fr-orig.srt', '/v/Film.mkv').iso === 'fre' && langOf('/v/Film.fr-orig.srt', '/v/Film.mkv').tag === 'fr-orig' && langOf('/v/Film.srt', '/v/Film.mkv').iso === 'und', 'langues fausses');

// arguments ffmpeg
const ea = embedArgs('/v/Film.mkv', ['/v/Film.en.srt', '/v/Film.fr.srt'], '/v/.tmp.mkv');
check(ea && ea.join(' ') === '-hide_banner -loglevel error -y -i /v/Film.mkv -i /v/Film.en.srt -i /v/Film.fr.srt -map 0:v? -map 0:a? -map 1 -map 2 -c copy -c:s srt -metadata:s:s:0 language=eng -metadata:s:s:0 title=en -metadata:s:s:1 language=fre -metadata:s:s:1 title=fr /v/.tmp.mkv', 'arguments ffmpeg faux : ' + (ea && ea.join(' ')));
check(embedArgs('/v/Film.mp4', ['/v/Film.en.srt'], '/v/.t.mp4').includes('mov_text'), 'codec mp4 faux');
check(embedArgs('/v/Film.webm', ['/v/Film.en.srt'], '/v/.t.webm') === null, 'webm accepté pour l\'intégration');

out.length ? ('ECHECS:\n' + out.join('\n')) : (ok + ' vérifications (sous-titres) passées')
