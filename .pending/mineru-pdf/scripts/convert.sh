#!/usr/bin/env bash
# convert.sh — Convert PDF to Markdown via MinerU, archive original, copy images, clean up temp files.
# Post-processing is NOT done here — the model does it manually (see SKILL.md).
#
# Usage:
#   bash /path/to/convert.sh '<path/to/file.pdf>'
#   bash /path/to/convert.sh --api http://127.0.0.1:8000 '<path/to/file.pdf>'
#
# With --api, connects to a running mineru-api server (faster for batch — model
# loads once server-side, reused across conversions).
#
# Run from the directory where you want the .md, images/, and original/ subdirectory.
# Requires: ~/src/mineru-env/.venv/bin/mineru
#
# NOTE on timeout: a 50-page PDF takes ~20 min on Apple Silicon. The script does NOT
# set a timeout — the caller (bash tool) must set a generous timeout (e.g. 3600s)
# or use --api mode with a persistent server for reliability.

set -euo pipefail

API_URL=""
START_SEC=$SECONDS

# Parse options before positional arg

# Helper: timestamp for progress output
ts() { date +%H:%M:%S; }
while [ $# -gt 0 ]; do
  case "$1" in
    --api)
      if [ $# -lt 2 ]; then
        echo "Error: --api requires a URL argument" >&2
        exit 1
      fi
      API_URL="$2"
      shift 2
      ;;
    -*)
      echo "Error: Unknown option: $1" >&2
      exit 1
      ;;
    *)
      break
      ;;
  esac
done

if [ $# -lt 1 ]; then
  echo "Usage: $0 [--api <url>] <path/to/file.pdf>"
  exit 1
fi

PDF_PATH="$1"
PDF_NAME="$(basename "$PDF_PATH" .pdf)"
WORKDIR="$(pwd)"
MINERU="$HOME/src/mineru-env/.venv/bin/mineru"

# ---- Preflight ----
if [ ! -f "$PDF_PATH" ]; then
  echo "Error: PDF not found: $PDF_PATH" >&2
  exit 1
fi
if [ ! -x "$MINERU" ]; then
  echo "Error: mineru not found at $MINERU" >&2
  echo "Install or update the venv at ~/src/mineru-env" >&2
  exit 1
fi

# ---- Step 1: Archive original ----
echo "=== [$(ts)] Archive original ==="
mkdir -p "$WORKDIR/original"
cp "$PDF_PATH" "$WORKDIR/original/"

# ---- Step 2: Convert via mineru ----
echo "=== [$(ts)] Convert via mineru ==="
rm -rf /tmp/mineru

ARGS=(
  -p "$PDF_PATH"
  -o /tmp/mineru
  -b hybrid-auto-engine
  -l ch
  -t True
  -f True
)

if [ -n "$API_URL" ]; then
  echo "  [$(ts)] Using API server: $API_URL"
  ARGS+=(--api-url "$API_URL")
  ARGS+=(--client-side-output-generation True)
fi

NO_PROXY="127.0.0.1" "$MINERU" "${ARGS[@]}"
echo "  [$(ts)] MinerU conversion completed"

# ---- Step 3: Locate and copy markdown ----
echo "=== [$(ts)] Copy markdown ==="
MD_FILE="$(find /tmp/mineru -name '*.md' -type f | head -1)"
if [ -z "$MD_FILE" ]; then
  echo "Error: No markdown file generated" >&2
  exit 1
fi
cp "$MD_FILE" "$WORKDIR/$PDF_NAME.md"
echo "  [$(ts)] Markdown copied: $WORKDIR/$PDF_NAME.md"

# ---- Step 4: Locate and copy images ----
echo "=== [$(ts)] Copy images ==="
IMG_DIR="$(find /tmp/mineru -type d -name images | head -1)"
if [ -n "$IMG_DIR" ]; then
  rm -rf "$WORKDIR/images"
  cp -r "$IMG_DIR" "$WORKDIR/images"
  IMG_COUNT="$(ls -1 "$WORKDIR/images" 2>/dev/null | wc -l)"
  echo "  [$(ts)] $IMG_COUNT images copied to $WORKDIR/images/"
else
  echo "  [$(ts)] No images directory found"
fi

# ---- Step 5: Clean temp files ----
echo "=== [$(ts)] Clean temp files ==="
rm -rf /tmp/mineru

# ---- Summary ----
ELAPSED=$((SECONDS - START_SEC))
echo "=== [$(ts)] Done in ${ELAPSED}s ==="
echo "  Markdown: $WORKDIR/$PDF_NAME.md"
echo "  Images:   $WORKDIR/images/"
echo "  Original: $WORKDIR/original/"
wc -l "$WORKDIR/$PDF_NAME.md"