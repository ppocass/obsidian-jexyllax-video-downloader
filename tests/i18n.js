// Traductions : rien ne doit manquer d'une langue à l'autre, et toute clé employée doit exister.
let out = [], ok = 0;
const clesFr = Object.keys(STRINGS.fr).sort();
const clesEn = Object.keys(STRINGS.en).sort();
const manqueEn = clesFr.filter((k) => !(k in STRINGS.en));
const manqueFr = clesEn.filter((k) => !(k in STRINGS.fr));
if (!manqueEn.length) ok++; else out.push('absentes de l\'anglais : ' + manqueEn.join(', '));
if (!manqueFr.length) ok++; else out.push('absentes du français : ' + manqueFr.join(', '));
const inconnues = CLES_UTILISEES.filter((k) => !(k in STRINGS.fr));
if (!inconnues.length) ok++; else out.push('clés employées mais non traduites : ' + inconnues.join(', '));
const decalage = clesFr.filter((k) => k in STRINGS.en && (STRINGS.fr[k].split('%s').length !== STRINGS.en[k].split('%s').length));
if (!decalage.length) ok++; else out.push('nombre de %s différent : ' + decalage.join(', '));
const vides = clesFr.filter((k) => !STRINGS.fr[k] || !STRINGS.en[k]);
if (!vides.length) ok++; else out.push('traductions vides : ' + vides.join(', '));
if (tr('notice.queued', '2') === 'Ajouté à la file (2 en attente)') ok++; else out.push('substitution %s cassée : ' + tr('notice.queued', '2'));
if (resolveLang('en') === 'en' && resolveLang('fr') === 'fr' && ['fr', 'en'].includes(resolveLang('auto'))) ok++; else out.push('resolveLang cassé');
const attendus = ['language', 'ytdlpPath', 'ffmpegPath', 'denoPath', 'cookiesBrowser', 'showAdvanced', 'quality', 'container', 'subtitles', 'subLangs', 'keepTitle', 'destinations', 'menuOnAllLinks', 'showRibbon', 'seriesBase', 'seriesTitle'];
const absents = attendus.filter((k) => !(k in DEFAULT_SETTINGS));
if (!absents.length) ok++; else out.push('réglages sans valeur par défaut : ' + absents.join(', '));
for (const k of ['container.mkv', 'container.mp4', 'container.webm', 'tools.ytdlp', 'tools.ffmpeg', 'tools.deno', 'job.queued', 'job.running', 'job.done', 'job.failed', 'job.cancelled']) { if (k in STRINGS.fr && k in STRINGS.en) ok++; else out.push('clé de famille manquante : ' + k); }
out.length ? ('ECHECS:\n' + out.join('\n')) : (ok + ' vérifications (traductions et réglages) passées')
