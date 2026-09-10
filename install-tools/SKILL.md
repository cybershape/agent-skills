---
name: install-tools
description: Installation guidance when `rg`, `fd`, `ast-grep`, `sg`, `clj-kondo`, `bb`, `bbin`, `clj-nrepl-eval` are missing.
allowed-tools: Bash, Read, Task
---

### ripgrep (`rg`)

If `rg` is not installed, install via `brew install ripgrep`

### `fd`

If `fd` is not installed, install via `brew install fd`

### `ast-grep` (`sg`)

If `ast-grep` or `sg` is missing, install via `brew install ast-grep`

### `clj-kondo`

If `clj-kondo` is missing, install via `brew install borkdude/brew/clj-kondo`

### babashka (`bb`) and `bbin`

If `bb` or `bbin` is missing, install via:

```bash
brew install borkdude/brew/babashka
brew install babashka/brew/bbin
```

### `clj-nrepl-eval`

If `clj-nrepl-eval` is missing, install via:

```bash
bbin install "https://github.com/bhauman/clojure-mcp-light.git" --as clj-nrepl-eval --main-opts '["-m" "clojure-mcp-light.nrepl-eval"]'
```