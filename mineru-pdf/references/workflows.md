# MinerU PDF Conversion Workflows

## Standard single PDF conversion

```bash
cd <target-directory>
bash ~/.agents/skills/mineru-pdf/scripts/convert.sh '<path/to/document.pdf>'
```

The script archives original → converts → copies markdown → cleans temp files.

**After the script finishes, the model must read the generated .md and manually fix conversion artifacts.** See SKILL.md "Post-processing — model must do this" for the checklist.

## Batch conversion (API server mode)

For multiple PDFs, start the API server first so the model loads once and is reused across conversions. This avoids the per-file cold start overhead (~10-30s per conversion).

```bash
# 1. Start server (model loads at startup, takes a few seconds)
~/src/mineru-env/.venv/bin/mineru-api --port 8000 &
SERVER_PID=$!
sleep 8  # wait for model to fully load

# 2. Convert each PDF via --api flag
cd <target-directory>
for pdf in /path/to/pdfs/*.pdf; do
  bash ~/.agents/skills/mineru-pdf/scripts/convert.sh --api http://127.0.0.1:8000 "$pdf"
done

# 3. Stop server when done
kill $SERVER_PID
```

Then post-process each `.md` file individually.

## Conversion with custom backend

When hybrid-auto-engine produces poor results (complex scanned documents, heavy image-based PDFs), try `pipeline`:

```bash
PDF_PATH="/path/to/doc.pdf"
PDF_NAME="$(basename "$PDF_PATH" .pdf)"
rm -rf /tmp/mineru
NO_PROXY="127.0.0.1" ~/src/mineru-env/.venv/bin/mineru \
  -p "$PDF_PATH" -o /tmp/mineru \
  -b pipeline -l ch
MD_FILE="$(find /tmp/mineru -name '*.md' -type f | head -1)"
cp "$MD_FILE" "./$PDF_NAME.md"
rm -rf /tmp/mineru
```

## Known artifacts — model should check and fix

| Artifact | Pattern | Fix |
|----------|---------|-----|
| Page header/watermark | `## D大鹏教育` splitting a paragraph mid-text | Remove heading; merge surrounding paragraph fragments |
| Table as raw HTML | `<table>...</table>` with rowspan/colspan | Keep HTML — MinerU uses it because pipe tables cannot express merged cells |
| Paragraph split across pages | Two text blocks separated by a blank line or artifact heading | Join into one paragraph |
| Duplicate content | Same paragraph or heading appearing twice | Deduplicate, keep only the correct occurrence |
| Heading level wrong | All headings at `##` level regardless of nesting | Adjust `###`/`####` based on document outline |
| Consecutive blank lines | 3+ blank lines from page breaks | Collapse to max 1 |