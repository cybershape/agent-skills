---
name: clojure-repl
description: Interact with running Clojure REPLs via nREPL. Evaluate Clojure code, query namespaces, test functions, and debug live Clojure systems. Use when working with .clj/.cljc/.cljs files and a REPL is available.
---

# Clojure REPL Integration

This skill enables interaction with running Clojure systems via nREPL using the `clj-nrepl-eval` CLI tool.

## When to Use This Skill

**Use this skill when you need to:**

- Evaluate Clojure code in a running system
- Test functions without restarting the REPL
- Query database connections from the running system
- Inspect loaded namespaces and their vars
- Debug live application state
- Verify code changes work before committing

## ⚠️ CRITICAL: Reload After File Changes

**After editing any Clojure file, you MUST reload it in the REPL for changes to take effect.**

The REPL keeps the old code in memory until you explicitly reload. This is the #1 source of confusion when testing changes.

### Reload Commands

```bash
# Reload a single namespace (most common)
clj-nrepl-eval -p <port> "(require '[banzai.some.namespace] :reload)"

# Reload namespace AND all its dependencies
clj-nrepl-eval -p <port> "(require '[banzai.some.namespace] :reload-all)"
```

### Standard Workflow

1. **Edit file** - Make your code changes
2. **Reload namespace** - `(require '[edited.namespace] :reload)`
3. **Test changes** - Call functions to verify behavior

### Example

```bash
# After editing components/content/src/banzai/content/interface.clj:
clj-nrepl-eval -p 64323 "(require '[banzai.content.interface] :reload)"

# Now test the updated function
clj-nrepl-eval -p 64323 "(banzai.content.interface/some-fn {:arg 1})"
```

### When to Use `:reload-all`

Use `:reload-all` when:

- You changed multiple related namespaces
- You modified a namespace that others depend on
- Changes don't seem to take effect with `:reload`

**Note:** `:reload-all` is slower but more thorough.

## Quick Reference

| Task           | Command                                                       |
| -------------- | ------------------------------------------------------------- |
| Discover REPLs | `clj-nrepl-eval --discover-ports`                             |
| Eval code      | `clj-nrepl-eval -p <port> "<code>"`                           |
| **Reload ns**  | `clj-nrepl-eval -p <port> "(require '[ns.name] :reload)"`     |
| Reload all     | `clj-nrepl-eval -p <port> "(require '[ns.name] :reload-all)"` |
| With timeout   | `clj-nrepl-eval -p <port> --timeout 5000 "<code>"`            |

## Workflow

### 1. Discover Available nREPL Servers

```bash
clj-nrepl-eval --discover-ports
```

Output example:

```
Discovered nREPL servers:

In current directory (/Users/jared/code/banzai-polylith):
  localhost:64323 (clj)

Total: 1 server
```

### 2. Evaluate Code

Basic evaluation:

```bash
clj-nrepl-eval -p 64323 "(+ 1 2 3)"
```

Multi-form evaluation:

```bash
clj-nrepl-eval -p 64323 "(require '[some.namespace :as ns]) (ns/some-fn)"
```

### 3. Common Operations

**Check loaded namespaces:**

```bash
clj-nrepl-eval -p <port> "(filter #(re-find #\"banzai\" %) (map str (all-ns)))"
```

**Require and explore a namespace:**

```bash
clj-nrepl-eval -p <port> "(require '[banzai.some.interface :as api]) (keys (ns-publics 'banzai.some.interface))"
```

**Access Integrant system components:**

```bash
clj-nrepl-eval -p <port> "(require '[integrant.repl.state :refer [system]]) (keys system)"
```

**Query database (with datasource from system):**

```bash
clj-nrepl-eval -p <port> "(def ds (:some.system/datasource integrant.repl.state/system))"
clj-nrepl-eval -p <port> "(with-open [conn (.getConnection ds)] ...)"
```

## Key Features

- **Persistent sessions**: Namespace changes and `def`s persist between calls
- **Auto-repair delimiters**: Fixes mismatched parens/brackets before evaluation
- **Auto-responsive guidance**: Returns helpful error messages for LLMs
- **Timeout support**: Prevent hanging on long-running evaluations

## Banzai-Specific Patterns

### Access Running System

Most Banzai bases use Integrant. Access system components via:

```bash
clj-nrepl-eval -p <port> "(require '[integrant.repl.state :refer [system]])"
clj-nrepl-eval -p <port> "(keys system)"
```

Common system keys:

- `:banzai.*.system/datasource` - Database connection pool
- `:banzai.*.system/jetty` - HTTP server
- `:banzai.*.system/router` - Reitit router
- `:banzai.*.system/handler` - Ring handler

### Test a Function

```bash
# Require the namespace
clj-nrepl-eval -p <port> "(require '[banzai.some.interface :as api])"

# Call the function
clj-nrepl-eval -p <port> "(api/some-function {:arg1 \"value\"})"
```

### Debug Data

```bash
# Pretty print with tap
clj-nrepl-eval -p <port> "(tap> some-data)"

# Or use clojure.pprint
clj-nrepl-eval -p <port> "(require '[clojure.pprint :as pp]) (with-out-str (pp/pprint some-data))"
```

## Troubleshooting

**clj-nrepl-eval not found:**

Run `bash ./install.sh` in this skills folder and act on output.

**No REPL found:**

- Ensure a Clojure REPL is running with nREPL server
- Check `.nrepl-port` file exists in project root
- Start REPL with: `clojure -A:dev:<base-alias>`

**Namespace not found:**

- The namespace may not be loaded yet
- Use `(require '[namespace.name])` first

**Timeout errors:**

- Increase timeout: `--timeout 10000` (10 seconds)
- Default is 2 minutes (120000ms)

**Session state issues:**

- Sessions persist; use `(in-ns 'user)` to reset namespace
- Or evaluate `(ns user)` to return to user namespace

## Best Practices

1. **Always discover ports first** - Don't assume port numbers
2. **Require namespaces explicitly** - Don't assume they're loaded
3. **Use timeouts for risky operations** - Prevent hanging
4. **Quote code properly** - Use single quotes in bash, escape inner quotes
5. **Check system state** - Verify Integrant system is running before accessing components
