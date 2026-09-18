# Video Downloader by Jexyllax

Right-click a video link in a note and download it, without leaving Obsidian.
The plugin runs the `yt-dlp` and `ffmpeg` already installed on the machine — it
downloads no program and loads nothing from the network itself.

**Private plugin for now**: paths and defaults are set for Pierre's Mac, but
everything is configurable in the settings.

## Use

- **Right-click a link** (reading mode, Live Preview or source mode) →
  *Download video* starts at once with the defaults, *Download video with
  options…* opens a small dialog, pre-filled with the defaults, where you only
  change what differs for this download: quality, format, subtitles, file name,
  destination folder (one of up to three folders from the settings, or any
  other path). Enter validates.
- **Command palette**: download the link in the clipboard (with or without
  options), cancel the current download.
- **Status bar**: progress of the current download, number of queued ones;
  click to cancel. A notice announces the start, the end (with the file name)
  or the failure.

Downloads run one at a time; extra requests wait in a queue.

## Settings

- Defaults: maximum quality (720p / 1080p / 1440p), container (MKV and MP4
  embed subtitles as a track, WebM keeps a separate `.srt`), subtitles and
  their languages, keep the video title as file name.
- Up to three destination folders; the first is the default.
- Tools: `yt-dlp` path, `ffmpeg` folder, subtitle clean-up script
  (`yt-subs-fix.py`, run once the file is written), browser cookies.
- Offer the menu on every http(s) link, or only on the main video sites.

## Development

No build step: `main.js` is plain JavaScript. Tests run outside Obsidian in
JavaScriptCore, with stubs for the Obsidian API:

```sh
sh tests/run.sh
```

They cover link detection under the cursor, the yt-dlp arguments (same options
as the `movie` shell function), the parsing of yt-dlp's output, and the
translation tables.

## Licence

MIT.
