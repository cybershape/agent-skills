#!/usr/bin/env bash
# convert.sh — Convert PDF to Markdown via MinerU, archive original, clean up temp files.
# Post-processing is NOT done here — the model does it manually.
# Usage:
#   bash /path/to/convert.sh '<path/to/file.pdf>'
#   bash /path/to/convert.sh --api http://127.0.0.1:8000 '<path/to/file.pdf>'
#
# With --api, connects to a running mineru-api server (faster for batch — model
# loads once server-side, reused across conversions).
# Run from the directory where you want the .md file and original/ subdirectory.
# Requires: ~/src/mineru-env/.venv/bin/mineru

set -euo pipefail

API_URL=""

# Parse options before positional arg
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
echo "=== Archive original ==="
mkdir -p "$WORKDIR/original"
cp "$PDF_PATH" "$WORKDIR/original/"

# ---- Step 2: Convert via mineru ----
echo "=== Convert via mineru ==="
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
  echo "  Using API server: $API_URL"
  ARGS+=(--api-url "$API_URL")
  ARGS+=(--client-side-output-generation True)
fi

NO_PROXY="127.0.0.1" "$MINERU" "${ARGS[@]}"

# ---- Step 3: Locate and copy markdown ----
echo "=== Copy markdown ==="
MD_FILE="$(find /tmp/mineru -name '*.md' -type f | head -1)"
if [ -z "$MD_FILE" ]; then
  echo "Error: No markdown file generated" >&2
  exit 1
fi
cp "$MD_FILE" "$WORKDIR/$PDF_NAME.md"

# ---- Step 4: Clean temp files ----
echo "=== Clean temp files ==="
rm -rf /tmp/mineru

echo "  Done: $WORKDIR/$PDF_NAME.md"
echo "  Original archived: $WORKDIR/original/"
wc -l "$WORKDIR/$PDF_NAME.md"