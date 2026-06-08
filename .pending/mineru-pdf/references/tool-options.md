# MinerU CLI Options Reference

## Basic usage

```bash
NO_PROXY="127.0.0.1" <mineru> -p <file> -o <dir>
```

## Flags

| Flag | Default | Description |
|------|---------|-------------|
| `-p, --path PATH` | (required) | Input file or directory. Supports pdf, image, docx, pptx, xlsx |
| `-o, --output DIR` | (required) | Output directory |
| `-m, --method` | `auto` | Parse method: `auto`, `txt`, `ocr` |
| `-b, --backend` | `hybrid-auto-engine` | Backend engine (see below) |
| `--api-url TEXT` | — | MinerU FastAPI base URL. If omitted, mineru starts a temporary local server internally and stops after conversion. Use with a running `mineru-api` for batch conversion — model loads once, reused across files. Combine with `--client-side-output-generation True`. |
| `-l, --lang` | `ch` | Language hint for OCR. Common: `ch`, `en`, `korean`, `japan` |
| `-s, --start` | 0 | Start page (0-indexed) |
| `-e, --end` | — | End page (0-indexed) |
| `-f, --formula` | True | Enable formula parsing |
| `-t, --table` | True | Enable table parsing |
| `--image-analysis` | True | Enable image/chart analysis (VLM/hybrid backends) |
| `--client-side-output-generation` | True | Generate markdown locally from server-returned JSON. Needs to be True when using `--api-url` because the server returns JSON, not files. |

## Backends

| Backend | Use case |
|---------|----------|
| `pipeline` | General purpose, works on CPU |
| `hybrid-auto-engine` | Best balance of speed/accuracy on Apple Silicon (default; uses mlx-engine) |
| `hybrid-http-client` | High accuracy via remote VLM inference server |
| `vlm-auto-engine` | High accuracy, local compute |
| `vlm-http-client` | High accuracy, remote compute (OpenAI-compatible) |

## Language codes

`ch` (Chinese), `en` (English), `korean`, `japan`, `chinese_cht` (Traditional), plus many regional/script codes.

## Output structure

```
<output>/
  <pdfname>/
    hybrid_auto/                    # or pipeline/, vlm_auto/ — matches --backend
      <pdfname>.md                  # Final markdown
      <pdfname>_content_list.json   # Structured content list
      <pdfname>_content_list_v2.json
      <pdfname>_middle.json         # Intermediate analysis data
      <pdfname>_model.json          # Layout model output
      <pdfname>_origin.pdf          # Copy of original
      <pdfname>_layout.pdf          # Layout-annotated PDF
      images/                       # Extracted images
```

## Environment

- `NO_PROXY="127.0.0.1"` — set to bypass proxy for local mineru-api server
- `~/src/mineru-env/.venv/bin/mineru` — expected binary location

## API Server (`mineru-api`)

Start a persistent FastAPI server that keeps the model loaded across conversions:

| Flag | Default | Description |
|------|---------|-------------|
| `--host` | `127.0.0.1` | Server host |
| `--port` | `8000` | Server port |
| `--reload` | — | Enable auto-reload (development mode) |
| `--allow-public-http-client` | — | Allow `*-http-client` backends when binding to `0.0.0.0` |
| `--enable-vlm-preload` | True | Preload the local VLM model during startup |

Usage:
```bash
# Start server on default port 8000 (background)
~/src/mineru-env/.venv/bin/mineru-api --port 8000 &

# Convert using the running server
mineru -p file.pdf -o /tmp/mineru --api-url http://127.0.0.1:8000 --client-side-output-generation True

# Stop when done
kill %1
```