'use strict';

const { Plugin, Modal, Notice, PluginSettingTab, Setting, setIcon } = require('obsidian');

/* ================================================================== */
/*  Réglages et traductions                                           */
/* ================================================================== */

const HOME = (typeof process !== 'undefined' && process.env && process.env.HOME) || '/Users/p.pocass';

const DEFAULT_SETTINGS = {
  language: 'fr',                 // fr | en | auto (suit Obsidian)
  ytdlpPath: '/opt/homebrew/bin/yt-dlp',
  ffmpegDir: '/opt/homebrew/bin', // dossier contenant ffmpeg et ffprobe
  subsFixPath: HOME + '/.local/bin/yt-subs-fix.py', // vide = pas de post-traitement
  cookiesBrowser: 'safari',       // safari | chrome | firefox | none
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
};

let SETTINGS = Object.assign({}, DEFAULT_SETTINGS);
let LANG = 'fr';

const STRINGS = {
  fr: {
    'menu.download': 'Télécharger la vidéo',
    'menu.downloadOptions': 'Télécharger la vidéo avec options…',
    'cmd.cancel': 'Annuler le téléchargement en cours',
    'cmd.downloadClipboard': 'Télécharger la vidéo dont le lien est dans le presse-papiers',
    'cmd.downloadClipboardOptions': 'Télécharger la vidéo du presse-papiers avec options…',
    'modal.title': 'Télécharger la vidéo',
    'modal.url': 'Lien',
    'modal.quality': 'Qualité',
    'modal.container': 'Format',
    'modal.subtitles': 'Sous-titres',
    'modal.subtitlesDesc': 'Récupère les sous-titres (%s), puis les nettoie et les intègre au fichier.',
    'modal.filename': 'Nom du fichier',
    'modal.filenameDesc': 'Vide : le titre de la vidéo. Sans extension.',
    'modal.destination': 'Dossier',
    'modal.otherFolder': 'Autre dossier…',
    'modal.otherFolderDesc': 'Chemin complet du dossier de destination.',
    'modal.ok': 'Télécharger',
    'modal.cancel': 'Annuler',
    'container.mkv': 'MKV (sous-titres intégrés)',
    'container.mp4': 'MP4 (sous-titres intégrés)',
    'container.webm': 'WebM (sous-titres en fichier .srt à côté)',
    'status.queued': 'En attente : %s',
    'status.starting': 'Préparation…',
    'status.downloading': '%s %s',
    'status.merging': 'Assemblage…',
    'status.subs': 'Sous-titres…',
    'status.done': 'Terminé',
    'notice.started': 'Téléchargement lancé : %s',
    'notice.queued': 'Ajouté à la file (%s en attente)',
    'notice.done': 'Vidéo téléchargée : %s',
    'notice.failed': 'Échec du téléchargement : %s',
    'notice.cancelled': 'Téléchargement annulé',
    'notice.noUrl': 'Aucun lien vidéo trouvé',
    'notice.noBinary': 'yt-dlp introuvable : %s (voir les réglages)',
    'notice.nothingRunning': 'Aucun téléchargement en cours',
    'set.general': 'Général',
    'set.language': 'Langue de l\'interface',
    'set.languageDesc': 'Menus, fenêtres et messages du plugin.',
    'set.langAuto': 'Suivre Obsidian',
    'set.menuOnAllLinks': 'Proposer le menu sur tous les liens',
    'set.menuOnAllLinksDesc': 'Activé : tout lien http(s) a l\'entrée « Télécharger » (yt-dlp gère plus de mille sites). Désactivé : YouTube, Vimeo, Dailymotion, Twitch et Twitter/X seulement.',
    'set.defaults': 'Réglages par défaut',
    'set.defaultsDesc': 'Utilisés par « Télécharger » et pré-remplis dans « Télécharger avec options… ».',
    'set.quality': 'Qualité maximale',
    'set.container': 'Format du fichier',
    'set.containerDesc': 'MKV et MP4 intègrent les sous-titres comme piste ; WebM les laisse en fichier .srt à côté.',
    'set.subtitles': 'Sous-titres',
    'set.subtitlesDesc': 'Récupérer les sous-titres puis les nettoyer et les intégrer.',
    'set.subLangs': 'Langues des sous-titres',
    'set.subLangsDesc': 'Codes séparés par des virgules, dans l\'ordre de préférence.',
    'set.keepTitle': 'Garder le titre de la vidéo comme nom de fichier',
    'set.keepTitleDesc': 'Désactivé : « Télécharger avec options… » attend un nom ; « Télécharger » garde le titre quand même.',
    'set.destinations': 'Dossiers de destination',
    'set.destinationsDesc': 'Jusqu\'à trois dossiers proposés dans la fenêtre d\'options. Le premier est celui utilisé par « Télécharger ».',
    'set.destName': 'Nom',
    'set.destPath': 'Chemin',
    'set.destN': 'Dossier %s',
    'set.destDefault': 'Dossier par défaut',
    'set.tools': 'Outils',
    'set.toolsDesc': 'Le plugin ne télécharge aucun programme : il lance ceux déjà installés sur ce Mac.',
    'set.ytdlp': 'Chemin de yt-dlp',
    'set.ffmpegDir': 'Dossier de ffmpeg',
    'set.ffmpegDirDesc': 'Dossier qui contient ffmpeg et ffprobe, nécessaires pour assembler la vidéo et intégrer les sous-titres.',
    'set.subsFix': 'Script de nettoyage des sous-titres',
    'set.subsFixDesc': 'Lancé sur le fichier une fois téléchargé (yt-subs-fix.py). Vide : aucun post-traitement.',
    'set.cookies': 'Cookies du navigateur',
    'set.cookiesDesc': 'Réutilise la session du navigateur pour les vidéos qui demandent d\'être connecté.',
    'cookies.none': 'Aucun',
  },
  en: {
    'menu.download': 'Download video',
    'menu.downloadOptions': 'Download video with options…',
    'cmd.cancel': 'Cancel the current download',
    'cmd.downloadClipboard': 'Download the video whose link is in the clipboard',
    'cmd.downloadClipboardOptions': 'Download the clipboard video with options…',
    'modal.title': 'Download video',
    'modal.url': 'Link',
    'modal.quality': 'Quality',
    'modal.container': 'Format',
    'modal.subtitles': 'Subtitles',
    'modal.subtitlesDesc': 'Fetch subtitles (%s), then clean them up and embed them in the file.',
    'modal.filename': 'File name',
    'modal.filenameDesc': 'Empty: the video title. Without extension.',
    'modal.destination': 'Folder',
    'modal.otherFolder': 'Other folder…',
    'modal.otherFolderDesc': 'Full path of the destination folder.',
    'modal.ok': 'Download',
    'modal.cancel': 'Cancel',
    'container.mkv': 'MKV (embedded subtitles)',
    'container.mp4': 'MP4 (embedded subtitles)',
    'container.webm': 'WebM (subtitles as a separate .srt file)',
    'status.queued': 'Queued: %s',
    'status.starting': 'Preparing…',
    'status.downloading': '%s %s',
    'status.merging': 'Merging…',
    'status.subs': 'Subtitles…',
    'status.done': 'Done',
    'notice.started': 'Download started: %s',
    'notice.queued': 'Added to the queue (%s waiting)',
    'notice.done': 'Video downloaded: %s',
    'notice.failed': 'Download failed: %s',
    'notice.cancelled': 'Download cancelled',
    'notice.noUrl': 'No video link found',
    'notice.noBinary': 'yt-dlp not found: %s (see settings)',
    'notice.nothingRunning': 'No download in progress',
    'set.general': 'General',
    'set.language': 'Interface language',
    'set.languageDesc': 'Menus, dialogs and messages of the plugin.',
    'set.langAuto': 'Follow Obsidian',
    'set.menuOnAllLinks': 'Offer the menu on every link',
    'set.menuOnAllLinksDesc': 'On: every http(s) link gets the "Download" entry (yt-dlp supports over a thousand sites). Off: YouTube, Vimeo, Dailymotion, Twitch and Twitter/X only.',
    'set.defaults': 'Defaults',
    'set.defaultsDesc': 'Used by "Download" and pre-filled in "Download with options…".',
    'set.quality': 'Maximum quality',
    'set.container': 'File format',
    'set.containerDesc': 'MKV and MP4 embed subtitles as a track; WebM leaves them as a separate .srt file.',
    'set.subtitles': 'Subtitles',
    'set.subtitlesDesc': 'Fetch subtitles, then clean them up and embed them.',
    'set.subLangs': 'Subtitle languages',
    'set.subLangsDesc': 'Comma-separated codes, in order of preference.',
    'set.keepTitle': 'Keep the video title as file name',
    'set.keepTitleDesc': 'Off: "Download with options…" expects a name; "Download" keeps the title anyway.',
    'set.destinations': 'Destination folders',
    'set.destinationsDesc': 'Up to three folders offered in the options dialog. The first one is used by "Download".',
    'set.destName': 'Name',
    'set.destPath': 'Path',
    'set.destN': 'Folder %s',
    'set.destDefault': 'Default folder',
    'set.tools': 'Tools',
    'set.toolsDesc': 'The plugin downloads no program: it runs the ones already installed on this Mac.',
    'set.ytdlp': 'yt-dlp path',
    'set.ffmpegDir': 'ffmpeg folder',
    'set.ffmpegDirDesc': 'Folder containing ffmpeg and ffprobe, needed to merge the video and embed subtitles.',
    'set.subsFix': 'Subtitle clean-up script',
    'set.subsFixDesc': 'Run on the file once downloaded (yt-subs-fix.py). Empty: no post-processing.',
    'set.cookies': 'Browser cookies',
    'set.cookiesDesc': 'Reuses the browser session for videos that require being signed in.',
    'cookies.none': 'None',
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
function buildArgs(job, s) {
  s = s || SETTINGS;
  const args = ['--newline', '--no-colors', '--embed-chapters', '--embed-metadata'];
  if (s.ffmpegDir) args.push('--ffmpeg-location', s.ffmpegDir);
  if (s.cookiesBrowser && s.cookiesBrowser !== 'none') args.push('--cookies-from-browser', s.cookiesBrowser);
  args.push('-f', formatFilter(job.quality, job.container));
  if (job.container === 'mkv') args.push('--merge-output-format', 'mkv');
  if (job.subtitles) {
    args.push('--write-subs', '--write-auto-subs', '--sub-langs', job.subLangs || s.subLangs || 'fr,en',
      '--sub-format', 'srt', '--convert-subs', 'srt');
    // --embed-subs est proscrit : c'est le script qui intègre les sous-titres, après nettoyage
    if (s.subsFixPath) args.push('--exec', 'after_move:' + shellQuote(s.subsFixPath) + ' {}');
  }
  const name = job.filename ? safeName(job.filename) : '%(title)s';
  args.push('-o', job.destination.replace(/\/+$/, '') + '/' + name + '.%(ext)s');
  args.push('--', job.url);
  return args;
}

/* Seule chaîne qui passe par un shell : le chemin du script dans --exec (yt-dlp l'exécute via sh). */
function shellQuote(p) {
  return "'" + String(p).replace(/'/g, "'\\''") + "'";
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
  if ((m = l.match(/^\[download\]\s+Destination:\s+(.+)$/))) return { phase: 'download', file: m[1] };
  if ((m = l.match(/^\[Merger\]\s+Merging formats into\s+"(.+)"$/))) return { phase: 'merge', file: m[1] };
  if (/^\[Exec\]/.test(l) || (/^\[(EmbedSubtitle|SubtitlesConvertor|FFmpegSubtitlesConvertor|info)\]/.test(l) && /subtitle/i.test(l))) return { phase: 'subs' };
  if ((m = l.match(/^ERROR:\s*(.+)$/))) return { phase: 'error', message: m[1] };
  return null;
}

/* ================================================================== */
/*  File d'attente et lancement                                       */
/* ================================================================== */

class Downloader {
  constructor(plugin) {
    this.plugin = plugin;
    this.queue = [];
    this.current = null;   // { job, child, file, pct }
  }

  add(job) {
    this.queue.push(job);
    if (this.current) {
      new Notice(tr('notice.queued', this.queue.length));
      this.plugin.setStatus(this.statusText());
    } else {
      this.next();
    }
  }

  next() {
    const job = this.queue.shift();
    if (!job) { this.current = null; this.plugin.setStatus(''); return; }
    this.run(job);
  }

  run(job) {
    let spawn;
    try { spawn = require('child_process').spawn; }
    catch (e) { new Notice(tr('notice.failed', 'child_process')); this.current = null; return; }

    const fs = require('fs');
    if (!fs.existsSync(SETTINGS.ytdlpPath)) {
      new Notice(tr('notice.noBinary', SETTINGS.ytdlpPath), 8000);
      this.current = null; this.plugin.setStatus(''); return;
    }
    try { fs.mkdirSync(job.destination, { recursive: true }); } catch (e) { /* yt-dlp le dira */ }

    const args = buildArgs(job, SETTINGS);
    const env = Object.assign({}, process.env);
    env.PATH = [SETTINGS.ffmpegDir, '/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', '/bin', env.PATH || ''].filter(Boolean).join(':');

    this.current = { job, child: null, file: '', pct: 0, error: '' };
    this.plugin.setStatus(tr('status.starting'));
    new Notice(tr('notice.started', job.url));

    let child;
    try { child = spawn(SETTINGS.ytdlpPath, args, { env, cwd: job.destination, windowsHide: true }); }
    catch (e) { new Notice(tr('notice.failed', e.message)); this.next(); return; }
    this.current.child = child;

    let buf = '';
    const onData = (chunk) => {
      buf += chunk.toString();
      const lines = buf.split(/\r?\n|\r/);
      buf = lines.pop();
      for (const line of lines) this.onLine(line);
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('error', (e) => { this.current.error = e.message; });
    child.on('close', (code) => {
      if (buf) this.onLine(buf);
      const cur = this.current;
      if (cur && cur.cancelled) new Notice(tr('notice.cancelled'));
      else if (code === 0) new Notice(tr('notice.done', baseName(cur.file || job.url)), 8000);
      else new Notice(tr('notice.failed', cur.error || ('code ' + code)), 10000);
      this.next();
    });
  }

  onLine(line) {
    const p = parseLine(line);
    if (!p || !this.current) return;
    if (p.file) this.current.file = p.file;
    if (p.phase === 'error') this.current.error = p.message;
    if (p.phase === 'download' && typeof p.pct === 'number') {
      this.current.pct = p.pct;
      this.plugin.setStatus(tr('status.downloading', p.pct.toFixed(0) + ' %', p.eta ? 'ETA ' + p.eta : p.speed) + this.suffix());
    } else if (p.phase === 'merge') {
      this.plugin.setStatus(tr('status.merging') + this.suffix());
    } else if (p.phase === 'subs') {
      this.plugin.setStatus(tr('status.subs') + this.suffix());
    }
  }

  suffix() { return this.queue.length ? ' (+' + this.queue.length + ')' : ''; }

  statusText() {
    if (!this.current) return '';
    return tr('status.downloading', this.current.pct.toFixed(0) + ' %', '') + this.suffix();
  }

  cancel() {
    if (!this.current || !this.current.child) { new Notice(tr('notice.nothingRunning')); return; }
    this.current.cancelled = true;
    try { this.current.child.kill('SIGTERM'); } catch (e) { /* déjà terminé */ }
  }
}

function baseName(p) {
  const s = String(p || '');
  return s.slice(s.lastIndexOf('/') + 1);
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
    };
    const ligne = (nom, desc) => {
      const s = new Setting(containerEl).setName(nom);
      if (desc) s.setDesc(desc);
      return s;
    };
    const bascule = (cle, nom, desc) => ligne(nom, desc).addToggle((c) => c
      .setValue(SETTINGS[cle] !== false)
      .onChange(async (v) => { SETTINGS[cle] = v; await enregistrer(); }));
    const texte = (cle, nom, desc, large) => ligne(nom, desc).addText((t) => {
      t.setValue(SETTINGS[cle] || '').onChange(async (v) => { SETTINGS[cle] = v.trim(); await enregistrer(); });
      if (large) t.inputEl.addClass('jxvd-wide');
    });

    titre(tr('set.general'));
    ligne(tr('set.language'), tr('set.languageDesc')).addDropdown((d) => d
      .addOptions({ fr: 'Français', en: 'English', auto: tr('set.langAuto') })
      .setValue(SETTINGS.language)
      .onChange(async (v) => { SETTINGS.language = v; await enregistrer(); this.display(); }));
    bascule('menuOnAllLinks', tr('set.menuOnAllLinks'), tr('set.menuOnAllLinksDesc'));

    titre(tr('set.defaults'), tr('set.defaultsDesc'));
    ligne(tr('set.quality')).addDropdown((d) => d
      .addOptions({ '720': '720p', '1080': '1080p', '1440': '1440p' })
      .setValue(String(SETTINGS.quality))
      .onChange(async (v) => { SETTINGS.quality = v; await enregistrer(); }));
    ligne(tr('set.container'), tr('set.containerDesc')).addDropdown((d) => d
      .addOptions({ mkv: tr('container.mkv'), mp4: tr('container.mp4'), webm: tr('container.webm') })
      .setValue(SETTINGS.container)
      .onChange(async (v) => { SETTINGS.container = v; await enregistrer(); }));
    bascule('subtitles', tr('set.subtitles'), tr('set.subtitlesDesc'));
    texte('subLangs', tr('set.subLangs'), tr('set.subLangsDesc'));
    bascule('keepTitle', tr('set.keepTitle'), tr('set.keepTitleDesc'));

    titre(tr('set.destinations'), tr('set.destinationsDesc'));
    for (let i = 0; i < 3; i++) {
      const d = SETTINGS.destinations[i] || (SETTINGS.destinations[i] = { name: '', path: '' });
      ligne(i === 0 ? tr('set.destDefault') : tr('set.destN', i + 1))
        .addText((t) => { t.setPlaceholder(tr('set.destName')).setValue(d.name || '').onChange(async (v) => { d.name = v; await enregistrer(); }); })
        .addText((t) => { t.setPlaceholder(tr('set.destPath')).setValue(d.path || '').onChange(async (v) => { d.path = v; await enregistrer(); }); t.inputEl.addClass('jxvd-wide'); });
    }

    titre(tr('set.tools'), tr('set.toolsDesc'));
    texte('ytdlpPath', tr('set.ytdlp'), '', true);
    texte('ffmpegDir', tr('set.ffmpegDir'), tr('set.ffmpegDirDesc'), true);
    texte('subsFixPath', tr('set.subsFix'), tr('set.subsFixDesc'), true);
    ligne(tr('set.cookies'), tr('set.cookiesDesc')).addDropdown((d) => d
      .addOptions({ safari: 'Safari', chrome: 'Chrome', firefox: 'Firefox', none: tr('cookies.none') })
      .setValue(SETTINGS.cookiesBrowser)
      .onChange(async (v) => { SETTINGS.cookiesBrowser = v; await enregistrer(); }));
  }
}

/* ================================================================== */
/*  Le plugin                                                         */
/* ================================================================== */

module.exports = class VideoDownloaderPlugin extends Plugin {
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new VideoDownloaderSettingTab(this.app, this));
    this.downloader = new Downloader(this);

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

    this.addCommand({ id: 'cancel-download', name: tr('cmd.cancel'), callback: () => this.downloader.cancel() });
    this.addCommand({ id: 'download-clipboard', name: tr('cmd.downloadClipboard'), callback: () => this.fromClipboard(false) });
    this.addCommand({ id: 'download-clipboard-options', name: tr('cmd.downloadClipboardOptions'), callback: () => this.fromClipboard(true) });
  }

  onunload() {
    if (this.downloader && this.downloader.current) this.downloader.cancel();
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
