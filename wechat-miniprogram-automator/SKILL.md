---
name: wechat-miniprogram-automator
description: Use when controlling WeChat DevTools, the Mini Program simulator, or remote device debugging sessions with miniprogram-automator. Covers startup/connection, simulator automation, remote debugging, reusable JS scripts, MiniProgram/Page/Element APIs, and fallback strategies for flaky automation runs.
---

# WeChat Mini Program Automator Skill

Use `miniprogram-automator` to control WeChat DevTools, the Mini Program simulator, and remote device debugging sessions.

Keep this skill project-agnostic. Do not assume fixed routes, selectors, ports, or DevTools startup conventions unless the current project explicitly defines them.

## Use this skill when

- starting or reconnecting a WeChat DevTools automation session
- driving a Mini Program in the simulator
- navigating pages, querying elements, tapping, typing, scrolling, or taking simulator screenshots
- switching from simulator validation to remote device debugging
- using `MiniProgram`, `Page`, or `Element` APIs for assertions, runtime inspection, mocking, or method calls
- recovering from unstable automation runs such as route timeouts or flaky DevTools sessions

## First read

Start with the smallest reference that matches the task:

- script usage and CLI interface: [references/scripts.md](references/scripts.md)
- execution workflow: [references/workflows.md](references/workflows.md)
- startup and connection: [references/automator.md](references/automator.md)
- simulator quick start: [references/quick-start.md](references/quick-start.md)
- remote device debugging: [references/remote.md](references/remote.md)
- runtime APIs: [references/miniprogram.md](references/miniprogram.md)
- page APIs: [references/page.md](references/page.md)
- element APIs: [references/element.md](references/element.md)

## Core operating rules

- Prefer the provided JS scripts under `scripts/` over ad hoc inline Node snippets.
- Prefer `scripts/run-flow.js` for any scenario with multiple meaningful steps.
- Prefer the simulator first; move to a real device only when requested or when the issue is device-specific.
- Reuse an existing healthy session, but launch a fresh one on a new port when the current session becomes flaky.
- After any navigation or state-changing action, explicitly wait for the page to stabilize.
- Use `page.$()` / `page.$$()` for page-level queries, and `element.$()` / `element.$$()` inside custom components.
- Use route helpers when they are stable; if routing is flaky, use the script support for `evaluate()`-driven routing plus `getCurrentPages()` verification.
- Use `page.callMethod()` only for short page methods; for long async actions, prefer runtime-triggered execution plus polling.
- Restore mocked APIs before exit.
- Prefer `miniProgram.close()` for cleanup; use `disconnect()` only when the DevTools window should remain open.

## Quick decision guide

### Session startup

- existing healthy automation endpoint -> `scripts/session.js` with `--mode connect` or `--mode auto`
- no running endpoint, or unstable reused session -> `scripts/session.js` or `scripts/run-flow.js` with `--mode launch` or `--mode auto`
- port conflict -> choose a different port; the launch helper retries on port-conflict errors (default: 2 retries, 10s apart)
- **prefer session reuse**: launch once with `--cleanup none`, then reuse across commands with `--mode connect --ws-endpoint ws://localhost:PORT --cleanup disconnect`. DevTools takes 8–15s to fully release after `close()`, making repeated launch/close cycles slow and flaky.

### Routing

- normal navigation -> `scripts/navigate.js`
- multi-step routing + assertions -> `scripts/run-flow.js`
- helper timeout but route may still succeed -> `scripts/navigate.js --strategy evaluate --verify-route ...`

### Page logic

- short synchronous page method -> `scripts/page.js --action call-method`
- long async page logic -> `scripts/runtime.js --action evaluate` or encode the whole scenario in `scripts/run-flow.js`

### Element selection

- node on the page surface -> `scripts/element.js --selector ...`
- node inside a custom component -> `scripts/element.js --selector-chain-json ...`

### Runtime control

- call built-in `wx` API -> `scripts/runtime.js --action call-wx`
- mock built-in `wx` API -> `scripts/runtime.js --action mock-wx`
- inject runtime probe or custom logic -> `scripts/runtime.js --action evaluate`
- simulator screenshot -> `scripts/runtime.js --action screenshot`

## Important constraints

- CLI/HTTP invocation must be enabled in WeChat DevTools security settings.
- `miniProgram.screenshot()` works in the DevTools simulator, not in remote real-device execution.
- Some APIs require minimum versions of `miniprogram-automator`, the Mini Program base library, or WeChat DevTools.
- `page.$()` and `page.$$()` cannot cross custom component boundaries.
- `element.input()` only works for `input` and `textarea`.
- `element.callContextMethod()` only applies to `video`.
- `scrollTo`-related methods only apply to `scroll-view`.
- `swipeTo` only applies to `swiper`.
- `moveTo` only applies to `movable-view`.
- `slideTo` only applies to `slider`.

## Recommended working style

1. Read [references/scripts.md](references/scripts.md) for available scripts.
2. Read [references/workflows.md](references/workflows.md) for script-first execution order.
3. Prefer `scripts/run-flow.js` for multi-step tasks and the smaller scripts for one-off tasks.
4. Prefer `--flow-file` and `--function-file` over shell-heavy inline JSON or function strings.
5. Verify route, element, and data state explicitly instead of assuming helper success.
6. Clean up mocks and close the session when done.

## Shipped scripts

- `scripts/session.js`
- `scripts/navigate.js`
- `scripts/element.js`
- `scripts/page.js`
- `scripts/runtime.js`
- `scripts/run-flow.js`

## Official sources

- https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/quick-start.html
- https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/remote.html
- https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/automator.html
- https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/miniprogram.html
- https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/page.html
- https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/element.html
