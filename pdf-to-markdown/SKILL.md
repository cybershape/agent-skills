---
name: pdf-to-markdown
description: >
  Convert PDF documents (scanned reports, analytical papers, presentations)
  to clean, structured Markdown. Handles Chinese/English documents,
  watermarked backgrounds, complex table layouts, and mixed chart-content
  pages. Uses pdftoppm for rasterization then inspect_image for OCR.
---

## Workflow

### 0. Preprocess — PDF to images in temp directory

Create a temporary directory under `/tmp`, convert the PDF into PNG pages there, and reference that path throughout the workflow.

```bash
tmpdir=$(mktemp -d /tmp/pdf-conversation-XXXXXXXX)
pdftoppm -png -r 200 "/path/to/input.pdf" "$tmpdir/page"
```

This produces `page-01.png`, `page-02.png`, ... in `$tmpdir`.

**Parameters:**
- `-r 200` is the default DPI. Use `-r 300` for dense small-font documents, `-r 150` for simple layouts.
- Output prefix becomes the filename stem; pdftoppm appends `-N.png`.
- If the PDF source path has spaces, quote it at shell level.

**Pre-screen for long documents** — convert a sample range first:

```bash
pdftoppm -png -r 200 -f 1 -l 5 "/path/to/input.pdf" "$tmpdir/page"
rm "$tmpdir"/page-*.png  # discard after review
```

**IMPORTANT:** After the full conversion and OCR is complete, clean up:

```bash
rm -rf "$tmpdir"
```

The temp dir path (`$tmpdir`) replaces `/path/to/output/` in all subsequent steps.

### 1. Survey

Read the output directory to see all pages. Identify page count, naming pattern, and file sizes.

```
read "$tmpdir/"
```

### 2. Sample — understand structure and density

Inspect the first 2-3 pages + any obvious chapter/section divider pages to understand:

- Document type (report / presentation / whitepaper / scan of book)
- Layout patterns (full-text pages, chart-heavy pages, table-only pages)
- Repeating elements (headers, footers, watermarks, page numbers)
- Language (Chinese-specific OCR quirks: 0/O confusion, similar-looking chars like 未/末)

Call `inspect_image` with `question` like:

```
Extract ALL visible text verbatim. Include table data, chart data,
and any structured content. Return as bullet list in reading order.
```

### 3. Batch-OCR all remaining pages

Parallelize. Send 7 images per batch (model context allowance). For each page call `inspect_image` with the same extraction prompt.

Key pattern: submit multiple independent `inspect_image` calls in one turn. NEVER serialize page-by-page — fan out as wide as context permits.

### 4. Organize into structured Markdown

Combine all extracted text into a single document following these rules:

**Headers:** Use the document's own hierarchy. Each page's title/section header becomes `##` or `###`. Chapter divider pages list the table of contents.

**Tables:**
- Extract column headers and row data from OCR bullet lists
- Reconstruct as proper Markdown tables (`| col1 | col2 |`)
- If data is a chart (bar/line/pie), summarize: list the legend, axis labels, and data points in a table where possible; use descriptive text where table is impractical

**Remove noise (NEVER include in output):**
- Repeated watermarks / background text
- Page numbers / footers when repeated
- Caveats/uncertainty blocks from OCR tool output
- Reading-order markup noise ("Left Chart Y-Axis:", "[Chart Data Labels]:")

**Structuring decisions:**
- Merge related pages into sections based on document structure
- Chapter TOC pages → rendered as the document's own bulleted list at the top
- Charts → extract key data points, axis labels, and legends as simplified tables
- Pie charts → `| Label | Value |` table
- Bar charts → `| Category | Value1 | Value2 |` table with legend as column heads
- Line charts → table of x-values with corresponding y-values

**Handle repeated content:**
- When the same chart appears in multiple places (e.g. backup/summary pages), include only once and note the reference
- When data appears both as chart and table, prefer the table version

### 5. Cleaning rules

- Remove all watermarks from output text. NEVER repeat them.
- Merge split table rows across pages into single tables
- Reconstruct multi-column layouts in correct reading order (left-to-right, top-to-bottom)
- For Chinese docs: keep all text in original Chinese; do not translate
- For financial/numeric data: maintain exact precision; do NOT round or truncate
- Normalize percentage signs: `%` not `％`
- Normalize number formatting: `1000.0万元` not `1000.0 万元`
- Fix obvious OCR artifacts (date-like strings, trailing punctuation)

### 6. Verification

Before yielding, verify:
- Every distinct page's content is represented (no missing pages)
- All table data is present (count rows against known data points)
- Watermarks are absent from the final output
- Numeric accuracy: re-check a sample of numbers against original images
- Section structure matches the document's own TOC

### 7. Output

User may request "don't write file yet" — in that case, display the full markdown in the response as a code block. Otherwise write to specified path.

**Reminder:** Clean up the temp directory when done — run `rm -rf "$tmpdir"`.

## Anti-patterns

- NEVER perform OCR with `read` — use `inspect_image` for visual analysis
- NEVER OCR pages one-by-one; always batch parallel (7 per batch)
- NEVER include OCR tool's uncertainty/caveat commentary in final output
- NEVER fabricate table cells that were not observed; mark missing data clearly
- NEVER translate document language without explicit instruction
- NEVER "clean up" numeric values or change precision
- NEVER leave watermarks in the output
