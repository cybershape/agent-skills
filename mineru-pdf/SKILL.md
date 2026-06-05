---
name: mineru-pdf
description: Convert PDF (and images, DOCX, PPTX, XLSX) to Markdown using MinerU. Use when user mentions mineru, PDF-to-markdown, PDF转换, or asks to extract text from scanned documents/tables. After conversion, the model must manually review and fix conversion artifacts.
---

# mineru-pdf

Convert PDF documents to Markdown using MinerU's hybrid-auto engine (OCR + layout analysis + VLM). Handles scanned/image-based PDFs, complex tables, and multi-column layouts.

## Prerequisites

MinerU environment at `~/src/mineru-env/.venv/bin/mineru`. If absent, the skill cannot operate.

## Workflow

### Single file conversion

1. Run `scripts/convert.sh` — archives original, converts via mineru, copies markdown to current dir, cleans `/tmp/mineru`
2. **Model does post-processing** — read the generated markdown and manually fix conversion artifacts

### Sequential conversion (faster — reuse model across files)

When converting multiple PDFs, use the API server mode so the model loads only once.
Process each PDF completely — convert, post-process, verify — before moving to the next:

1. Start `mineru-api` server (see [Scripts](#scripts) section)
2. For each PDF:
   a. Run `scripts/convert.sh --api <url>` — reuses the loaded model, no cold start
   b. Read the generated `.md` and fix conversion artifacts (see [Post-processing](#post-processing))
   c. Verify the result against the original PDF if needed
   d. Only proceed to the next PDF when the current one is clean
3. Kill the server when done

The script does NOT do post-processing. Post-processing is the model's responsibility because the cleanup scenarios are diverse and context-dependent, not suitable for automated scripting.

## Scripts

### `scripts/convert.sh` — converts, archives, cleans. No post-processing.

```bash
# Single file (starts/stops temp server automatically)
cd <target-dir>
bash ~/.agents/skills/mineru-pdf/scripts/convert.sh '<path/to/file.pdf>'

# API server mode — reuses loaded model (for sequential multi-PDF processing)
cd <target-dir>
bash ~/.agents/skills/mineru-pdf/scripts/convert.sh --api http://127.0.0.1:8000 '<path/to/file.pdf>'
```

What the script does:
1. Creates `original/` in current directory
2. Copies original PDF → `original/`
3. Runs mineru (output → `/tmp/mineru/`)
4. Copies generated `.md` → current directory
5. Removes `/tmp/mineru/`

### Sequential conversion with API server

Start the server, then process each PDF one at a time — after each conversion, the model must post-process and verify before moving to the next:

```bash
# Start server (default port 8000, model loads at startup)
~/src/mineru-env/.venv/bin/mineru-api --port 8000 &
SERVER_PID=$!
sleep 8  # wait for model to load

for pdf in /path/to/pdfs/*.pdf; do
  bash ~/.agents/skills/mineru-pdf/scripts/convert.sh --api http://127.0.0.1:8000 "$pdf"
  # 模型在继续下一个 PDF 之前，必须 post-process 并验证当前文件
done

# Stop server when done
kill $SERVER_PID

# 检查是否有遗留子进程（PPID=1 的 multiprocessing fork 进程）
# ps aux | grep mineru | grep -v grep  # 如有，kill -KILL <pid> 逐个清理
```

> 不要在运行完整个循环后再统一做 post-processing。每个 PDF 转换完成后，模型必须先阅读并修复生成的 `.md`，确认无误后再执行下一个文件。上面的 `for` 循环仅示意 server 管理方式；实际运行时，模型应手动逐文件调用 `convert.sh`，并在每次调用后完成清理。

## Post-processing — model must do this

After the script runs, the model **must read the generated markdown** and fix the following common conversion artifacts. These require human-level judgment and cannot be reliably automated.

### 1. Page header/footer watermarks mixed into content

Scenarios:
- Company branding leaked into text (e.g. `## D大鹏教育` splitting a paragraph)
- Page number lines, document title repeated on every page
- Footer text ("人力资源中心", "2022年X月X日") appearing mid-document

**Fix**: Remove the watermark line and merge the surrounding paragraph fragments back into one coherent paragraph.

### 2. Paragraphs split across pages

A single paragraph may be broken into fragments by a page break. MinerU sometimes inserts a blank line or extra heading between them.

**Fix**: Join the fragments, re-form the single paragraph.

### 3. Tables misaligned or incomplete

- HTML tables (`<table>...`) may have merged cells (rowspan/colspan) — these are correct, keep them
- Table content may be duplicated or rows shifted
- Some columns may appear as plain text outside the table

**Fix**: Verify each table against the original PDF (read the PDF if needed). Fix row alignment, restore missing data.

### 4. Duplicate content

- The same paragraph appearing twice (once as raw text, once inside a table)
- Section headings duplicated (once from the TOC, once from the body)

**Fix**: Deduplicate, keeping only the body occurrence.

### 5. Heading level inconsistency

- `##` (H2) used for all headings regardless of nesting depth
- Sub-items (㈠ ㈡ ㈢) should be `###` if they logically nest under a parent `##`

**Fix**: Adjust heading levels to match the document's logical outline. Only change if the original PDF's structure clearly warrants it.

### 6. Excessive blank lines

- Multiple consecutive blank lines from page break artifacts

**Fix**: Collapse to at most one blank line between paragraphs, one blank line before headings.

### 7. List numbering artifacts

- Numbered lists rendered as plain text with extra whitespace
- Indentation/lists lost

**Fix**: Restore proper markdown list formatting.

### 8. 清理工作目录

全部转换完成后，清理 server 遗留的产物：

- **清理 mineru 遗留进程**：`mineru-api` 的 multiprocessing 子进程（resource_tracker、spawn）可能在 `kill $SERVER_PID` 后仍存活（PPID 变为 1）。用 `kill -KILL <pid>` 逐个杀掉或统一清理。
- **清理 `output/` 目录**：mineru-api 可能在工作目录下生成 `output/` 目录，删除之。
- **清理重复 PDF 原件**：`convert.sh` 已将原始 PDF 备份到 `original/`，当前目录的 `.pdf` 可逐个安全删除，仅保留 `.md` 文件。对比 `original/` 内的备份后逐个执行 `rm <file>.pdf`。

## Reference

- **`references/tool-options.md`** — mineru CLI flags and backends
- **`references/workflows.md`** — additional usage patterns and edge cases

## When to use

- User wants to convert a Chinese/English PDF to Markdown
- User mentions mineru or PDF extraction
- Document has tables, scanned pages, or complex layouts
- Batch processing multiple PDFs

## When NOT to use

- Simple text-only PDFs without tables/images — use `pdftotext` or similar
- User explicitly requests a different tool (e.g. marker, docling, mathpix)