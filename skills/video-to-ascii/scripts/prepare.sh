#!/usr/bin/env bash
# Resolve any source (YouTube/Vimeo URL, direct mp4 URL, or local file) to <workdir>/source.mp4
set -euo pipefail

SRC="${1:?usage: prepare.sh <url-or-file> <workdir>}"
WORK="${2:?usage: prepare.sh <url-or-file> <workdir>}"
mkdir -p "$WORK"
OUT="$WORK/source.mp4"

command -v ffmpeg >/dev/null || { echo "ERROR: ffmpeg not found. brew install ffmpeg" >&2; exit 1; }

if [ -f "$SRC" ]; then
    cp "$SRC" "$OUT"
elif [[ "$SRC" =~ \.(mp4|mov|webm|mkv)($|\?) ]]; then
    curl -sL -A "Mozilla/5.0" -o "$OUT" "$SRC" --max-time 300
else
    if ! command -v yt-dlp >/dev/null; then
        echo "ERROR: yt-dlp needed for this URL." >&2
        echo "  brew install yt-dlp     (pip install is blocked on PEP 668 systems)" >&2
        exit 1
    fi
    yt-dlp --no-warnings -f "bv[height<=1080]/b[height<=1080]/b" -o "$OUT" "$SRC"
fi

[ -s "$OUT" ] || { echo "ERROR: nothing downloaded" >&2; exit 1; }
ffprobe -v error -select_streams v:0 -show_entries stream=width,height \
    -show_entries format=duration -of default=nw=1 "$OUT"
echo "source: $OUT"
