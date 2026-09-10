# Editing Clojure Code

Use clj-kondo to find symbol locations, then the Edit tool to make changes.

## Replace Symbol Body

1. Find the symbol's exact location:

```bash
clj-kondo --lint path/to/file.clj \
  --config '{:output {:format :json}, :analysis {:var-definitions true}}' \
  | jq '(.analysis.var_definitions // [])[] | select(.name == "my-function") | {row, col, end_row, end_col}'
```

2. Use the Edit tool to replace content from `row` to `end_row`

### Example Workflow

```bash
# Get location
clj-kondo --lint src/my/ns.clj \
  --config '{:output {:format :json}, :analysis {:var-definitions true}}' \
  | jq '(.analysis.var_definitions // [])[] | select(.name == "process-data")'

# Output: {"row": 15, "col": 1, "end_row": 25, "end_col": 2, ...}
# Then use Edit tool to replace lines 15-25
```

## Insert Before/After Symbol

1. Get the symbol location (same as above)
2. For **insert before**: Use Edit tool to insert at `row`
3. For **insert after**: Use Edit tool to insert after `end_row`

### Add Docstring Example

```bash
# Find function location
clj-kondo --lint file.clj \
  --config '{:output {:format :json}, :analysis {:var-definitions true}}' \
  | jq '(.analysis.var_definitions // [])[] | select(.name == "my-fn") | .row'

# Insert docstring at that row using Edit tool
```

## Rename Symbol

For renaming a symbol across the codebase:

### Step 1: Find All Occurrences

```bash
clj-kondo --lint . \
  --config '{:output {:format :json}, :analysis {:var-definitions true, :var-usages true}}' \
  | jq '[(.analysis.var_definitions // [])[], (.analysis.var_usages // [])[]]
        | .[] | select(.name == "old-name")
        | {file: .filename, row, col, end_col}'
```

### Step 2: Review the List

Check:
- Is the definition found?
- Are all usages in expected files?
- Any matches in strings/comments to skip?

### Step 3: Apply Changes

**Option A: Edit tool (precise)**
Use the Edit tool for each location, starting from the last occurrence (to preserve line numbers).

**Option B: ripgrep + Edit (simple cases)**
```bash
# Find files
rg -l '\bold-name\b' --type clojure

# Preview matches with context
rg '\bold-name\b' --type clojure -C 2

# Then use Edit tool on each file
```

### Step 4: Handle Namespace-Qualified References

Don't forget qualified references:
```bash
rg 'my\.namespace/old-name' --type clojure
```

## Rename Checklist

- [ ] Definition renamed
- [ ] All usages in same namespace renamed
- [ ] Namespace-qualified usages renamed (`ns/old-name`)
- [ ] Aliased usages renamed (`alias/old-name`)
- [ ] Docstrings/comments updated (if needed)
- [ ] Tests pass

## Batch Editing

When you need to edit multiple symbols, collect all locations first:

```bash
# Get all public function locations in a namespace
clj-kondo --lint src/my/ns.clj \
  --config '{:output {:format :json}, :analysis {:var-definitions true}}' \
  | jq '[(.analysis.var_definitions // [])[] | select(.defined_by == "clojure.core/defn" and .private != true) | {name, row, end_row}]'
```

Then iterate through the results with the Edit tool.

## Safety Tips

1. **Use word boundaries** (`\b`) in regex to avoid partial matches
2. **Check strings/comments** - symbol name might appear there
3. **Verify namespace-qualified refs** - `ns/old-name` pattern
4. **Run tests after** - verify changes didn't break anything
5. **Start from last occurrence** - preserve line numbers when editing multiple locations
