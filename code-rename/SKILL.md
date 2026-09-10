---
name: code-rename
description: Rename symbols across a codebase safely. Use when renaming functions, variables, classes, or other symbols and need to update all references.
allowed-tools: Bash, Read, Edit, Task
---

# Code Rename Skill

Safely rename symbols across a codebase. This skill covers the full workflow from finding occurrences to applying changes.

## Workflow Overview

1. **Find all occurrences** (definition + usages)
2. **Review matches** (verify no false positives)
3. **Apply changes** (Edit tool or bulk rename)
4. **Verify** (run tests, lint)

---

## Clojure Rename

Use clj-kondo to find all occurrences, then Edit tool to apply changes.

### Step 1: Find All Occurrences

```bash
# Find definition and all usages
clj-kondo --lint . \
  --config '{:output {:format :json}, :analysis {:var-definitions true, :var-usages true}}' \
  | jq '[.analysis.var_definitions[], .analysis.var_usages[]]
        | .[] | select(.name == "old-name")
        | {file: .filename, row, col, end_col, type: (if .defined_by then "def" else "usage" end)}'
```

### Step 2: Review Matches

Check the output for:
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

### Clojure Rename Checklist

- [ ] Definition renamed
- [ ] All usages in same namespace renamed
- [ ] Namespace-qualified usages renamed (`ns/old-name`)
- [ ] Aliased usages renamed (`alias/old-name`)
- [ ] Docstrings/comments updated (if needed)
- [ ] Tests pass

---

## JavaScript/TypeScript Rename

Use ast-grep for structural renaming.

### Simple Rename (All Occurrences)

```bash
# Preview changes
ast-grep run --pattern 'oldName' --rewrite 'newName' --lang js src/

# Apply changes
ast-grep run --pattern 'oldName' --rewrite 'newName' --lang js src/ --update-all

# Interactive review
ast-grep run --pattern 'oldName' --rewrite 'newName' --lang js src/ --interactive
```

### Rename Function Definition + Calls

```bash
# Rename function definition
ast-grep run \
  --pattern 'function oldName($$$ARGS) { $$$BODY }' \
  --rewrite 'function newName($$$ARGS) { $$$BODY }' \
  --lang js src/ --update-all

# Rename function calls
ast-grep run \
  --pattern 'oldName($$$)' \
  --rewrite 'newName($$$)' \
  --lang js src/ --update-all
```

### Rename Class

```bash
# Rename class definition
ast-grep run \
  --pattern 'class OldClass { $$$BODY }' \
  --rewrite 'class NewClass { $$$BODY }' \
  --lang js src/ --update-all

# Rename instantiations
ast-grep run \
  --pattern 'new OldClass($$$)' \
  --rewrite 'new NewClass($$$)' \
  --lang js src/ --update-all
```

### Rename with YAML Rule

```yaml
# rename.yaml
id: rename-symbol
language: JavaScript
rule:
  pattern: oldSymbol
fix: newSymbol
```

```bash
ast-grep scan --rule rename.yaml src/ --update-all
```

---

## Python Rename

```bash
# Rename function
ast-grep run --pattern 'old_function' --rewrite 'new_function' --lang py src/ --update-all

# Rename class
ast-grep run --pattern 'OldClass' --rewrite 'NewClass' --lang py src/ --update-all

# Rename with structure preservation
ast-grep run \
  --pattern 'def old_func($$$ARGS):' \
  --rewrite 'def new_func($$$ARGS):' \
  --lang py src/ --update-all
```

---

## Go Rename

```bash
# Rename function
ast-grep run \
  --pattern 'func OldName($$$)' \
  --rewrite 'func NewName($$$)' \
  --lang go . --update-all

# Rename type
ast-grep run \
  --pattern 'type OldType struct { $$$FIELDS }' \
  --rewrite 'type NewType struct { $$$FIELDS }' \
  --lang go . --update-all
```

---

## Rust Rename

```bash
# Rename function
ast-grep run \
  --pattern 'fn old_name($$$)' \
  --rewrite 'fn new_name($$$)' \
  --lang rust src/ --update-all

# Rename struct
ast-grep run \
  --pattern 'struct OldName { $$$FIELDS }' \
  --rewrite 'struct NewName { $$$FIELDS }' \
  --lang rust src/ --update-all
```

---

## Fallback: ripgrep + Edit

When ast-grep doesn't work (unsupported language, complex case):

```bash
# Step 1: Find all occurrences
rg -n '\bold_name\b' src/

# Step 2: List files
rg -l '\bold_name\b' src/

# Step 3: Preview with context
rg '\bold_name\b' -C 3 src/

# Step 4: Use Edit tool on each file
# Start from last file to preserve line numbers
```

---

## Safety Checklist

### Before Renaming

- [ ] Commit or stash current changes
- [ ] Understand the scope (local vs exported)
- [ ] Check for string literals containing the name
- [ ] Check for dynamic references (reflection, eval)

### During Renaming

- [ ] Use `--interactive` or preview first
- [ ] Check for partial matches (e.g., `user` vs `username`)
- [ ] Use word boundaries (`\b`) in regex searches

### After Renaming

- [ ] Run linter (`clj-kondo`, `eslint`, etc.)
- [ ] Run tests
- [ ] Search for remaining occurrences
- [ ] Review diff before committing

---

## Common Pitfalls

### 1. Partial Matches

**Problem:** Renaming `user` also changes `username`

**Solution:** Use word boundaries
```bash
rg '\buser\b'  # Won't match "username"
ast-grep run --pattern 'user' --rewrite 'account'  # ast-grep is syntax-aware
```

### 2. String Literals

**Problem:** Renaming changes strings that shouldn't change

**Solution:** Review matches, use `--interactive`
```bash
ast-grep run --pattern 'oldName' --rewrite 'newName' --lang js --interactive
```

### 3. Different Contexts

**Problem:** Same name in different contexts

**Solution:** Use structural patterns
```bash
# Only rename in function calls, not variable declarations
ast-grep run --pattern 'oldFunc($$$)' --rewrite 'newFunc($$$)' --lang js
```

### 4. Namespace-Qualified Names

**Problem:** Missing qualified references

**Solution:** Search for all variations
```bash
# Clojure
rg 'old-name|ns/old-name|alias/old-name' --type clojure

# JavaScript
rg 'oldName|module\.oldName|obj\.oldName' --type js
```

---

## When to Use Each Approach

| Scenario | Approach |
|----------|----------|
| Clojure symbol rename | clj-kondo + Edit |
| JS/TS bulk rename | ast-grep `--update-all` |
| Rename with review | ast-grep `--interactive` |
| Unsupported language | rg + Edit |
| Complex/mixed rename | Manual with Edit tool |
| Need semantic accuracy | Consider LSP/IDE |
