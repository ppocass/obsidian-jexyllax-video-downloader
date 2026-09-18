// Détection des liens : sous le curseur, nettoyage, sites reconnus.
let out = [], ok = 0;
const check = (cond, msg) => { if (cond) ok++; else out.push(msg); };

check(cleanUrl('https://youtu.be/abc123.') === 'https://youtu.be/abc123', 'point final non retiré');
check(cleanUrl('https://youtu.be/abc123)') === 'https://youtu.be/abc123', 'parenthèse orpheline non retirée');
check(cleanUrl('https://fr.wikipedia.org/wiki/Foo_(bar)') === 'https://fr.wikipedia.org/wiki/Foo_(bar)', 'parenthèse légitime retirée');
check(cleanUrl('  https://x.com/a  ') === 'https://x.com/a', 'espaces non retirés');

const ligne = 'Voir https://www.youtube.com/watch?v=dQw4w9WgXcQ et aussi [la vidéo](https://vimeo.com/12345), fin.';
check(urlAtCursor(ligne, 10) === 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'lien nu non trouvé sous le curseur');
check(urlAtCursor(ligne, 2) === null, 'lien trouvé hors d\'un lien : ' + urlAtCursor(ligne, 2));
check(urlAtCursor(ligne, 62) === 'https://vimeo.com/12345', 'cible markdown non trouvée sous le texte du lien : ' + urlAtCursor(ligne, 62));
check(urlAtCursor(ligne, 75) === 'https://vimeo.com/12345', 'cible markdown non trouvée sous l\'URL : ' + urlAtCursor(ligne, 75));
check(urlAtCursor('rien ici', 3) === null, 'lien inventé');
check(urlAtCursor('https://youtu.be/x', 18) === 'https://youtu.be/x', 'curseur en fin de lien ignoré');

SETTINGS.menuOnAllLinks = false;
check(isVideoUrl('https://www.youtube.com/watch?v=1') && isVideoUrl('https://youtu.be/1') && isVideoUrl('https://vimeo.com/1'), 'site vidéo non reconnu');
check(!isVideoUrl('https://example.com/page') && !isVideoUrl('ftp://youtube.com/x'), 'site quelconque accepté en mode restreint');
check(!isVideoUrl('https://notyoutube.com/x'), 'suffixe trompeur accepté');
SETTINGS.menuOnAllLinks = true;
check(isVideoUrl('https://example.com/page'), 'lien http refusé en mode « tous les liens »');
check(!isVideoUrl('mailto:a@b.c') && !isVideoUrl(''), 'non-lien accepté');

out.length ? ('ECHECS:\n' + out.join('\n')) : (ok + ' vérifications (liens) passées')
