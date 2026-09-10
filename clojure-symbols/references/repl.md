# REPL Introspection Reference

Use `clj-nrepl-eval` for runtime introspection when a REPL is available.

## Discover nREPL Port

```bash
clj-nrepl-eval --discover-ports
```

## Namespace Introspection

### List Namespace Contents

```bash
# List all public vars
clj-nrepl-eval -p PORT "(ns-publics 'my.namespace)"

# List all vars (including private)
clj-nrepl-eval -p PORT "(ns-interns 'my.namespace)"

# Pretty-print namespace contents
clj-nrepl-eval -p PORT "(dir my.namespace)"
```

### List Loaded Namespaces

```bash
clj-nrepl-eval -p PORT "(all-ns)"
```

## Var Metadata

### Get Full Metadata

```bash
clj-nrepl-eval -p PORT "(meta #'my.namespace/my-function)"
```

Returns:
- `:file` - Source file
- `:line`, `:column` - Position
- `:arglists` - Function signatures
- `:doc` - Docstring
- `:name`, `:ns` - Identity

## Source Code

### Get Source

```bash
clj-nrepl-eval -p PORT "(clojure.repl/source my-function)"
```

### Get Documentation

```bash
clj-nrepl-eval -p PORT "(clojure.repl/doc my-function)"
```

## Search for Symbols

### Search by Pattern

```bash
# Find vars matching pattern in all namespaces
clj-nrepl-eval -p PORT "(clojure.repl/apropos \"pattern\")"

# Find with regex
clj-nrepl-eval -p PORT "(clojure.repl/apropos #\"^create\")"
```

## Common Workflows

### Explore a New Namespace

```bash
# Step 1: Get overview via clj-kondo (static)
clj-kondo --lint path/to/file.clj \
  --config '{:output {:format :json}, :analysis {:var-definitions true}}' \
  | jq '[(.analysis.var_definitions // [])[] | {name, row, fixed_arities, doc}]'

# Step 2: Get detailed metadata via REPL
clj-nrepl-eval -p PORT "(meta #'ns/interesting-function)"

# Step 3: Read source if needed
clj-nrepl-eval -p PORT "(clojure.repl/source interesting-function)"
```

### Understand Namespace Dependencies

```bash
# What does this namespace require? (via clj-kondo)
clj-kondo --lint path/to/file.clj \
  --config '{:output {:format :json}, :analysis {:namespace-usages true}}' \
  | jq '.analysis.namespace_usages[] | {to, alias}'

# What requires this namespace?
clj-kondo --lint . \
  --config '{:output {:format :json}, :analysis {:namespace-usages true}}' \
  | jq '.analysis.namespace_usages[] | select(.to == "my.namespace") | {from, alias}'
```

## When to Use REPL vs clj-kondo

| Task | clj-kondo | REPL |
|------|-----------|------|
| Find definition location | ✓ | |
| Find all usages | ✓ | |
| Get runtime metadata | | ✓ |
| View source code | | ✓ |
| Search by pattern | | ✓ |
| Works without running REPL | ✓ | |
| Sees dynamically loaded code | | ✓ |
