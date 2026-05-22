#!/usr/bin/env bash
# Install clojure-mcp-light CLI tools for REPL integration with AI assistants

set -e

# Check prerequisites
if ! command -v bb &> /dev/null; then
  echo "Error: Babashka (bb) is required. Install via: brew install borkdude/brew/babashka"
  exit 1
fi

if ! command -v bbin &> /dev/null; then
  echo "Error: bbin is required. Install via: brew install babashka/brew/bbin"
  exit 1
fi

REPO="https://github.com/bhauman/clojure-mcp-light.git"

# Install clj-nrepl-eval (REPL evaluation)
if command -v clj-nrepl-eval &> /dev/null; then
  echo "clj-nrepl-eval already installed"
else
  echo "Installing clj-nrepl-eval..."
  bbin install "$REPO" --as clj-nrepl-eval --main-opts '["-m" "clojure-mcp-light.nrepl-eval"]'
fi

# Install clj-paren-repair-claude-hook (auto-invoked by Claude hook on file writes)
# if command -v clj-paren-repair-claude-hook &> /dev/null; then
#   echo "clj-paren-repair-claude-hook already installed"
# else
#   echo "Installing clj-paren-repair-claude-hook..."
#   bbin install "$REPO" --as clj-paren-repair-claude-hook
# fi

# Install clj-paren-repair (manual paren repair)
if command -v clj-paren-repair &> /dev/null; then
  echo "clj-paren-repair already installed"
else
  echo "Installing clj-paren-repair..."
  bbin install "$REPO" --as clj-paren-repair --main-opts '["-m" "clojure-mcp-light.paren-repair"]'
fi

echo "Done! All clojure-mcp-light tools installed."
