---
name: clojure-symbols
description: Find and edit Clojure symbols using clj-kondo and REPL introspection. Use when finding Clojure function definitions, var usages, namespace contents, renaming Clojure symbols, replacing function bodies, or working with .clj/.cljc/.cljs files.
allowed-tools: Bash, Read, Edit, Task
---

# Clojure Symbols Skill

Use **clj-kondo** for static analysis and **clj-nrepl-eval** for REPL introspection to find Clojure symbols.

For non-Clojure languages, use the `code-symbols` skill instead.

## Prerequisites

### clj-nrepl-eval

Discover running nREPL servers:

```bash
clj-nrepl-eval --discover-ports
```

## Quick Reference

| Task                 | Tool      | Command                                      |
| -------------------- | --------- | -------------------------------------------- |
| List symbols in file | clj-kondo | `clj-kondo --lint file.clj --config '{...}'` |
| Find definition      | clj-kondo | Filter `var-definitions` by name             |
| Find usages          | clj-kondo | Filter `var-usages` by name                  |
| Get var metadata     | REPL      | `(meta #'ns/var)`                            |
| Get source           | REPL      | `(clojure.repl/source fn)`                   |

## Core clj-kondo Commands

**Note:** JSON keys use hyphens (e.g., `var-definitions`), so use bracket notation in jq.

### Find Symbol Definition

```bash
clj-kondo --lint src components bases \
  --config '{:output {:format :json}, :analysis {:var-definitions true}}' \
  | jq '.analysis["var-definitions"][] | select(.name == "my-function")'
```

### Find Symbol Usages

```bash
clj-kondo --lint src components bases \
  --config '{:output {:format :json}, :analysis {:var-usages true}}' \
  | jq '.analysis["var-usages"][] | select(.name == "my-function")'
```

### List Symbols in File

```bash
clj-kondo --lint path/to/file.clj \
  --config '{:output {:format :json}, :analysis {:var-definitions true}}' \
  | jq '.analysis["var-definitions"]'
```

### Output Fields

**var-definitions:**

- `filename`, `row`, `col`, `end-row`, `end-col` - Location
- `ns`, `name` - Identity
- `defined-by` - Defining form (e.g., `clojure.core/defn`)
- `fixed-arities`, `doc`, `private`

**var-usages:**

- `from`, `to` - Source and target namespaces
- `name`, `arity` - Symbol name and call arity
- `from-var` - Containing function
- `row`, `col` - Location

## Core REPL Commands

```bash
# Get var metadata
clj-nrepl-eval -p PORT "(meta #'my.namespace/my-function)"

# Get source code
clj-nrepl-eval -p PORT "(clojure.repl/source my-function)"

# List namespace contents
clj-nrepl-eval -p PORT "(dir my.namespace)"

# Search by pattern
clj-nrepl-eval -p PORT "(clojure.repl/apropos \"pattern\")"
```

## Common Workflow

### Find Definition and All Usages

```bash
# Find definition
clj-kondo --lint . \
  --config '{:output {:format :json}, :analysis {:var-definitions true}}' \
  | jq '.analysis["var-definitions"][] | select(.name == "target-fn") | {ns, name, filename, row}'

# Find all usages
clj-kondo --lint . \
  --config '{:output {:format :json}, :analysis {:var-usages true}}' \
  | jq '.analysis["var-usages"][] | select(.name == "target-fn") | {from, "from-var", filename, row}'
```

### Find Usages of a Namespace

```bash
clj-kondo --lint bases components \
  --config '{:output {:format :json}, :analysis {:var-usages true}}' \
  | jq '.analysis["var-usages"][] | select(.to == "my.namespace") | {from, name, filename, row}'
```

## Additional References

- **clj-kondo details**: See [references/kondo.md](references/kondo.md) for full analysis options
- **REPL introspection**: See [references/repl.md](references/repl.md) for REPL commands
- **Editing/renaming**: See [references/editing.md](references/editing.md) for rename workflows

## Troubleshooting

- `clj-kondo not found` : install using `brew install borkdude/brew/clj-kondo`
