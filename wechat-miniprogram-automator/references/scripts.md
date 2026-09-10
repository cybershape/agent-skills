# Script Reference

This skill ships reusable JavaScript CLI scripts under `scripts/`.

Prefer these scripts over ad hoc inline Node snippets. They provide a stable interface for common `miniprogram-automator` tasks and keep automation usage consistent across projects.

## Path rule

When invoking a script from an agent harness, resolve `scripts/...` against the skill directory.

Typical pattern:

```bash
node <skill-dir>/scripts/run-flow.js --project-path "$PWD" --flow-file ./tmp/flow.json
```

If the current working directory is already the Mini Program project root, `--project-path "$PWD"` is usually the safest default.

## Shared session flags

All scripts support the same session flags:

- `--mode auto|connect|launch`
- `--ws-endpoint URL`
- `--project-path PATH`
- `--cli-path PATH`
- `--port NUMBER`
- `--timeout MS`
- `--account OPENID`
- `--ticket TOKEN`
- `--project-config-json JSON`
- `--project-config-file FILE`
- `--cleanup auto|close|disconnect|none`

Recommended defaults:

- use `--mode auto` unless the strategy is already known
- pass `--project-path "$PWD"` when operating on the current project
- for one-off sessions started by the script itself, `--cleanup auto` is usually correct
- for reconnecting to an existing live DevTools session, `--cleanup disconnect` is often safer

## Scripts overview

### `scripts/session.js`

Purpose:

- open a session with `connect`, `launch`, or `auto`
- run a cheap smoke test
- report current route and system info

Example:

```bash
node <skill-dir>/scripts/session.js \
  --mode auto \
  --project-path "$PWD" \
  --port 9420
```

## `scripts/navigate.js`

Purpose:

- run route helpers such as `reLaunch`, `navigateTo`, or `switchTab`
- optionally use `evaluate` strategy for flaky routing
- optionally verify the final route with polling

Examples:

```bash
node <skill-dir>/scripts/navigate.js \
  --mode auto \
  --project-path "$PWD" \
  --method reLaunch \
  --url /pages/home/index \
  --verify-route pages/home/index \
  --wait-ms 500
```

```bash
node <skill-dir>/scripts/navigate.js \
  --mode auto \
  --project-path "$PWD" \
  --method navigateTo \
  --strategy evaluate \
  --url /pages/detail/index?id=1 \
  --verify-route pages/detail/index
```

## `scripts/element.js`

Purpose:

- query an element
- interact with it
- work across custom-component boundaries via selector chains

Examples:

```bash
node <skill-dir>/scripts/element.js \
  --mode auto \
  --project-path "$PWD" \
  --action tap \
  --selector .submit-button
```

```bash
node <skill-dir>/scripts/element.js \
  --mode auto \
  --project-path "$PWD" \
  --action input \
  --selector '#keyword' \
  --value 'hello world'
```

```bash
node <skill-dir>/scripts/element.js \
  --mode auto \
  --project-path "$PWD" \
  --action text \
  --selector-chain-json '[".user-card", ".title"]'
```

Supported actions include:

- `tap`
- `longpress`
- `input`
- `trigger`
- `text`
- `value`
- `attribute`
- `property`
- `style`
- `size`
- `offset`
- `wxml`
- `outer-wxml`
- `call-method`
- `data`
- `set-data`
- `scroll-to`
- `swipe-to`
- `move-to`
- `slide-to`

## `scripts/page.js`

Purpose:

- run page-level waits
- read or write page data
- call page methods
- inspect page size or scroll position

Examples:

```bash
node <skill-dir>/scripts/page.js \
  --mode auto \
  --project-path "$PWD" \
  --action wait-for \
  --selector .loaded-flag
```

```bash
node <skill-dir>/scripts/page.js \
  --mode auto \
  --project-path "$PWD" \
  --action data \
  --path form.status
```

```bash
node <skill-dir>/scripts/page.js \
  --mode auto \
  --project-path "$PWD" \
  --action call-method \
  --method submit \
  --args-json '[]'
```

## `scripts/runtime.js`

Purpose:

- run MiniProgram-level actions
- evaluate runtime probes
- call or mock `wx` APIs
- take screenshots in the simulator
- start remote debugging

Examples:

```bash
node <skill-dir>/scripts/runtime.js \
  --mode auto \
  --project-path "$PWD" \
  --action current-page
```

```bash
node <skill-dir>/scripts/runtime.js \
  --mode auto \
  --project-path "$PWD" \
  --action evaluate \
  --function '() => getCurrentPages().map((page) => page.route)'
```

```bash
node <skill-dir>/scripts/runtime.js \
  --mode auto \
  --project-path "$PWD" \
  --action mock-wx \
  --method chooseLocation \
  --result-json '{"name":"Mock Place"}'
```

For complicated `evaluate()` payloads, prefer `--function-file FILE` instead of shell-heavy inline strings.

## `scripts/run-flow.js`

Purpose:

- run a multi-step scenario in one session
- keep navigation, waits, interactions, and assertions together
- avoid repeatedly reconnecting across separate commands

This is the default script for non-trivial scenarios.

Example flow file:

```json
{
  "steps": [
    {
      "action": "reLaunch",
      "url": "/pages/home/index",
      "verifyRoute": "pages/home/index",
      "waitMs": 500
    },
    {
      "action": "element",
      "elementAction": "tap",
      "selector": ".submit-button"
    },
    {
      "action": "page",
      "pageAction": "data",
      "path": "status",
      "saveAs": "status"
    },
    {
      "action": "runtime",
      "runtimeAction": "routes",
      "saveAs": "routes"
    }
  ]
}
```

Run it:

```bash
node <skill-dir>/scripts/run-flow.js \
  --mode auto \
  --project-path "$PWD" \
  --flow-file ./flow.json
```

Supported flow actions:

- route actions: `reLaunch`, `navigateTo`, `redirectTo`, `navigateBack`, `switchTab`
- waiting: `waitFor`
- element wrapper: `element`
- page wrapper: `page`
- runtime wrapper: `runtime`
- assertions: `assertRoute`, `assertPageData`

## Recommended script selection

- single smoke check -> `scripts/session.js`
- route-only task -> `scripts/navigate.js`
- one element interaction or query -> `scripts/element.js`
- one page-data or page-method task -> `scripts/page.js`
- runtime probe, mock, screenshot, or remote start -> `scripts/runtime.js`
- anything multi-step -> `scripts/run-flow.js`

## Output format

All scripts print structured JSON.

Typical shape:

```json
{
  "ok": true,
  "script": "navigate.js",
  "session": {
    "usedMode": "launch"
  },
  "result": {
    "currentRoute": "pages/home/index"
  }
}
```

On failure, the script prints JSON with `ok: false` and an error object to stderr.

## Practical guidance

- Prefer `run-flow.js` for scenarios with more than one meaningful step.
- Prefer `--flow-file` and `--function-file` over deeply escaped inline JSON or function strings.
- If route helpers are flaky, use `scripts/navigate.js --strategy evaluate --verify-route ...` or the equivalent flow step.
- If the task needs long async page logic, combine `runtime.js --action evaluate` with later checks, or encode the whole scenario in `run-flow.js`.
- Restore mocked APIs before final cleanup.
- **Avoid repeated launch/close cycles.** DevTools needs 8–15s to fully release after `close()`. For multiple independent commands, launch once with `--cleanup none` and reuse via `--mode connect --ws-endpoint ws://localhost:PORT --cleanup disconnect`. The scripts now auto-retry launches on port-conflict errors (`--retry-count 2` by default).
