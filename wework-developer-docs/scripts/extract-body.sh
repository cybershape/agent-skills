#!/usr/bin/env bash
# Extract main body from a WebFetch dump of
# https://developer.work.weixin.qq.com/document/path/<id>
#
# Usage:
#   extract-body.sh <webfetch-output.txt>
#   extract-body.sh <webfetch-output.txt> -o body.md
set -euo pipefail

usage() {
  echo "Usage: $0 <webfetch-output.txt> [-o output.md]" >&2
  exit 2
}

IN=""
OUT=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    -o)
      [[ $# -ge 2 ]] || usage
      OUT="$2"
      shift 2
      ;;
    -h|--help)
      usage
      ;;
    -*)
      echo "Unknown option: $1" >&2
      usage
      ;;
    *)
      [[ -z "$IN" ]] || usage
      IN="$1"
      shift
      ;;
  esac
done

[[ -n "$IN" ]] || usage
[[ -f "$IN" ]] || { echo "File not found: $IN" >&2; exit 1; }

if ! grep -q '^最后更新：' "$IN"; then
  echo "Marker not found: ^最后更新：" >&2
  exit 1
fi

if ! grep -q '^上一篇' "$IN"; then
  echo "Marker not found: ^上一篇" >&2
  exit 1
fi

extract() {
  # Title line + blank line + body from 最后更新 through line before 上一篇
  head -n1 "$IN"
  echo
  # Portable: sed range then drop last line (上一篇)
  sed -n '/^最后更新：/,/^上一篇/p' "$IN" | sed '$d'
}

if [[ -n "$OUT" ]]; then
  extract > "$OUT"
  echo "Wrote $OUT" >&2
else
  extract
fi
