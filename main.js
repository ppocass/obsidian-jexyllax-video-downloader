'use strict';

const { Plugin, ItemView, Modal, Notice, PluginSettingTab, Setting, setIcon, requestUrl } = require('obsidian');

/* ================================================================== */
/*  Réglages et traductions                                           */
/* ================================================================== */

const HOME = (typeof process !== 'undefined' && process.env && (process.env.HOME || process.env.USERPROFILE)) || '';

const DEFAULT_SETTINGS = {
  language: 'auto',               // fr | en | auto (suit Obsidian)
  ytdlpPath: '',                  // vide = détection automatique (dossier bin/ du plugin, puis emplacements habituels)
  ffmpegPath: '',
  denoPath: '',
  cookiesBrowser: 'none',         // none | safari | chrome | firefox
  showAdvanced: false,
  quality: '1080',                // 720 | 1080 | 1440
  container: 'mkv',               // mkv | mp4 | webm
  subtitles: true,
  subLangs: 'fr,en',
  keepTitle: true,                // garder le titre de la vidéo comme nom de fichier
  destinations: [                 // la première est celle par défaut, trois au plus
    { name: 'Téléchargements', path: HOME + '/Downloads' },
    { name: '', path: '' },
    { name: '', path: '' },
  ],
  menuOnAllLinks: true,           // proposer l'entrée sur tout lien http(s), pas seulement YouTube
  showRibbon: true,               // icône du panneau dans la barre latérale
  seriesBase: HOME + '/Downloads/TV Shows', // les séries vont dans <seriesBase>/<nom de la série>/
  seriesTitle: false,             // ajouter le titre de la vidéo après le numéro d'épisode
};

let SETTINGS = Object.assign({}, DEFAULT_SETTINGS);
let LANG = 'fr';

const STRINGS = {
  fr: {
    'menu.download': 'Télécharger la vidéo',
    'menu.downloadOptions': 'Télécharger la vidéo avec options…',
    'cmd.cancel': 'Annuler le téléchargement en cours',
    'cmd.downloadClipboard': 'Télécharger le lien du presse-papiers',
    'cmd.downloadClipboardOptions': 'Télécharger le lien du presse-papiers avec options…',
    'cmd.openView': 'Ouvrir le panneau de téléchargement',
    'modal.title': 'Télécharger la vidéo',
    'modal.url': 'Lien',
    'modal.quality': 'Qualité',
    'modal.container': 'Format',
    'modal.subtitles': 'Sous-titres',
    'modal.subtitlesDesc': 'Langues : %s. Les sous-titres sont reformatés puis intégrés au fichier.',
    'modal.filename': 'Nom du fichier',
    'modal.filenameDesc': 'Sans extension. Vide : titre de la vidéo.',
    'modal.destination': 'Dossier',
    'modal.otherFolder': 'Autre dossier',
    'modal.otherFolderDesc': 'Chemin complet du dossier de destination.',
    'modal.ok': 'Télécharger',
    'modal.cancel': 'Annuler',
    'container.mkv': 'MKV — sous-titres intégrés',
    'container.mp4': 'MP4 — sous-titres intégrés',
    'container.webm': 'WebM — sous-titres en fichier .srt séparé',
    'status.queued': 'En attente : %s',
    'status.starting': 'Préparation',
    'status.downloading': '%s %s',
    'status.merging': 'Assemblage',
    'status.subs': 'Sous-titres',
    'status.done': 'Terminé',
    'notice.started': 'Téléchargement lancé : %s',
    'notice.queued': 'Ajouté à la file d\'attente (%s en attente)',
    'notice.done': 'Téléchargement terminé : %s',
    'notice.failed': 'Échec du téléchargement : %s',
    'notice.cancelled': 'Téléchargement annulé',
    'notice.noUrl': 'Aucun lien vidéo détecté',
    'notice.noBinary': 'yt-dlp introuvable : %s',
    'notice.nothingRunning': 'Aucun téléchargement en cours',
    'set.general': 'Général',
    'set.language': 'Langue',
    'set.languageDesc': 'Langue des menus, fenêtres et messages.',
    'set.langAuto': 'Suivre Obsidian',
    'set.menuOnAllLinks': 'Menu contextuel sur tous les liens',
    'set.menuOnAllLinksDesc': 'Activé : tout lien http(s) reçoit l\'entrée « Télécharger ». Désactivé : YouTube, Vimeo, Dailymotion, Twitch et X uniquement.',
    'set.defaults': 'Réglages par défaut',
    'set.defaultsDesc': 'Appliqués par « Télécharger » et proposés dans « Télécharger avec options ».',
    'set.quality': 'Qualité maximale',
    'set.container': 'Format',
    'set.containerDesc': 'MKV et MP4 intègrent les sous-titres comme piste. WebM les conserve en fichier .srt séparé.',
    'set.subtitles': 'Sous-titres',
    'set.subtitlesDesc': 'Télécharge les sous-titres, les reformate en blocs (YouTube les fournit ligne par ligne, avec chevauchements) et les intègre au fichier.',
    'set.subLangs': 'Langues des sous-titres',
    'set.subLangsDesc': 'Codes de langue séparés par des virgules, par ordre de préférence.',
    'set.keepTitle': 'Nom du fichier : titre de la vidéo',
    'set.keepTitleDesc': 'Désactivé : « Télécharger avec options » place le curseur dans le champ Nom du fichier.',
    'set.folders': 'Dossiers',
    'set.destinations': 'Dossiers de destination',
    'set.destinationsDesc': 'Jusqu\'à trois dossiers proposés dans la fenêtre d\'options. Le premier est utilisé par « Télécharger ».',
    'set.destName': 'Nom',
    'set.destPath': 'Chemin',
    'set.destN': 'Dossier %s',
    'set.destDefault': 'Dossier par défaut',
    'set.series': 'Séries',
    'set.seriesBase': 'Dossier des séries',
    'set.seriesBaseDesc': 'Chaque série est placée dans un sous-dossier à son nom : « Série/Série S01E00001.mkv ».',
    'set.seriesTitle': 'Titre de la vidéo dans le nom des épisodes',
    'set.seriesTitleDesc': '« Série S01E00001 - Titre.mkv » au lieu de « Série S01E00001.mkv ». Modifiable à chaque envoi.',
    'set.interface': 'Interface',
    'set.showRibbon': 'Icône dans la barre latérale',
    'set.showRibbonDesc': 'Ouvre le panneau de téléchargement. La commande reste disponible dans la palette.',
    'set.advanced': 'Réglages avancés',
    'set.advancedDesc': 'Chemins des outils et cookies du navigateur.',
    'set.showAdvanced': 'Afficher',
    'set.ytdlp': 'Chemin de yt-dlp',
    'set.ffmpeg': 'Chemin de ffmpeg',
    'set.deno': 'Chemin de deno',
    'set.pathOverride': 'Vide : détection automatique.',
    'set.cookies': 'Cookies du navigateur',
    'set.cookiesDesc': 'Transmis à yt-dlp pour les vidéos nécessitant une connexion. Safari requiert l\'accès complet au disque ; Chrome, l\'accès au trousseau.',
    'cookies.none': 'Aucun',
    'view.title': 'Téléchargement de vidéos',
    'view.urls': 'Liens',
    'view.urlsDesc': 'Un lien par ligne : vidéo ou playlist. En mode Série, l\'ordre des lignes détermine la numérotation.',
    'view.mode': 'Mode',
    'mode.videos': 'Vidéos',
    'mode.series': 'Série',
    'view.seriesName': 'Nom de la série',
    'view.season': 'Saison',
    'view.startEpisode': 'Premier épisode',
    'view.seriesTitle': 'Titre de la vidéo dans le nom',
    'view.seriesFolder': 'Résultat : %s',
    'view.options': 'Options',
    'view.download': 'Télécharger',
    'view.downloadN': 'Télécharger (%s)',
    'view.clear': 'Effacer les terminés',
    'view.jobs': 'Téléchargements',
    'view.empty': 'Aucun téléchargement.',
    'view.noSeriesName': 'Nom de la série requis.',
    'view.noUrls': 'Aucun lien valide.',
    'job.queued': 'En attente',
    'job.running': 'En cours',
    'job.done': 'Terminé',
    'job.failed': 'Échec',
    'job.cancelled': 'Annulé',
    'job.remove': 'Retirer',
    'job.cancel': 'Annuler',
    'job.item': 'élément %s sur %s',
    'tools.title': 'Outils',
    'tools.desc': 'Programmes exécutés par le plugin. Ils peuvent être installés %s depuis leurs publications officielles sur GitHub, avec vérification de l\'empreinte SHA-256 lorsqu\'elle est publiée.',
    'tools.ytdlp': 'yt-dlp — téléchargement',
    'tools.ffmpeg': 'ffmpeg — assemblage et sous-titres',
    'tools.deno': 'deno — moteur JavaScript',
    'tools.found': 'Version %s',
    'tools.missing': 'Introuvable',
    'tools.checking': 'Vérification',
    'tools.install': 'Installer',
    'tools.update': 'Mettre à jour',
    'tools.reinstall': 'Réinstaller',
    'tools.recheck': 'Vérifier les mises à jour',
    'tools.upToDate': 'à jour',
    'tools.newer': 'version %s disponible',
    'tools.downloading': '%s : téléchargement %s',
    'tools.verifying': '%s : vérification de l\'empreinte',
    'tools.installed': '%s %s installé',
    'tools.installFailed': 'Installation de %s impossible : %s',
    'tools.badChecksum': 'empreinte SHA-256 différente de celle publiée, fichier rejeté',
    'tools.unsupported': 'aucune version publiée pour ce système (%s)',
    'tools.missingNotice': 'Outils manquants : %s. Installation possible dans les réglages.',
    'tools.inPlugin': 'dans le dossier du plugin',
    'subs.clean': 'sous-titres reformatés',
    'subs.embedded': 'sous-titres intégrés',
  },
  en: {
    'menu.download': 'Download video',
    'menu.downloadOptions': 'Download video with options…',
    'cmd.cancel': 'Cancel the current download',
    'cmd.downloadClipboard': 'Download the link in the clipboard',
    'cmd.downloadClipboardOptions': 'Download the link in the clipboard with options…',
    'cmd.openView': 'Open the download panel',
    'modal.title': 'Download video',
    'modal.url': 'Link',
    'modal.quality': 'Quality',
    'modal.container': 'Format',
    'modal.subtitles': 'Subtitles',
    'modal.subtitlesDesc': 'Languages: %s. Subtitles are reformatted, then embedded in the file.',
    'modal.filename': 'File name',
    'modal.filenameDesc': 'Without extension. Empty: video title.',
    'modal.destination': 'Folder',
    'modal.otherFolder': 'Other folder',
    'modal.otherFolderDesc': 'Full path of the destination folder.',
    'modal.ok': 'Download',
    'modal.cancel': 'Cancel',
    'container.mkv': 'MKV — embedded subtitles',
    'container.mp4': 'MP4 — embedded subtitles',
    'container.webm': 'WebM — subtitles as a separate .srt file',
    'status.queued': 'Queued: %s',
    'status.starting': 'Preparing',
    'status.downloading': '%s %s',
    'status.merging': 'Merging',
    'status.subs': 'Subtitles',
    'status.done': 'Done',
    'notice.started': 'Download started: %s',
    'notice.queued': 'Added to the queue (%s waiting)',
    'notice.done': 'Download complete: %s',
    'notice.failed': 'Download failed: %s',
    'notice.cancelled': 'Download cancelled',
    'notice.noUrl': 'No video link detected',
    'notice.noBinary': 'yt-dlp not found: %s',
    'notice.nothingRunning': 'No download in progress',
    'set.general': 'General',
    'set.language': 'Language',
    'set.languageDesc': 'Language of menus, dialogs and messages.',
    'set.langAuto': 'Follow Obsidian',
    'set.menuOnAllLinks': 'Context menu on all links',
    'set.menuOnAllLinksDesc': 'On: every http(s) link gets the “Download” entry. Off: YouTube, Vimeo, Dailymotion, Twitch and X only.',
    'set.defaults': 'Defaults',
    'set.defaultsDesc': 'Applied by “Download” and proposed in “Download with options”.',
    'set.quality': 'Maximum quality',
    'set.container': 'Format',
    'set.containerDesc': 'MKV and MP4 embed subtitles as a track. WebM keeps them as a separate .srt file.',
    'set.subtitles': 'Subtitles',
    'set.subtitlesDesc': 'Downloads subtitles, reformats them into blocks (YouTube delivers them line by line, with overlaps) and embeds them in the file.',
    'set.subLangs': 'Subtitle languages',
    'set.subLangsDesc': 'Comma-separated language codes, in order of preference.',
    'set.keepTitle': 'File name: video title',
    'set.keepTitleDesc': 'Off: “Download with options” focuses the File name field.',
    'set.folders': 'Folders',
    'set.destinations': 'Destination folders',
    'set.destinationsDesc': 'Up to three folders proposed in the options dialog. The first is used by “Download”.',
    'set.destName': 'Name',
    'set.destPath': 'Path',
    'set.destN': 'Folder %s',
    'set.destDefault': 'Default folder',
    'set.series': 'Series',
    'set.seriesBase': 'Series folder',
    'set.seriesBaseDesc': 'Each series is placed in a sub-folder of its name: “Series/Series S01E00001.mkv”.',
    'set.seriesTitle': 'Video title in episode names',
    'set.seriesTitleDesc': '“Series S01E00001 - Title.mkv” instead of “Series S01E00001.mkv”. Can be changed on each submission.',
    'set.interface': 'Interface',
    'set.showRibbon': 'Ribbon icon',
    'set.showRibbonDesc': 'Opens the download panel. The command remains available in the palette.',
    'set.advanced': 'Advanced settings',
    'set.advancedDesc': 'Tool paths and browser cookies.',
    'set.showAdvanced': 'Show',
    'set.ytdlp': 'yt-dlp path',
    'set.ffmpeg': 'ffmpeg path',
    'set.deno': 'deno path',
    'set.pathOverride': 'Empty: automatic detection.',
    'set.cookies': 'Browser cookies',
    'set.cookiesDesc': 'Passed to yt-dlp for videos that require signing in. Safari requires Full Disk Access; Chrome, keychain access.',
    'cookies.none': 'None',
    'view.title': 'Video downloads',
    'view.urls': 'Links',
    'view.urlsDesc': 'One link per line: video or playlist. In Series mode, the order of the lines sets the numbering.',
    'view.mode': 'Mode',
    'mode.videos': 'Videos',
    'mode.series': 'Series',
    'view.seriesName': 'Series name',
    'view.season': 'Season',
    'view.startEpisode': 'First episode',
    'view.seriesTitle': 'Video title in the name',
    'view.seriesFolder': 'Result: %s',
    'view.options': 'Options',
    'view.download': 'Download',
    'view.downloadN': 'Download (%s)',
    'view.clear': 'Clear finished',
    'view.jobs': 'Downloads',
    'view.empty': 'No downloads.',
    'view.noSeriesName': 'Series name required.',
    'view.noUrls': 'No valid link.',
    'job.queued': 'Queued',
    'job.running': 'Running',
    'job.done': 'Done',
    'job.failed': 'Failed',
    'job.cancelled': 'Cancelled',
    'job.remove': 'Remove',
    'job.cancel': 'Cancel',
    'job.item': 'item %s of %s',
    'tools.title': 'Tools',
    'tools.desc': 'Programs run by the plugin. They can be installed %s from their official GitHub releases, with SHA-256 verification when a checksum is published.',
    'tools.ytdlp': 'yt-dlp — download',
    'tools.ffmpeg': 'ffmpeg — merging and subtitles',
    'tools.deno': 'deno — JavaScript runtime',
    'tools.found': 'Version %s',
    'tools.missing': 'Not found',
    'tools.checking': 'Checking',
    'tools.install': 'Install',
    'tools.update': 'Update',
    'tools.reinstall': 'Reinstall',
    'tools.recheck': 'Check for updates',
    'tools.upToDate': 'up to date',
    'tools.newer': 'version %s available',
    'tools.downloading': '%s: downloading %s',
    'tools.verifying': '%s: verifying checksum',
    'tools.installed': '%s %s installed',
    'tools.installFailed': 'Could not install %s: %s',
    'tools.badChecksum': 'SHA-256 checksum differs from the published one, file rejected',
    'tools.unsupported': 'no published build for this system (%s)',
    'tools.missingNotice': 'Missing tools: %s. They can be installed from the settings.',
    'tools.inPlugin': 'in the plugin folder',
    'subs.clean': 'subtitles reformatted',
    'subs.embedded': 'subtitles embedded',
  },
};

function tr(key) {
  const table = STRINGS[LANG] || STRINGS.fr;
  let out = key in table ? table[key] : (STRINGS.fr[key] || key);
  for (let i = 1; i < arguments.length; i++) out = out.replace('%s', String(arguments[i]));
  return out;
}

function resolveLang(pref) {
  if (pref === 'fr' || pref === 'en') return pref;
  try {
    const l = (window.localStorage && window.localStorage.getItem('language')) || 'en';
    return l.startsWith('fr') ? 'fr' : 'en';
  } catch (e) { return 'en'; }
}

/* ================================================================== */
/*  Liens                                                             */
/* ================================================================== */

const URL_RE = /https?:\/\/[^\s<>()\[\]"'`]+/g;
const VIDEO_HOSTS = /(^|\.)(youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|twitch\.tv|twitter\.com|x\.com)$/i;

/* Nettoie un lien trouvé dans du texte : ponctuation finale, parenthèse fermante orpheline. */
function cleanUrl(u) {
  let s = String(u || '').trim();
  s = s.replace(/[.,;:!?]+$/, '');
  while (s.endsWith(')') && (s.split('(').length - 1) < (s.split(')').length - 1)) s = s.slice(0, -1);
  return s;
}

function isVideoUrl(u) {
  const s = cleanUrl(u);
  if (!/^https?:\/\//i.test(s)) return false;
  if (SETTINGS.menuOnAllLinks) return true;
  const m = s.match(/^https?:\/\/([^/?#]+)/i);
  return !!(m && VIDEO_HOSTS.test(m[1].replace(/^www\./i, '')));
}

/* Le lien sous le curseur dans une ligne de texte : lien nu ou cible d'un [texte](url). */
function urlAtCursor(line, ch) {
  const re = new RegExp(URL_RE.source, 'g');
  let m;
  while ((m = re.exec(line))) {
    const start = m.index, end = start + m[0].length;
    if (ch >= start && ch <= end) return cleanUrl(m[0]);
    // curseur sur le texte d'un lien markdown [texte](url) : la cible est celle-ci
    const before = line.slice(0, start);
    const open = before.lastIndexOf('[');
    if (before.endsWith('](') && open >= 0 && ch >= open && ch <= end) return cleanUrl(m[0].replace(/\)$/, ''));
  }
  return null;
}

/* ================================================================== */
/*  Construction de la commande yt-dlp                                */
/* ================================================================== */

function formatFilter(quality, container) {
  const h = String(quality);
  if (container === 'webm') return 'bestvideo[height<=' + h + '][ext=webm]+bestaudio[ext=webm]/best[ext=webm]';
  if (container === 'mp4') return 'bestvideo[height<=' + h + '][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]';
  return 'bestvideo[height<=' + h + ']+bestaudio/best[height<=' + h + ']';
}

/* Nom de fichier sûr : pas de séparateur de dossier, pas de caractère interdit sur macOS/Windows. */
function safeName(name) {
  return String(name || '').replace(/[\/\\:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim();
}

/* Les options d'un téléchargement (déjà résolues) → arguments yt-dlp, sans shell. */
function buildArgs(job, s, tools) {
  s = s || SETTINGS;
  tools = tools || {};
  // --print implique le mode silencieux : --no-quiet et --no-simulate le rétablissent, la progression reste lisible
  const args = ['--newline', '--no-colors', '--no-quiet', '--no-simulate', '--print', 'after_move:' + FILE_MARK + '%(filepath)s',
    '--embed-chapters', '--embed-metadata'];
  if (tools.ffmpeg) args.push('--ffmpeg-location', tools.ffmpeg);
  if (s.cookiesBrowser && s.cookiesBrowser !== 'none') args.push('--cookies-from-browser', s.cookiesBrowser);
  args.push('-f', formatFilter(job.quality, job.container));
  if (job.container === 'mkv') args.push('--merge-output-format', 'mkv');
  if (job.subtitles) {
    args.push('--write-subs', '--write-auto-subs', '--sub-langs', job.subLangs || s.subLangs || 'fr,en',
      '--sub-format', 'srt', '--convert-subs', 'srt');
    // pas de --embed-subs : le plugin nettoie les .srt puis les intègre lui-même (voir « Sous-titres »)
  }
  let name;
  if (job.series) {
    // épisode : « Nom S01E00001 », le numéro suit avec --autonumber pour qu'une playlist numérote chaque élément
    name = safeName(job.series) + ' S' + pad(job.season, 2) + 'E%(autonumber)05d' + (job.seriesTitle ? ' - %(title)s' : '');
    args.push('--autonumber-start', String(job.episode || 1));
  } else {
    name = job.filename ? safeName(job.filename) : '%(title)s';
  }
  args.push('-o', job.destination.replace(/\/+$/, '') + '/' + name + '.%(ext)s');
  args.push('--', job.url);
  return args;
}

function pad(n, width) {
  const v = String(Math.max(0, parseInt(n, 10) || 0));
  return v.length >= width ? v : '0'.repeat(width - v.length) + v;
}

/* Le nom d'un épisode tel que yt-dlp l'écrira (sans extension), pour l'afficher avant le téléchargement. */
function episodeName(series, season, episode, title) {
  return safeName(series) + ' S' + pad(season, 2) + 'E' + pad(episode, 5) + (title ? ' - ' + title : '');
}

const FILE_MARK = 'JXVD_FILE:';

/* ================================================================== */
/*  Sous-titres : du « défilement » YouTube aux blocs de film         */
/*  (port de yt-subs-fix.py — même logique, sans Python)              */
/* ================================================================== */

const SUB_MAX_DUR = 7.0;   // durée maximale d'un bloc, en secondes
const SUB_MIN_DUR = 1.2;   // durée minimale d'un bloc
const LANG_ISO3 = { fr: 'fre', en: 'eng', es: 'spa', de: 'deu', it: 'ita', pt: 'por', nl: 'nld', ja: 'jpn', ko: 'kor', zh: 'zho', ru: 'rus', ar: 'ara' };
const SUB_CODEC = { '.mkv': 'srt', '.mp4': 'mov_text', '.m4v': 'mov_text' };

function parseTs(t) {
  const m = String(t).match(/(\d+):(\d+):(\d+)[,.](\d+)/);
  if (!m) return 0;
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(m[4]) / 1000;
}

function fmtTs(t) {
  let ms = Math.round(Math.max(0, t) * 1000);
  const h = Math.floor(ms / 3600000); ms -= h * 3600000;
  const mn = Math.floor(ms / 60000); ms -= mn * 60000;
  const sec = Math.floor(ms / 1000); ms -= sec * 1000;
  return pad(h, 2) + ':' + pad(mn, 2) + ':' + pad(sec, 2) + ',' + pad(ms, 3);
}

/* Texte d'un .srt → liste de [début, fin, texte], balises retirées, espaces normalisés. */
function readSrt(raw) {
  const text = String(raw).replace(/^﻿/, '').replace(/\r\n/g, '\n');
  const cues = [];
  for (const block of text.trim().split(/\n\s*\n/)) {
    const lines = block.split('\n').filter((l) => l.trim());
    if (lines.length < 2) continue;
    let i = /^\d+$/.test(lines[0].trim()) ? 1 : 0;
    if (i >= lines.length) continue;
    const m = lines[i].match(/(\d+:\d+:\d+[,.]\d+)\s*-->\s*(\d+:\d+:\d+[,.]\d+)/);
    if (!m) continue;
    let t = lines.slice(i + 1).map((l) => l.trim()).join(' ').trim();
    t = t.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (t) cues.push([parseTs(m[1]), parseTs(m[2]), t]);
  }
  return cues;
}

/* Supprime les répétitions consécutives identiques (artefact YouTube). */
function dedupCues(cues) {
  const out = [];
  for (const c of cues) {
    if (out.length && out[out.length - 1][2] === c[2]) out[out.length - 1][1] = Math.max(out[out.length - 1][1], c[1]);
    else out.push(c.slice());
  }
  return out;
}

/* Apparie les lignes deux par deux, sans chevauchement, en respectant les silences. */
function buildBlocks(cues) {
  const out = [];
  const n = cues.length;
  let i = 0;
  while (i < n) {
    const a = cues[i];
    let b = i + 1 < n ? cues[i + 1] : null;
    if (b && b[0] - a[0] > SUB_MAX_DUR) b = null;   // silence : on ne colle pas les deux lignes
    const lines = [a[2]].concat(b ? [b[2]] : []);
    const start = a[0];
    const nxt = i + (b ? 2 : 1);
    const hardEnd = nxt < n ? cues[nxt][0] : (b ? b[1] : a[1]);
    let end = Math.min(hardEnd, start + SUB_MAX_DUR);
    end = Math.max(end, start + SUB_MIN_DUR);
    if (nxt < n) end = Math.min(end, cues[nxt][0]);   // jamais de chevauchement
    if (end > start) out.push([start, end, lines]);
    i = nxt;
  }
  return out;
}

/* Vrai si le fichier est déjà en blocs non chevauchants : on n'y touche pas. */
function alreadyClean(cues) {
  if (cues.length < 3) return true;
  let overlaps = 0;
  for (let k = 0; k < cues.length - 1; k++) if (cues[k][1] > cues[k + 1][0] + 1e-6) overlaps++;
  return overlaps < cues.length * 0.2;
}

function writeSrt(blocks) {
  return blocks.map((b, k) => (k + 1) + '\n' + fmtTs(b[0]) + ' --> ' + fmtTs(b[1]) + '\n' + b[2].join('\n') + '\n').join('\n') + '\n';
}

/* Nettoie un .srt sur place ; renvoie true s'il a été réécrit. */
function fixSrtFile(path, fs) {
  fs = fs || require('fs');
  let cues;
  try { cues = readSrt(fs.readFileSync(path, 'utf8')); } catch (e) { return false; }
  if (cues.length < 3 || alreadyClean(cues)) return false;
  const blocks = buildBlocks(dedupCues(cues));
  if (!blocks.length) return false;
  fs.writeFileSync(path + '.tmp', writeSrt(blocks), 'utf8');
  fs.renameSync(path + '.tmp', path);
  return true;
}

function splitPath(p) {
  const slash = p.lastIndexOf('/');
  const dir = slash >= 0 ? (p.slice(0, slash) || '/') : '.';
  const name = p.slice(slash + 1);
  const dot = name.lastIndexOf('.');
  return { dir, name, stem: dot > 0 ? name.slice(0, dot) : name, ext: dot > 0 ? name.slice(dot).toLowerCase() : '' };
}

/* Les .srt posés à côté de la vidéo : « Vidéo.srt », « Vidéo.en.srt », « Vidéo.fr-orig.srt ». */
function findSidecars(video, fs) {
  fs = fs || require('fs');
  const { dir, stem } = splitPath(video);
  let entries;
  try { entries = fs.readdirSync(dir); } catch (e) { return []; }
  return entries.filter((n) => {
    if (!n.toLowerCase().endsWith('.srt')) return false;
    const base = n.slice(0, -4);
    return base === stem || (base.startsWith(stem + '.') && !base.slice(stem.length + 1).includes('.'));
  }).sort().map((n) => (dir === '/' ? '' : dir) + '/' + n);
}

function langOf(srt, video) {
  const stem = splitPath(video).stem;
  const base = splitPath(srt).name.slice(0, -4);
  const tag = base.startsWith(stem + '.') ? base.slice(stem.length + 1) : '';
  const short = tag.split('-')[0].toLowerCase();
  return { iso: LANG_ISO3[short] || (short || 'und'), tag: tag || 'und' };
}

/* Arguments ffmpeg pour intégrer les .srt comme pistes du conteneur (copie des flux, pas de réencodage). */
function embedArgs(video, srts, tmp) {
  const codec = SUB_CODEC[splitPath(video).ext];
  if (!codec) return null;
  const args = ['-hide_banner', '-loglevel', 'error', '-y', '-i', video];
  for (const s of srts) args.push('-i', s);
  args.push('-map', '0:v?', '-map', '0:a?');
  for (let i = 1; i <= srts.length; i++) args.push('-map', String(i));
  args.push('-c', 'copy', '-c:s', codec);
  srts.forEach((s, i) => {
    const l = langOf(s, video);
    args.push('-metadata:s:s:' + i, 'language=' + l.iso, '-metadata:s:s:' + i, 'title=' + l.tag);
  });
  args.push(tmp);
  return args;
}

function runProcess(cmd, args, env) {
  return new Promise((resolve) => {
    let child;
    try { child = require('child_process').spawn(cmd, args, { env, windowsHide: true }); }
    catch (e) { resolve({ code: -1, out: e.message }); return; }
    let out = '';
    child.stdout.on('data', (d) => { out += d.toString(); });
    child.stderr.on('data', (d) => { out += d.toString(); });
    child.on('error', (e) => resolve({ code: -1, out: e.message }));
    child.on('close', (code) => resolve({ code, out }));
  });
}

/* Après un téléchargement : nettoie les .srt voisins, les intègre (MKV/MP4) puis les supprime ; WebM les garde à côté. */
async function postProcessSubtitles(video, ffmpegPath, env) {
  const fs = require('fs');
  const result = { cleaned: 0, embedded: false, srts: [] };
  if (!fs.existsSync(video)) return result;
  const srts = findSidecars(video, fs);
  result.srts = srts;
  if (!srts.length) return result;
  for (const srt of srts) if (fixSrtFile(srt, fs)) result.cleaned++;
  if (!ffmpegPath) return result;
  const { dir, ext } = splitPath(video);
  const tmp = (dir === '/' ? '' : dir) + '/.jxvd-' + Date.now() + ext;
  const args = embedArgs(video, srts, tmp);
  if (!args) return result;
  const r = await runProcess(ffmpegPath, args, env);
  let ok = false;
  try { ok = r.code === 0 && fs.statSync(tmp).size > 0; } catch (e) { ok = false; }
  if (ok) {
    fs.renameSync(tmp, video);
    for (const srt of srts) { try { fs.unlinkSync(srt); } catch (e) { /* on garde le .srt, tant pis */ } }
    result.embedded = true;
  } else {
    try { fs.unlinkSync(tmp); } catch (e) { /* déjà absent */ }
    result.error = (r.out || '').trim().split('\n').pop();
  }
  return result;
}

/* ================================================================== */
/*  Outils : détection, installation, mise à jour                     */
/* ================================================================== */

const IS_WIN = typeof process !== 'undefined' && process.platform === 'win32';
const EXE = IS_WIN ? '.exe' : '';

/* D'où viennent les binaires : pages de publication officielles sur GitHub, choisies selon le système. */
const TOOLS = {
  ytdlp: {
    label: 'yt-dlp', repo: 'yt-dlp/yt-dlp', bin: 'yt-dlp' + EXE, versionArgs: ['--version'], compareVersion: true,
    asset: { 'darwin-arm64': 'yt-dlp_macos', 'darwin-x64': 'yt-dlp_macos', 'linux-x64': 'yt-dlp_linux', 'linux-arm64': 'yt-dlp_linux_aarch64', 'win32-x64': 'yt-dlp.exe' },
    sums: 'SHA2-256SUMS',
  },
  ffmpeg: {
    label: 'ffmpeg', repo: 'eugeneware/ffmpeg-static', bin: 'ffmpeg' + EXE, versionArgs: ['-version'],
    asset: { 'darwin-arm64': 'ffmpeg-darwin-arm64', 'darwin-x64': 'ffmpeg-darwin-x64', 'linux-x64': 'ffmpeg-linux-x64', 'linux-arm64': 'ffmpeg-linux-arm64', 'win32-x64': 'ffmpeg-win32-x64.exe' },
    sums: null,
  },
  deno: {
    label: 'deno', repo: 'denoland/deno', bin: 'deno' + EXE, versionArgs: ['--version'], zip: true, compareVersion: true,
    asset: { 'darwin-arm64': 'deno-aarch64-apple-darwin.zip', 'darwin-x64': 'deno-x86_64-apple-darwin.zip', 'linux-x64': 'deno-x86_64-unknown-linux-gnu.zip', 'linux-arm64': 'deno-aarch64-unknown-linux-gnu.zip', 'win32-x64': 'deno-x86_64-pc-windows-msvc.zip' },
    sums: 'asset.sha256sum',
  },
};

function platformKey() {
  if (typeof process === 'undefined') return 'darwin-arm64';
  return process.platform + '-' + process.arch;
}

/* Le numéro de version dans la sortie de « --version » : première ligne, premier motif x.y.z. */
function parseVersion(out) {
  const m = String(out || '').split('\n')[0].match(/\d+\.\d+(\.\d+)?/);
  return m ? m[0] : '';
}

/* Les dossiers où chercher un outil que l'utilisateur n'a pas désigné, dans l'ordre. */
function candidatePaths(name, binDir) {
  const t = TOOLS[name];
  const out = [];
  if (binDir) out.push(binDir + '/' + t.bin);
  if (IS_WIN) {
    const env = (typeof process !== 'undefined' && process.env) || {};
    for (const d of String(env.PATH || '').split(';')) if (d) out.push(d + '\\' + t.bin);
  } else {
    for (const d of ['/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', HOME + '/.local/bin', HOME + '/.deno/bin', HOME + '/bin']) out.push(d + '/' + t.bin);
    const env = (typeof process !== 'undefined' && process.env) || {};
    for (const d of String(env.PATH || '').split(':')) if (d) out.push(d + '/' + t.bin);
  }
  return out;
}

/* Le chemin retenu pour un outil : réglage explicite, sinon premier candidat existant. */
function resolveTool(name, s, binDir, fs) {
  fs = fs || require('fs');
  s = s || SETTINGS;
  const explicit = { ytdlp: s.ytdlpPath, ffmpeg: s.ffmpegPath, deno: s.denoPath }[name];
  if (explicit && explicit.trim()) {
    const p = expandHome(explicit.trim());
    return fs.existsSync(p) ? p : null;
  }
  for (const p of candidatePaths(name, binDir)) { try { if (fs.existsSync(p)) return p; } catch (e) { /* suivant */ } }
  return null;
}

/* Télécharge une URL dans un fichier en suivant les redirections, avec la progression. */
function downloadFile(url, dest, onProgress, hops) {
  hops = hops || 0;
  return new Promise((resolve, reject) => {
    if (hops > 8) { reject(new Error('too many redirects')); return; }
    const https = require('https');
    const fs = require('fs');
    const req = https.get(url, { headers: { 'User-Agent': 'obsidian-jexyllax-video-downloader' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        resolve(downloadFile(new URL(res.headers.location, url).toString(), dest, onProgress, hops + 1));
        return;
      }
      if (res.statusCode !== 200) { res.resume(); reject(new Error('HTTP ' + res.statusCode)); return; }
      const total = Number(res.headers['content-length'] || 0);
      let got = 0;
      const file = fs.createWriteStream(dest);
      res.on('data', (chunk) => { got += chunk.length; if (onProgress) onProgress(got, total); });
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve(dest)));
      file.on('error', reject);
      res.on('error', reject);
    });
    req.on('error', reject);
  });
}

function sha256File(path) {
  const crypto = require('crypto');
  const fs = require('fs');
  return crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
}

/* L'empreinte attendue d'un fichier dans un « SHA2-256SUMS » (« hash  nom » par ligne) ou un « .sha256sum ». */
function expectedSum(text, assetName) {
  for (const line of String(text || '').split('\n')) {
    const m = line.trim().match(/^([0-9a-f]{64})\s+\*?(.+)$/i);
    if (m && (m[2].trim() === assetName || m[2].trim().endsWith('/' + assetName))) return m[1].toLowerCase();
  }
  const single = String(text || '').trim().match(/^([0-9a-f]{64})$/i);
  return single ? single[1].toLowerCase() : null;
}

class ToolManager {
  constructor(plugin) {
    this.plugin = plugin;
    this.status = {};     // name → { path, version, latest }
    this.busy = {};
  }

  get binDir() { return this.plugin.pluginDir + '/bin'; }

  path(name) { return resolveTool(name, SETTINGS, this.binDir); }

  /* Chemins de tous les outils, pour la commande de téléchargement. */
  paths() { return { ytdlp: this.path('ytdlp'), ffmpeg: this.path('ffmpeg'), deno: this.path('deno') }; }

  missing() { return Object.keys(TOOLS).filter((n) => !this.path(n)); }

  /* L'environnement des processus lancés : bin/ du plugin et les dossiers habituels devant le PATH. */
  env() {
    const env = Object.assign({}, process.env);
    const extra = [this.binDir];
    for (const n of Object.keys(TOOLS)) { const p = this.path(n); if (p) extra.push(splitPath(p).dir); }
    if (!IS_WIN) extra.push('/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', '/bin');
    env.PATH = extra.concat([env.PATH || '']).filter(Boolean).join(IS_WIN ? ';' : ':');
    return env;
  }

  async check(name) {
    const path = this.path(name);
    const st = { path, version: '', latest: this.status[name] ? this.status[name].latest : '' };
    if (path) {
      const r = await runProcess(path, TOOLS[name].versionArgs, this.env());
      st.version = r.code === 0 ? parseVersion(r.out) : '';
      if (r.code !== 0 && !st.version) st.error = (r.out || '').trim().split('\n')[0];
      st.inBin = path.startsWith(this.binDir + '/');
      st.installedRelease = st.inBin ? this.installedRelease(name) : '';
    }
    this.status[name] = st;
    return st;
  }

  /* La release installée dans bin/, notée à l'installation : le binaire de ffmpeg-static n'annonce pas la même version que sa release. */
  installedRelease(name) {
    try { return require('fs').readFileSync(this.binDir + '/' + name + '.release', 'utf8').trim(); } catch (e) { return ''; }
  }

  /* 'current' (à jour), 'outdated' (une release plus récente existe), '' (impossible à dire). */
  updateState(name) {
    const st = this.status[name] || {};
    if (!st.path || !st.latest) return '';
    if (st.inBin) return st.installedRelease ? (st.installedRelease === st.latest ? 'current' : 'outdated') : '';
    if (!TOOLS[name].compareVersion || !st.version) return '';
    return st.version === st.latest ? 'current' : 'outdated';
  }

  async checkAll() { for (const n of Object.keys(TOOLS)) await this.check(n); return this.status; }

  async latest(name) {
    const r = await requestUrl({ url: 'https://api.github.com/repos/' + TOOLS[name].repo + '/releases/latest', headers: { 'User-Agent': 'obsidian-jexyllax-video-downloader' } });
    const tag = String(r.json.tag_name || '');
    const st = this.status[name] || (this.status[name] = {});
    st.latest = tag.replace(/^v/, '').replace(/^b/, '');
    st.assets = r.json.assets || [];
    return st.latest;
  }

  /* Installe (ou remplace) un outil dans bin/ depuis sa dernière publication, empreinte vérifiée quand elle est publiée. */
  async install(name, onProgress) {
    const t = TOOLS[name];
    const key = platformKey();
    const assetName = t.asset[key];
    if (!assetName) throw new Error(tr('tools.unsupported', key));
    if (this.busy[name]) return;
    this.busy[name] = true;
    const fs = require('fs');
    try {
      await this.latest(name);
      const assets = this.status[name].assets || [];
      const asset = assets.find((a) => a.name === assetName);
      if (!asset) throw new Error(assetName + ' ' + tr('tools.missing'));
      fs.mkdirSync(this.binDir, { recursive: true });
      const tmp = this.binDir + '/.' + assetName + '.part';
      await downloadFile(asset.browser_download_url, tmp, (got, total) => onProgress && onProgress(got, total));

      // empreinte : fichier de sommes de la release, ou <asset>.sha256sum à côté
      const sumsName = t.sums === 'asset.sha256sum' ? assetName + '.sha256sum' : t.sums;
      const sumsAsset = sumsName ? assets.find((a) => a.name === sumsName) : null;
      if (sumsAsset) {
        onProgress && onProgress(-1, 0);
        const txt = (await requestUrl({ url: sumsAsset.browser_download_url })).text;
        const expected = expectedSum(txt, assetName);
        if (expected && sha256File(tmp) !== expected) { fs.unlinkSync(tmp); throw new Error(tr('tools.badChecksum')); }
      }

      const dest = this.binDir + '/' + t.bin;
      if (t.zip) {
        const r = await runProcess(IS_WIN ? 'tar' : '/usr/bin/tar', ['-xf', tmp, '-C', this.binDir], this.env());
        fs.unlinkSync(tmp);
        if (r.code !== 0) throw new Error(r.out.trim().split('\n').pop() || 'unzip');
      } else {
        fs.renameSync(tmp, dest);
      }
      if (!IS_WIN) fs.chmodSync(dest, 0o755);
      fs.writeFileSync(this.binDir + '/' + name + '.release', this.status[name].latest || '', 'utf8');
      // macOS met en quarantaine ce qui vient du réseau : on l'enlève, sinon Gatekeeper bloque le binaire
      if (typeof process !== 'undefined' && process.platform === 'darwin') await runProcess('/usr/bin/xattr', ['-d', 'com.apple.quarantine', dest], this.env());
      await this.check(name);
      return this.status[name];
    } finally {
      this.busy[name] = false;
    }
  }
}

/* ================================================================== */
/*  Lecture de la sortie de yt-dlp                                    */
/* ================================================================== */

/* Une ligne de yt-dlp → { pct, speed, eta, phase, file } ou null si sans intérêt. */
function parseLine(line) {
  const l = String(line).trim();
  let m;
  if ((m = l.match(/^\[download\]\s+([\d.]+)%\s+of\s+~?\s*([\d.]+\s*\w+)(?:\s+at\s+([\d.]+\s*\w+\/s|Unknown\s+\S+))?(?:\s+ETA\s+(\S+))?/))) {
    return { phase: 'download', pct: parseFloat(m[1]), size: m[2], speed: m[3] || '', eta: m[4] || '' };
  }
  if (l.startsWith(FILE_MARK)) return { phase: 'file', file: l.slice(FILE_MARK.length) };
  if ((m = l.match(/^\[download\]\s+Destination:\s+(.+)$/))) return { phase: 'download', file: m[1] };
  if ((m = l.match(/^\[Merger\]\s+Merging formats into\s+"(.+)"$/))) return { phase: 'merge', file: m[1] };
  if (/^\[Exec\]/.test(l) || (/^\[(EmbedSubtitle|SubtitlesConvertor|FFmpegSubtitlesConvertor|info)\]/.test(l) && /subtitle/i.test(l))) return { phase: 'subs' };
  if ((m = l.match(/^\[download\]\s+Downloading item\s+(\d+)\s+of\s+(\d+)/))) return { phase: 'item', index: Number(m[1]), count: Number(m[2]) };
  if ((m = l.match(/^ERROR:\s*(.+)$/))) return { phase: 'error', message: m[1] };
  return null;
}

/* ================================================================== */
/*  File d'attente et lancement                                       */
/* ================================================================== */

class Downloader {
  constructor(plugin) {
    this.plugin = plugin;
    this.jobs = [];        // tous les travaux, dans l'ordre d'arrivée, avec leur état
    this.current = null;   // le travail en cours
    this.listeners = [];
    this.seq = 0;
  }

  onChange(fn) { this.listeners.push(fn); return () => { this.listeners = this.listeners.filter((f) => f !== fn); }; }
  notify() { for (const fn of this.listeners) { try { fn(this); } catch (e) { /* un écouteur cassé n'arrête pas les autres */ } } }

  get queue() { return this.jobs.filter((j) => j.state === 'queued'); }

  add(job) {
    job.id = ++this.seq;
    job.state = 'queued';
    job.pct = 0;
    job.file = '';
    job.error = '';
    job.item = null;
    this.jobs.push(job);
    if (this.current) {
      new Notice(tr('notice.queued', this.queue.length));
      this.plugin.setStatus(this.statusText());
      this.notify();
    } else {
      this.next();
    }
    return job;
  }

  addAll(jobs) { for (const j of jobs) this.add(j); }

  /* Retire un travail en attente, ou annule celui en cours. */
  remove(id) {
    const job = this.jobs.find((j) => j.id === id);
    if (!job) return;
    if (job.state === 'running') { this.cancel(); return; }
    if (job.state === 'queued') job.state = 'cancelled';
    else this.jobs = this.jobs.filter((j) => j.id !== id);
    this.notify();
  }

  clearFinished() {
    this.jobs = this.jobs.filter((j) => j.state === 'queued' || j.state === 'running');
    this.notify();
  }

  next() {
    const job = this.queue[0];
    if (!job) { this.current = null; this.plugin.setStatus(''); this.notify(); return; }
    this.run(job);
  }

  run(job) {
    let spawn;
    try { spawn = require('child_process').spawn; }
    catch (e) { job.state = 'failed'; job.error = 'child_process'; new Notice(tr('notice.failed', 'child_process')); this.current = null; this.notify(); return; }

    const fs = require('fs');
    const tools = this.plugin.tools.paths();
    if (!tools.ytdlp) {
      const msg = tr('tools.missingNotice', this.plugin.tools.missing().map((n) => TOOLS[n].label).join(', '));
      new Notice(msg, 8000);
      job.state = 'failed'; job.error = msg;
      this.current = null; this.plugin.setStatus(''); this.notify(); return;
    }
    try { fs.mkdirSync(job.destination, { recursive: true }); } catch (e) { /* yt-dlp le dira */ }

    const args = buildArgs(job, SETTINGS, tools);
    const env = this.plugin.tools.env();

    job.state = 'running';
    job.child = null;
    job.files = [];
    this.current = job;
    this.plugin.setStatus(tr('status.starting'));
    new Notice(tr('notice.started', jobLabel(job)));
    this.notify();

    let child;
    try { child = spawn(tools.ytdlp, args, { env, cwd: job.destination, windowsHide: true }); }
    catch (e) { job.state = 'failed'; job.error = e.message; new Notice(tr('notice.failed', e.message)); this.next(); return; }
    job.child = child;

    let buf = '';
    const onData = (chunk) => {
      buf += chunk.toString();
      const lines = buf.split(/\r?\n|\r/);
      buf = lines.pop();
      for (const line of lines) this.onLine(line);
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('error', (e) => { job.error = e.message; });
    child.on('close', async (code) => {
      if (buf) this.onLine(buf);
      job.child = null;
      if (job.cancelled) { job.state = 'cancelled'; new Notice(tr('notice.cancelled')); }
      else if (code === 0) {
        // sous-titres : nettoyage puis intégration, fichier par fichier (une playlist en produit plusieurs)
        if (job.subtitles && job.files.length) {
          job.detail = tr('status.subs');
          this.plugin.setStatus(tr('status.subs') + this.suffix());
          this.notify();
          for (const f of job.files) {
            try { await postProcessSubtitles(f, tools.ffmpeg, env); } catch (e) { /* la vidéo est là, les .srt restent à côté */ }
          }
        }
        job.state = 'done'; job.pct = 100; job.detail = '';
        new Notice(tr('notice.done', baseName(job.file || job.url)), 8000);
      }
      else { job.state = 'failed'; new Notice(tr('notice.failed', job.error || ('code ' + code)), 10000); }
      // une playlist en mode Série a consommé plusieurs numéros : on décale les épisodes qui suivent
      if (job.series && job.item && job.item.count > 1) {
        const shift = job.item.count - 1;
        for (const j of this.jobs) if (j.state === 'queued' && j.series === job.series && j.batch === job.batch) j.episode += shift;
      }
      this.next();
    });
  }

  onLine(line) {
    const p = parseLine(line);
    const job = this.current;
    if (!p || !job) return;
    if (p.phase === 'file') { job.file = p.file; job.files.push(p.file); this.notify(); return; }
    // le nom affiché suit le fichier vidéo, pas les sous-titres téléchargés avant lui
    if (p.file && !/\.(srt|vtt|ass)$/i.test(p.file)) job.file = p.file;
    if (p.phase === 'error') job.error = p.message;
    if (p.phase === 'item') { job.item = { index: p.index, count: p.count }; }
    if (p.phase === 'download' && typeof p.pct === 'number') {
      job.pct = p.pct;
      job.detail = p.eta ? 'ETA ' + p.eta : p.speed;
      this.plugin.setStatus(tr('status.downloading', p.pct.toFixed(0) + ' %', job.detail) + this.suffix());
    } else if (p.phase === 'merge') {
      job.detail = tr('status.merging');
      this.plugin.setStatus(tr('status.merging') + this.suffix());
    } else if (p.phase === 'subs') {
      job.detail = tr('status.subs');
      this.plugin.setStatus(tr('status.subs') + this.suffix());
    } else return;
    this.notify();
  }

  suffix() { const n = this.queue.length; return n ? ' (+' + n + ')' : ''; }

  statusText() {
    if (!this.current) return '';
    return tr('status.downloading', this.current.pct.toFixed(0) + ' %', '') + this.suffix();
  }

  cancel() {
    const job = this.current;
    if (!job || !job.child) { new Notice(tr('notice.nothingRunning')); return; }
    job.cancelled = true;
    try { job.child.kill('SIGTERM'); } catch (e) { /* déjà terminé */ }
  }
}

/* Ce qu'on affiche pour un travail : le nom d'épisode, le nom imposé, ou le lien. */
function jobLabel(job) {
  if (job.series) return episodeName(job.series, job.season, job.episode);
  if (job.filename) return safeName(job.filename);
  return job.file ? baseName(job.file) : job.url;
}

function baseName(p) {
  const s = String(p || '');
  return s.slice(s.lastIndexOf('/') + 1);
}

/* ================================================================== */
/*  Autocomplétion des dossiers du disque                             */
/* ================================================================== */

/* Sous-dossiers qui complètent ce qui est tapé : « ~/Dow » → « ~/Downloads ». Jamais de fichiers. */
function folderSuggestions(typed, fs) {
  fs = fs || require('fs');
  const raw = String(typed || '');
  const text = raw.trim() ? raw.trim() : '~/';
  const expanded = expandHome(text);
  const slash = expanded.lastIndexOf('/');
  if (slash < 0) return [];
  const dir = expanded.slice(0, slash) || '/';
  const prefix = expanded.slice(slash + 1).toLowerCase();
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return []; }
  const keepTilde = text.startsWith('~/');
  const out = [];
  for (const e of entries) {
    if (!e.isDirectory() || e.name.startsWith('.')) continue;
    if (prefix && !e.name.toLowerCase().startsWith(prefix)) continue;
    const full = (dir === '/' ? '' : dir) + '/' + e.name;
    out.push(keepTilde ? '~' + full.slice(HOME.length) : full);
  }
  out.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  return out.slice(0, 30);
}

/* Branche l'autocomplétion sur un champ texte ; repli sur un <datalist> si l'API n'existe pas. */
function attachFolderSuggest(app, inputEl, onPick) {
  let Base = null;
  try { Base = require('obsidian').AbstractInputSuggest; } catch (e) { Base = null; }
  if (Base) {
    class FolderSuggest extends Base {
      getSuggestions(query) { return folderSuggestions(query); }
      renderSuggestion(value, el) { el.setText(value); }
      selectSuggestion(value) {
        inputEl.value = value + '/';
        inputEl.trigger('input');
        this.close();
        if (onPick) onPick(value);
      }
    }
    new FolderSuggest(app, inputEl);
    return;
  }
  const list = document.createElement('datalist');
  list.id = 'jxvd-folders-' + Math.random().toString(36).slice(2);
  document.body.appendChild(list);
  inputEl.setAttribute('list', list.id);
  inputEl.addEventListener('input', () => {
    while (list.firstChild) list.removeChild(list.firstChild);
    for (const v of folderSuggestions(inputEl.value)) {
      const o = document.createElement('option'); o.value = v; list.appendChild(o);
    }
  });
}

/* ================================================================== */
/*  Fenêtre d'options — « comme un menu d'impression »                */
/* ================================================================== */

/* Dossiers réellement renseignés dans les réglages, le premier étant le défaut. */
function destinationsList(s) {
  s = s || SETTINGS;
  return (s.destinations || []).filter((d) => d && d.path && d.path.trim())
    .map((d) => {
      const path = expandHome(d.path.trim()).replace(/(.)\/+$/, '$1');
      return { name: (d.name || '').trim() || baseName(path) || path, path };
    });
}

function expandHome(p) {
  return p.startsWith('~/') ? HOME + p.slice(1) : p;
}

/* Le téléchargement tel que « Télécharger » le lance : les réglages, rien d'autre. */
function defaultJob(url, s) {
  s = s || SETTINGS;
  const dests = destinationsList(s);
  return {
    url: cleanUrl(url),
    quality: s.quality,
    container: s.container,
    subtitles: !!s.subtitles,
    subLangs: s.subLangs,
    filename: '',
    destination: dests.length ? dests[0].path : HOME + '/Downloads',
  };
}

class OptionsModal extends Modal {
  constructor(app, job, onSubmit) {
    super(app);
    this.job = job;
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('jxvd-modal');
    contentEl.createEl('h2', { text: tr('modal.title') });

    new Setting(contentEl).setName(tr('modal.url')).addText((t) => {
      t.setValue(this.job.url).onChange((v) => { this.job.url = cleanUrl(v); });
      t.inputEl.addClass('jxvd-wide');
    });

    new Setting(contentEl).setName(tr('modal.quality')).addDropdown((d) => d
      .addOptions({ '720': '720p', '1080': '1080p', '1440': '1440p' })
      .setValue(String(this.job.quality))
      .onChange((v) => { this.job.quality = v; }));

    new Setting(contentEl).setName(tr('modal.container')).addDropdown((d) => d
      .addOptions({ mkv: tr('container.mkv'), mp4: tr('container.mp4'), webm: tr('container.webm') })
      .setValue(this.job.container)
      .onChange((v) => { this.job.container = v; }));

    new Setting(contentEl).setName(tr('modal.subtitles')).setDesc(tr('modal.subtitlesDesc', this.job.subLangs))
      .addToggle((c) => c.setValue(this.job.subtitles).onChange((v) => { this.job.subtitles = v; }));

    new Setting(contentEl).setName(tr('modal.filename')).setDesc(tr('modal.filenameDesc')).addText((t) => {
      t.setValue(this.job.filename).onChange((v) => { this.job.filename = v; });
      t.inputEl.addClass('jxvd-wide');
      if (!SETTINGS.keepTitle) window.setTimeout(() => t.inputEl.focus(), 0);
    });

    const dests = destinationsList();
    const options = {};
    dests.forEach((d, i) => { options['d' + i] = d.name + ' — ' + d.path; });
    options.other = tr('modal.otherFolder');
    let otherRow = null;
    const currentKey = () => {
      const i = dests.findIndex((d) => d.path === this.job.destination);
      return i >= 0 ? 'd' + i : 'other';
    };
    new Setting(contentEl).setName(tr('modal.destination')).addDropdown((d) => d
      .addOptions(options)
      .setValue(currentKey())
      .onChange((v) => {
        if (v === 'other') { otherRow.settingEl.show(); otherRow.controlEl.querySelector('input').focus(); }
        else { this.job.destination = dests[Number(v.slice(1))].path; otherRow.settingEl.hide(); }
      }));
    otherRow = new Setting(contentEl).setName(tr('modal.otherFolder')).setDesc(tr('modal.otherFolderDesc')).addText((t) => {
      t.setValue(currentKey() === 'other' ? this.job.destination : '').onChange((v) => { this.job.destination = expandHome(v.trim()); });
      t.inputEl.addClass('jxvd-wide');
      attachFolderSuggest(this.app, t.inputEl);
    });
    if (currentKey() !== 'other') otherRow.settingEl.hide();

    new Setting(contentEl)
      .addButton((b) => b.setButtonText(tr('modal.cancel')).onClick(() => this.close()))
      .addButton((b) => b.setButtonText(tr('modal.ok')).setCta().onClick(() => this.submit()));

    // Entrée valide, comme un menu d'impression : si les défauts conviennent, on ne relit rien
    this.scope.register([], 'Enter', (evt) => { if (evt.target && evt.target.tagName !== 'BUTTON') { evt.preventDefault(); this.submit(); } });
  }

  submit() {
    if (!this.job.url || !/^https?:\/\//i.test(this.job.url)) { new Notice(tr('notice.noUrl')); return; }
    if (!this.job.destination) { new Notice(tr('modal.otherFolderDesc')); return; }
    this.close();
    this.onSubmit(this.job);
  }

  onClose() { this.contentEl.empty(); }
}

/* ================================================================== */
/*  Panneau latéral : coller des liens, télécharger des séries        */
/* ================================================================== */

const VIEW_TYPE = 'jexyllax-video-downloader';

/* Les travaux à créer à partir du panneau : un par ligne, numérotés en mode Série. */
function jobsFromPanel(form, s) {
  s = s || SETTINGS;
  const urls = String(form.text || '').split(/\r?\n/).map(cleanUrl).filter((u) => /^https?:\/\//i.test(u));
  if (!urls.length) return { error: 'view.noUrls', jobs: [] };
  const batch = Date.now();
  if (form.mode === 'series') {
    const series = safeName(form.seriesName);
    if (!series) return { error: 'view.noSeriesName', jobs: [] };
    const season = Math.max(1, parseInt(form.season, 10) || 1);
    let episode = Math.max(1, parseInt(form.startEpisode, 10) || 1);
    const base = expandHome((form.seriesBase || s.seriesBase || HOME + '/Downloads/TV Shows').replace(/\/+$/, ''));
    return { jobs: urls.map((url) => ({
      url, quality: form.quality, container: form.container, subtitles: !!form.subtitles, subLangs: s.subLangs,
      filename: '', destination: base + '/' + series,
      series, season, episode: episode++, seriesTitle: !!form.seriesTitle, batch,
    })) };
  }
  return { jobs: urls.map((url) => Object.assign(defaultJob(url, s), {
    quality: form.quality, container: form.container, subtitles: !!form.subtitles, destination: form.destination || defaultJob(url, s).destination, batch,
  })) };
}

class DownloadView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.form = null;
  }

  getViewType() { return VIEW_TYPE; }
  getDisplayText() { return tr('view.title'); }
  getIcon() { return 'download'; }

  async onOpen() {
    this.unsubscribe = this.plugin.downloader.onChange(() => this.renderJobs());
    this.render();
  }

  async onClose() {
    if (this.unsubscribe) this.unsubscribe();
  }

  /* Le formulaire ne se reconstruit que sur demande ; la liste des travaux, à chaque changement. */
  render() {
    const root = this.contentEl;
    root.empty();
    root.addClass('jxvd-view');
    const s = SETTINGS;
    if (!this.form) {
      const dests = destinationsList(s);
      this.form = { text: '', mode: 'videos', seriesName: '', season: 1, startEpisode: 1, seriesTitle: !!s.seriesTitle,
        seriesBase: s.seriesBase, quality: s.quality, container: s.container, subtitles: !!s.subtitles,
        destination: dests.length ? dests[0].path : HOME + '/Downloads' };
    }
    const f = this.form;

    root.createEl('h4', { text: tr('view.title') });

    const urls = root.createEl('textarea', { cls: 'jxvd-urls', attr: { rows: 5, placeholder: 'https://…' } });
    urls.value = f.text;
    urls.addEventListener('input', () => { f.text = urls.value; this.updateButton(); });
    root.createEl('div', { cls: 'setting-item-description jxvd-help', text: tr('view.urlsDesc') });

    new Setting(root).setName(tr('view.mode')).addDropdown((d) => d
      .addOptions({ videos: tr('mode.videos'), series: tr('mode.series') })
      .setValue(f.mode)
      .onChange((v) => { f.mode = v; this.render(); }));

    if (f.mode === 'series') {
      const box = root.createDiv({ cls: 'jxvd-series' });
      new Setting(box).setName(tr('view.seriesName')).addText((t) => {
        t.setValue(f.seriesName).onChange((v) => { f.seriesName = v; this.updateFolderHint(); });
        t.inputEl.addClass('jxvd-wide');
        window.setTimeout(() => t.inputEl.focus(), 0);
      });
      new Setting(box).setName(tr('view.season')).addText((t) => {
        t.setValue(String(f.season)).onChange((v) => { f.season = parseInt(v, 10) || 1; });
        t.inputEl.type = 'number'; t.inputEl.min = '1'; t.inputEl.addClass('jxvd-num');
      });
      new Setting(box).setName(tr('view.startEpisode')).addText((t) => {
        t.setValue(String(f.startEpisode)).onChange((v) => { f.startEpisode = parseInt(v, 10) || 1; });
        t.inputEl.type = 'number'; t.inputEl.min = '1'; t.inputEl.addClass('jxvd-num');
      });
      new Setting(box).setName(tr('view.seriesTitle')).addToggle((c) => c.setValue(f.seriesTitle).onChange((v) => { f.seriesTitle = v; }));
      new Setting(box).setName(tr('set.seriesBase')).addText((t) => {
        t.setValue(f.seriesBase || '').onChange((v) => { f.seriesBase = v.trim(); this.updateFolderHint(); });
        t.inputEl.addClass('jxvd-wide');
        attachFolderSuggest(this.app, t.inputEl);
      });
      this.folderHint = box.createEl('div', { cls: 'setting-item-description jxvd-help' });
      this.updateFolderHint();
    }

    const details = root.createEl('details', { cls: 'jxvd-options' });
    details.createEl('summary', { text: tr('view.options') });
    new Setting(details).setName(tr('modal.quality')).addDropdown((d) => d
      .addOptions({ '720': '720p', '1080': '1080p', '1440': '1440p' }).setValue(String(f.quality)).onChange((v) => { f.quality = v; }));
    new Setting(details).setName(tr('modal.container')).addDropdown((d) => d
      .addOptions({ mkv: tr('container.mkv'), mp4: tr('container.mp4'), webm: tr('container.webm') }).setValue(f.container).onChange((v) => { f.container = v; }));
    new Setting(details).setName(tr('modal.subtitles')).addToggle((c) => c.setValue(f.subtitles).onChange((v) => { f.subtitles = v; }));
    if (f.mode !== 'series') {
      const dests = destinationsList(s);
      const options = {};
      dests.forEach((d, i) => { options['d' + i] = d.name; });
      options.other = tr('modal.otherFolder');
      const idx = dests.findIndex((d) => d.path === f.destination);
      let otherRow = null;
      new Setting(details).setName(tr('modal.destination')).addDropdown((d) => d
        .addOptions(options).setValue(idx >= 0 ? 'd' + idx : 'other')
        .onChange((v) => {
          if (v === 'other') { otherRow.settingEl.show(); }
          else { f.destination = dests[Number(v.slice(1))].path; otherRow.settingEl.hide(); }
        }));
      otherRow = new Setting(details).setName(tr('modal.otherFolder')).addText((t) => {
        t.setValue(idx >= 0 ? '' : f.destination).onChange((v) => { f.destination = expandHome(v.trim()); });
        t.inputEl.addClass('jxvd-wide');
        attachFolderSuggest(this.app, t.inputEl);
      });
      if (idx >= 0) otherRow.settingEl.hide();
    }

    const actions = root.createDiv({ cls: 'jxvd-actions' });
    this.button = actions.createEl('button', { cls: 'mod-cta', text: tr('view.download') });
    this.button.addEventListener('click', () => this.submit());
    this.updateButton();

    root.createEl('h5', { text: tr('view.jobs') });
    this.jobsEl = root.createDiv({ cls: 'jxvd-jobs' });
    this.renderJobs();
  }

  updateFolderHint() {
    if (!this.folderHint) return;
    const f = this.form;
    const base = expandHome((f.seriesBase || SETTINGS.seriesBase || '').replace(/\/+$/, ''));
    this.folderHint.setText(tr('view.seriesFolder', base + '/' + (safeName(f.seriesName) || '…') + '/' + episodeName(f.seriesName || '…', f.season, f.startEpisode) + '.' + f.container));
  }

  updateButton() {
    if (!this.button) return;
    const n = String(this.form.text || '').split(/\r?\n/).map(cleanUrl).filter((u) => /^https?:\/\//i.test(u)).length;
    this.button.setText(n > 1 ? tr('view.downloadN', n) : tr('view.download'));
  }

  submit() {
    const r = jobsFromPanel(this.form, SETTINGS);
    if (r.error) { new Notice(tr(r.error)); return; }
    this.plugin.downloader.addAll(r.jobs);
    this.form.text = '';
    const ta = this.contentEl.querySelector('.jxvd-urls');
    if (ta) ta.value = '';
    this.updateButton();
  }

  renderJobs() {
    const el = this.jobsEl;
    if (!el) return;
    el.empty();
    const dl = this.plugin.downloader;
    if (!dl.jobs.length) { el.createEl('div', { cls: 'setting-item-description', text: tr('view.empty') }); return; }
    for (const job of dl.jobs.slice().reverse()) {
      const row = el.createDiv({ cls: 'jxvd-job jxvd-job-' + job.state });
      const head = row.createDiv({ cls: 'jxvd-job-head' });
      head.createSpan({ cls: 'jxvd-job-name', text: jobLabel(job), attr: { title: job.url } });
      const btn = head.createSpan({ cls: 'jxvd-job-btn clickable-icon', attr: { 'aria-label': job.state === 'running' ? tr('job.cancel') : tr('job.remove') } });
      try { setIcon(btn, 'x'); } catch (e) { btn.setText('×'); }
      btn.addEventListener('click', () => dl.remove(job.id));
      const meta = row.createDiv({ cls: 'jxvd-job-meta' });
      let text = tr('job.' + job.state);
      if (job.state === 'running') {
        text = job.pct.toFixed(0) + ' %' + (job.detail ? ' · ' + job.detail : '');
        if (job.item && job.item.count > 1) text += ' · ' + tr('job.item', job.item.index, job.item.count);
      }
      if (job.state === 'failed' && job.error) text += ' — ' + job.error;
      if (job.state === 'done' && job.file) text += ' — ' + baseName(job.file);
      meta.setText(text);
      if (job.state === 'running') {
        const bar = row.createDiv({ cls: 'jxvd-bar' });
        bar.createDiv({ cls: 'jxvd-bar-fill' }).style.width = job.pct + '%';
      }
    }
    const done = dl.jobs.some((j) => j.state !== 'queued' && j.state !== 'running');
    if (done) {
      const clear = el.createEl('button', { text: tr('view.clear') });
      clear.addEventListener('click', () => dl.clearFinished());
    }
  }
}

/* ================================================================== */
/*  Réglages                                                          */
/* ================================================================== */

class VideoDownloaderSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    const enregistrer = () => this.plugin.saveSettings();
    const titre = (nom, desc) => {
      const s = new Setting(containerEl).setName(nom).setHeading();
      if (desc) s.setDesc(desc);
      return s;
    };
    const ligne = (nom, desc, parent) => {
      const s = new Setting(parent || containerEl).setName(nom);
      if (desc) s.setDesc(desc);
      return s;
    };
    const bascule = (cle, nom, desc, apres) => ligne(nom, desc).addToggle((c) => c
      .setValue(!!SETTINGS[cle])
      .onChange(async (v) => { SETTINGS[cle] = v; await enregistrer(); if (apres) apres(); }));
    const chemin = (cle, nom, desc) => ligne(nom, desc).addText((t) => {
      t.setValue(SETTINGS[cle] || '').onChange(async (v) => { SETTINGS[cle] = v.trim(); await enregistrer(); });
      t.inputEl.addClass('jxvd-wide');
      attachFolderSuggest(this.app, t.inputEl);
    });

    /* --- Outils : ce que l'utilisateur doit voir en premier --- */
    titre(tr('tools.title'), tr('tools.desc', tr('tools.inPlugin')));
    this.toolsEl = containerEl.createDiv();
    this.renderTools();

    /* --- Réglages par défaut --- */
    titre(tr('set.defaults'), tr('set.defaultsDesc'));
    ligne(tr('set.quality')).addDropdown((d) => d
      .addOptions({ '720': '720p', '1080': '1080p', '1440': '1440p' })
      .setValue(String(SETTINGS.quality))
      .onChange(async (v) => { SETTINGS.quality = v; await enregistrer(); }));
    ligne(tr('set.container'), tr('set.containerDesc')).addDropdown((d) => d
      .addOptions({ mkv: tr('container.mkv'), mp4: tr('container.mp4'), webm: tr('container.webm') })
      .setValue(SETTINGS.container)
      .onChange(async (v) => { SETTINGS.container = v; await enregistrer(); }));
    bascule('subtitles', tr('set.subtitles'), tr('set.subtitlesDesc'), () => this.display());
    if (SETTINGS.subtitles) {
      ligne(tr('set.subLangs'), tr('set.subLangsDesc')).addText((t) => t
        .setValue(SETTINGS.subLangs || '').onChange(async (v) => { SETTINGS.subLangs = v.trim(); await enregistrer(); }));
    }
    bascule('keepTitle', tr('set.keepTitle'), tr('set.keepTitleDesc'));

    /* --- Dossiers --- */
    titre(tr('set.folders'), tr('set.destinationsDesc'));
    for (let i = 0; i < 3; i++) {
      const d = SETTINGS.destinations[i] || (SETTINGS.destinations[i] = { name: '', path: '' });
      ligne(i === 0 ? tr('set.destDefault') : tr('set.destN', i + 1))
        .addText((t) => { t.setPlaceholder(tr('set.destName')).setValue(d.name || '').onChange(async (v) => { d.name = v; await enregistrer(); }); })
        .addText((t) => { t.setPlaceholder(tr('set.destPath')).setValue(d.path || '').onChange(async (v) => { d.path = v; await enregistrer(); }); t.inputEl.addClass('jxvd-wide'); attachFolderSuggest(this.app, t.inputEl); });
    }
    chemin('seriesBase', tr('set.seriesBase'), tr('set.seriesBaseDesc'));
    bascule('seriesTitle', tr('set.seriesTitle'), tr('set.seriesTitleDesc'));

    /* --- Interface --- */
    titre(tr('set.interface'));
    ligne(tr('set.language'), tr('set.languageDesc')).addDropdown((d) => d
      .addOptions({ auto: tr('set.langAuto'), fr: 'Français', en: 'English' })
      .setValue(SETTINGS.language)
      .onChange(async (v) => { SETTINGS.language = v; await enregistrer(); this.display(); }));
    bascule('menuOnAllLinks', tr('set.menuOnAllLinks'), tr('set.menuOnAllLinksDesc'));
    bascule('showRibbon', tr('set.showRibbon'), tr('set.showRibbonDesc'), () => this.plugin.updateRibbon());

    /* --- Avancé : en-tête repliable, replié par défaut --- */
    const avance = titre(tr('set.advanced'), tr('set.advancedDesc'));
    avance.settingEl.addClass('jxvd-collapsible');
    const chevron = avance.nameEl.createSpan({ cls: 'jxvd-chevron' });
    const corps = containerEl.createDiv({ cls: 'jxvd-advanced' });
    const plier = () => {
      try { setIcon(chevron, SETTINGS.showAdvanced ? 'chevron-down' : 'chevron-right'); } catch (e) { chevron.setText(SETTINGS.showAdvanced ? '▾' : '▸'); }
      corps.toggle(!!SETTINGS.showAdvanced);
    };
    avance.settingEl.addEventListener('click', async () => { SETTINGS.showAdvanced = !SETTINGS.showAdvanced; await enregistrer(); plier(); });
    plier();
    ligne(tr('set.ytdlp'), tr('set.pathOverride'), corps).addText((t) => { t.setValue(SETTINGS.ytdlpPath || '').onChange(async (v) => { SETTINGS.ytdlpPath = v.trim(); await enregistrer(); }); t.inputEl.addClass('jxvd-wide'); attachFolderSuggest(this.app, t.inputEl); });
    ligne(tr('set.ffmpeg'), tr('set.pathOverride'), corps).addText((t) => { t.setValue(SETTINGS.ffmpegPath || '').onChange(async (v) => { SETTINGS.ffmpegPath = v.trim(); await enregistrer(); }); t.inputEl.addClass('jxvd-wide'); attachFolderSuggest(this.app, t.inputEl); });
    ligne(tr('set.deno'), tr('set.pathOverride'), corps).addText((t) => { t.setValue(SETTINGS.denoPath || '').onChange(async (v) => { SETTINGS.denoPath = v.trim(); await enregistrer(); }); t.inputEl.addClass('jxvd-wide'); attachFolderSuggest(this.app, t.inputEl); });
    ligne(tr('set.cookies'), tr('set.cookiesDesc'), corps).addDropdown((d) => d
      .addOptions({ none: tr('cookies.none'), safari: 'Safari', chrome: 'Chrome', firefox: 'Firefox' })
      .setValue(SETTINGS.cookiesBrowser)
      .onChange(async (v) => { SETTINGS.cookiesBrowser = v; await enregistrer(); }));
  }

  /* Une ligne par outil : état, puis Installer / Mettre à jour / Réinstaller. */
  renderTools() {
    const el = this.toolsEl;
    if (!el) return;
    el.empty();
    const tm = this.plugin.tools;
    for (const name of Object.keys(TOOLS)) {
      const st = tm.status[name] || {};
      const row = new Setting(el).setName(tr('tools.' + name));
      const etat = tm.updateState(name);
      let desc = st.path ? (st.version ? tr('tools.found', st.version) : (st.error || tr('tools.found', '?'))) + ' — ' + st.path : tr('tools.missing');
      if (etat === 'current') desc += ' · ' + tr('tools.upToDate');
      if (etat === 'outdated') desc += ' · ' + tr('tools.newer', st.latest);
      row.setDesc(desc);
      row.descEl.addClass(st.path ? 'jxvd-tool-ok' : 'jxvd-tool-missing');
      const label = !st.path ? tr('tools.install') : (etat === 'outdated' ? tr('tools.update') : tr('tools.reinstall'));
      row.addButton((b) => {
        b.setButtonText(label).setDisabled(!!tm.busy[name]);
        if (!st.path || etat === 'outdated') b.setCta();
        b.onClick(() => this.installTool(name));
      });
    }
    new Setting(el).addButton((b) => b.setButtonText(tr('tools.recheck')).onClick(async () => {
      for (const n of Object.keys(TOOLS)) { try { await tm.latest(n); } catch (e) { /* hors ligne : on garde l'état connu */ } }
      await tm.checkAll();
      this.renderTools();
    }));
  }

  async installTool(name) {
    const tm = this.plugin.tools;
    const label = TOOLS[name].label;
    const notice = new Notice(tr('tools.downloading', label, '0 %'), 0);
    try {
      const st = await tm.install(name, (got, total) => {
        if (got < 0) notice.setMessage(tr('tools.verifying', label));
        else notice.setMessage(tr('tools.downloading', label, total ? Math.round(got * 100 / total) + ' %' : Math.round(got / 1048576) + ' Mo'));
      });
      notice.hide();
      new Notice(tr('tools.installed', label, st && st.version ? st.version : ''), 6000);
    } catch (e) {
      notice.hide();
      new Notice(tr('tools.installFailed', label, e.message), 10000);
    }
    this.renderTools();
  }
}

/* ================================================================== */
/*  Le plugin                                                         */
/* ================================================================== */

module.exports = class VideoDownloaderPlugin extends Plugin {
  async onload() {
    await this.loadSettings();
    const base = this.app.vault.adapter.getBasePath ? this.app.vault.adapter.getBasePath() : '';
    this.pluginDir = base + '/' + (this.manifest.dir || ('.obsidian/plugins/' + this.manifest.id));
    this.tools = new ToolManager(this);
    this.settingTab = new VideoDownloaderSettingTab(this.app, this);
    this.addSettingTab(this.settingTab);
    this.downloader = new Downloader(this);

    // état des outils au démarrage, sans bloquer ; s'il en manque, on le dit tout de suite
    this.app.workspace.onLayoutReady(async () => {
      await this.tools.checkAll();
      if (this.settingTab.toolsEl) this.settingTab.renderTools();
      const missing = this.tools.missing();
      if (missing.length) {
        const n = new Notice(tr('tools.missingNotice', missing.map((m) => TOOLS[m].label).join(', ')), 15000);
        n.noticeEl.addEventListener('click', () => this.openSettings());
      }
    });

    this.statusEl = this.addStatusBarItem();
    this.statusEl.addClass('jxvd-status');
    this.setStatus('');

    // Clic droit sur un lien externe (mode Lecture et Live Preview) : Obsidian fournit l'URL.
    this.registerEvent(this.app.workspace.on('url-menu', (menu, url) => this.addMenuItems(menu, url)));

    // Clic droit dans l'éditeur : lien nu ou markdown sous le curseur, sans passer par l'élément.
    this.registerEvent(this.app.workspace.on('editor-menu', (menu, editor) => {
      const cur = editor.getCursor();
      const url = urlAtCursor(editor.getLine(cur.line), cur.ch);
      if (url) this.addMenuItems(menu, url);
    }));

    this.registerView(VIEW_TYPE, (leaf) => new DownloadView(leaf, this));
    this.updateRibbon();
    this.addCommand({ id: 'open-panel', name: tr('cmd.openView'), callback: () => this.openView() });

    this.addCommand({ id: 'cancel-download', name: tr('cmd.cancel'), callback: () => this.downloader.cancel() });
    this.addCommand({ id: 'download-clipboard', name: tr('cmd.downloadClipboard'), callback: () => this.fromClipboard(false) });
    this.addCommand({ id: 'download-clipboard-options', name: tr('cmd.downloadClipboardOptions'), callback: () => this.fromClipboard(true) });
  }

  onunload() {
    if (this.downloader && this.downloader.current) this.downloader.cancel();
  }

  openSettings() {
    const setting = this.app.setting;
    if (!setting) return;
    setting.open();
    setting.openTabById(this.manifest.id);
  }

  updateRibbon() {
    if (SETTINGS.showRibbon && !this.ribbonEl) {
      this.ribbonEl = this.addRibbonIcon('download', tr('view.title'), () => this.openView());
    } else if (!SETTINGS.showRibbon && this.ribbonEl) {
      this.ribbonEl.remove();
      this.ribbonEl = null;
    }
  }

  async openView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      leaf = workspace.getRightLeaf(false);
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    workspace.revealLeaf(leaf);
  }

  /* Les deux entrées, une seule fois par menu même si url-menu et editor-menu se déclenchent tous deux. */
  addMenuItems(menu, url) {
    if (!isVideoUrl(url) || menu._jxvd) return;
    menu._jxvd = true;
    menu.addSeparator();
    menu.addItem((item) => item.setTitle(tr('menu.download')).setIcon('download')
      .onClick(() => this.downloader.add(defaultJob(url))));
    menu.addItem((item) => item.setTitle(tr('menu.downloadOptions')).setIcon('sliders-horizontal')
      .onClick(() => this.withOptions(url)));
  }

  withOptions(url) {
    new OptionsModal(this.app, defaultJob(url), (job) => this.downloader.add(job)).open();
  }

  async fromClipboard(options) {
    let text = '';
    try { text = await navigator.clipboard.readText(); } catch (e) { text = ''; }
    const m = String(text || '').match(URL_RE);
    const url = m ? cleanUrl(m[0]) : null;
    if (!url || !isVideoUrl(url)) { new Notice(tr('notice.noUrl')); return; }
    if (options) this.withOptions(url); else this.downloader.add(defaultJob(url));
  }

  setStatus(text) {
    if (!this.statusEl) return;
    this.statusEl.empty();
    if (!text) { this.statusEl.hide(); return; }
    this.statusEl.show();
    const icon = this.statusEl.createSpan({ cls: 'jxvd-status-icon' });
    try { setIcon(icon, 'download'); } catch (e) { icon.setText('⬇'); }
    this.statusEl.createSpan({ text: ' ' + text });
    this.statusEl.setAttr('aria-label', tr('cmd.cancel'));
    this.statusEl.onclick = () => this.downloader.cancel();
  }

  async loadSettings() {
    const data = await this.loadData();
    SETTINGS = Object.assign({}, DEFAULT_SETTINGS, data);
    // réglages des versions 0.1–0.2, remplacés par la détection automatique et le nettoyage intégré
    delete SETTINGS.ffmpegDir; delete SETTINGS.subsFixPath;
    // les dossiers sont un tableau de trois : on complète ce qui manque sans écraser le reste
    const dests = Array.isArray(data && data.destinations) ? data.destinations : DEFAULT_SETTINGS.destinations;
    SETTINGS.destinations = [0, 1, 2].map((i) => Object.assign({ name: '', path: '' }, dests[i] || {}));
    LANG = resolveLang(SETTINGS.language);
    this.settings = SETTINGS;
  }

  async saveSettings() {
    LANG = resolveLang(SETTINGS.language);
    await this.saveData(SETTINGS);
  }
};
