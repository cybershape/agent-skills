# Execution Workflows

This file is the agent-oriented playbook for using `miniprogram-automator` reliably.

Use it when you are actively running an automation task. Prefer the shipped JS scripts under `scripts/` instead of writing one-off inline Node programs.

For script names and flags, see [scripts.md](scripts.md).

## 0. Critical operational facts

These reflect real-world testing on macOS with DevTools `1.06.x` and `miniprogram-automator 0.12.x`.

- **DevTools needs ~8–15s to fully release after `close()`.** Back-to-back `launch()` calls on different ports will fail with "http port is open" or "port is in use" if the previous DevTools window is still shutting down.
- **The `--retry-count` flag mitigates this** — the launch helper now retries on port-conflict errors (default: 2 retries, 10s apart). Increase to 4–5 for CI.
- **Prefer session reuse over repeated launch/close cycles.** For multi-step scenarios, use `run-flow.js`. For multiple independent commands, launch once with `--cleanup none`, then reuse with `--mode connect --ws-endpoint ws://localhost:PORT --cleanup disconnect`.
- **Pass the project root** (the directory containing `project.config.json`), not the `miniprogram/` subdirectory. The `project.config.json`'s `miniprogramRoot` field is read by DevTools internally.
- **DevTools must be open** before the CLI `auto` command can complete. If DevTools hasn't been opened before, the first launch may take longer as it initializes.
- **macOS CLI path**: `/Applications/wechatwebdevtools.app/Contents/MacOS/cli`

## 1. Default execution policy

Prefer this order:

1. identify the project root, routes, selectors, and success criteria
2. choose the smallest shipped script that fits the task
3. prefer `scripts/run-flow.js` when the task has multiple meaningful steps
4. validate in the simulator first
5. move to remote-device debugging only when required
6. restore mocks and clean up the session

If required details are unknown, inspect the project or ask for them. Do not silently guess routes or selectors.

## 2. Pre-flight checklist

Before executing anything, identify:

- Mini Program project root
- whether WeChat DevTools is already running
- whether an automation endpoint is already available
- whether the task should run in the simulator or on a real device
- target route(s)
- target selector(s)
- expected success condition(s): route change, element visibility, data state, console output, or screenshot

## 3. Pick the right script

### `scripts/session.js`

Use when you need to:

- check whether an existing session is healthy
- confirm that `connect()` or `launch()` works
- inspect basic route or system state before deeper automation

Example:

```bash
node <skill-dir>/scripts/session.js \
  --mode auto \
  --project-path "$PWD" \
  --port 9420
```

### `scripts/navigate.js`

Use when you need to:

- run a single route change
- verify the final route
- fall back to `evaluate()`-driven routing for flaky helper behavior

Example:

```bash
node <skill-dir>/scripts/navigate.js \
  --mode auto \
  --project-path "$PWD" \
  --method reLaunch \
  --url /pages/home/index \
  --verify-route pages/home/index \
  --wait-ms 500
```

Flaky routing example:

```bash
node <skill-dir>/scripts/navigate.js \
  --mode auto \
  --project-path "$PWD" \
  --method navigateTo \
  --strategy evaluate \
  --url /pages/detail/index?id=1 \
  --verify-route pages/detail/index
```

### `scripts/element.js`

Use when you need to:

- tap or type into one element
- inspect text, attributes, or styles
- access nodes inside a custom component with a selector chain

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
  --action text \
  --selector-chain-json '[".user-card", ".title"]'
```

### `scripts/page.js`

Use when you need to:

- wait for page stability
- read or write page data
- call a short page method

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

### `scripts/runtime.js`

Use when you need to:

- inspect the runtime
- call or mock `wx` APIs
- run `evaluate()` probes
- take a simulator screenshot
- start remote debugging

Examples:

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

### `scripts/run-flow.js`

Use when you need to:

- keep multiple steps inside one session
- combine navigation, waits, interaction, and assertions
- avoid reconnecting between separate shell commands

This should be the default choice for any non-trivial scenario.

## 4. Baseline simulator workflow

### Session reuse (recommended for multiple commands)

For running several independent scripts against the same project, avoid the cost of repeated launch/close cycles:

```bash
# Step 1: Launch once and keep the session alive
node <skill-dir>/scripts/session.js \
  --mode launch \
  --project-path "$PWD" \
  --port 9420 \
  --cleanup none

# Steps 2–N: Connect and reuse, disconnect when done
node <skill-dir>/scripts/navigate.js \
  --mode connect \
  --ws-endpoint ws://localhost:9420 \
  --cleanup disconnect \
  --method reLaunch \
  --url /pages/home/index

node <skill-dir>/scripts/element.js \
  --mode connect \
  --ws-endpoint ws://localhost:9420 \
  --cleanup disconnect \
  --action tap \
  --selector .submit-button

# Final step: close the session
node <skill-dir>/scripts/session.js \
  --mode connect \
  --ws-endpoint ws://localhost:9420 \
  --cleanup close
```

### Basic flow file

For a typical multi-step simulator run, prefer a flow file.

Example `flow.json`:

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

Use this as the baseline before adding more complex routing or runtime probes.

## 5. Routing workflow

### Normal case

Prefer `scripts/navigate.js` for one route change, or a route step inside `scripts/run-flow.js`.

Good defaults:

- use built-in helper strategy first
- verify the resulting route for important regressions
- wait explicitly after navigation

### Flaky routing case

If helper-based routing times out but the route may still succeed:

1. switch to `--strategy evaluate`
2. provide `--verify-route`
3. keep route verification separate from route triggering

That avoids treating helper timeout as proof of routing failure.

## 6. Element lookup workflow

### Page-level nodes

Use a simple selector:

```bash
node <skill-dir>/scripts/element.js \
  --mode auto \
  --project-path "$PWD" \
  --action tap \
  --selector .primary-button
```

### Nodes inside custom components

Use a selector chain so each boundary is explicit:

```bash
node <skill-dir>/scripts/element.js \
  --mode auto \
  --project-path "$PWD" \
  --action text \
  --selector-chain-json '[".user-card", ".follow-button"]'
```

If a selector unexpectedly fails, check whether the target is inside a custom component boundary.

## 7. Interaction workflow

For single interactions, use `scripts/element.js`.

For interactions that must be followed by assertions, prefer `scripts/run-flow.js` so the interaction and verification stay in one session.

After interaction, explicitly validate one of these:

- route changed
- page data changed
- expected element appeared
- loading finished
- console output appeared

Do not treat a successful tap or input call as proof that the UI finished updating.

## 8. Page-method workflow

### Short synchronous page method

Use `scripts/page.js --action call-method`.

Example:

```bash
node <skill-dir>/scripts/page.js \
  --mode auto \
  --project-path "$PWD" \
  --action call-method \
  --method submit \
  --args-json '[]'
```

### Long async page method

If `page.callMethod()` tends to time out because the method triggers network or long async work:

- prefer `scripts/runtime.js --action evaluate`
- or encode the whole scenario in `scripts/run-flow.js`
- then verify the result with later page-data or route checks

When the injected function is complex, prefer `--function-file` over inline strings.

## 9. Runtime inspection and mocking workflow

Use `scripts/runtime.js` for:

- `evaluate()` probes
- calling `wx` methods
- mocking `wx` methods
- restoring mocked methods
- screenshots in the simulator
- remote debugging start

Always restore mocks before final cleanup.

A common sequence is:

1. mock a `wx` method
2. run the scenario
3. inspect page data or route state
4. restore the mocked method

## 10. Remote-device workflow

Use remote debugging only after the simulator path is understood.

### Good reasons to switch

- the user explicitly asks for real-device execution
- the bug reproduces only on a real device
- the issue depends on hardware, permissions, or device runtime behavior

### Flow

1. validate the simulator flow first
2. use `scripts/runtime.js --action remote`
3. connect the device
4. rerun the scenario, often with `scripts/run-flow.js`
5. avoid simulator-only capabilities such as `screenshot()`

## 11. Failure recovery workflow

When the run is unstable, try these in order:

1. verify DevTools security settings allow CLI/HTTP invocation
2. check whether the current endpoint is actually healthy with `scripts/session.js`
3. switch from connect-style reuse to a fresh launch
4. switch to a new port
5. replace route helpers with `evaluate` strategy plus route verification
6. replace direct page-method calls with runtime-triggered execution plus later checks
7. add explicit waits after route or interaction steps
8. re-check selectors and component boundaries
9. reproduce in the simulator before retrying on a real device

## 12. Reusable flow pattern

For any scenario longer than one or two actions, encode it as a flow file and run it once.

Advantages:

- one session instead of repeated reconnects
- explicit order of operations
- easier route and data assertions
- easier reuse across projects
- less shell quoting if you keep JSON in a file

## 13. Reporting guidance

When reporting results back to the user, include:

- which script you used
- whether the session used `connect()` or `launch()`
- whether the run happened in the simulator or on a real device
- target route(s) tested
- selectors or methods used for the key assertion
- whether any fallback strategy was needed
- final observed result

That gives the next automation step a clear baseline.
