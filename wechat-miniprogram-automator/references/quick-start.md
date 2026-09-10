# Quick Start

Adapted from the official WeChat Mini Program automation quick-start documentation.

## Runtime requirements

- `Node.js` greater than `8.0`
- Mini Program base library `2.7.3` or later
- WeChat DevTools `1.02.1907232` or later

## Installation

```bash
npm i miniprogram-automator --save-dev
```

## Pre-flight checks

- Enable `CLI/HTTP` invocation in WeChat DevTools security settings.
- If this setting is disabled, `automator.launch()` will not start successfully.

## Minimal workflow

1. `require('miniprogram-automator')`
2. `automator.launch({ projectPath, cliPath? })`
3. Open the target page with `miniProgram.reLaunch()` or another routing API
4. Wait for the page to stabilize with `page.waitFor(...)`
5. Get elements with `page.$()` or `element.$()`
6. Call methods such as `tap()`, `input()`, or `attribute()`
7. Close the session with `miniProgram.close()`

## Minimal example

```js
const automator = require('miniprogram-automator')

automator.launch({
  projectPath: process.cwd(),
}).then(async (miniProgram) => {
  const page = await miniProgram.reLaunch('/pages/home/index')
  await page.waitFor(500)
  const element = await page.$('.some-selector')
  await element.tap()
  await miniProgram.close()
})
```

## Official page

- https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/quick-start.html
