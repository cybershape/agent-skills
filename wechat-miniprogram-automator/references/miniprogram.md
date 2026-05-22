# MiniProgram API

Adapted from the official WeChat Mini Program `MiniProgram` documentation.

## Routing and pages

| API | Purpose | Return | Notes |
| --- | --- | --- | --- |
| `pageStack()` | Get the current page stack | `Promise<Page[]>` | Useful for stack-depth assertions |
| `navigateTo(url)` | Push a non-tabBar page | `Promise<Page>` | Maps to `wx.navigateTo` |
| `redirectTo(url)` | Replace the current page | `Promise<Page>` | Maps to `wx.redirectTo` |
| `navigateBack()` | Go back to the previous page | `Promise<Page>` | Maps to `wx.navigateBack` |
| `reLaunch(url)` | Reset the stack and reopen | `Promise<Page>` | Maps to `wx.reLaunch` |
| `switchTab(url)` | Open a tabBar page | `Promise<Page>` | Maps to `wx.switchTab` |
| `currentPage()` | Get the current page object | `Promise<Page>` | Main entry point for page interaction |

## Runtime and system capabilities

| API | Purpose | Return | Notes |
| --- | --- | --- | --- |
| `systemInfo()` | Get system information | `Promise<Object>` | Maps to `wx.getSystemInfo` |
| `callWxMethod(method, ...args)` | Call a Mini Program-side `wx` API | `Promise<any>` | Generic entry point for system APIs |
| `callPluginWxMethod(pluginId, method, ...args)` | Call a plugin `wx` API | `Promise<any>` | Base library `2.19.3+` |
| `evaluate(appFunction, ...args)` | Inject code into AppService and return the result | `Promise<any>` | Useful for runtime probes |
| `pageScrollTo(scrollTop)` | Scroll the current page | `Promise<void>` | Maps to `wx.pageScrollTo` |
| `exposeFunction(name, bindingFunction)` | Expose a test-side function to AppService | `Promise<void>` | Lets runtime code call back into the test |

## Mocking and restore

| API | Purpose | Return | Notes |
| --- | --- | --- | --- |
| `mockWxMethod(method, result)` | Mock a specific `wx` API | `Promise<void>` | `automator 0.9.0+`, base library `2.9.5+` |
| `mockPluginWxMethod(pluginId, method, result)` | Mock a plugin `wx` API | `Promise<void>` | Base library `2.19.3+` |
| `restoreWxMethod(method)` | Restore a mocked `wx` API | `Promise<void>` | Clean up at the end of the test |
| `restorePluginWxMethod(pluginId, method)` | Restore a mocked plugin `wx` API | `Promise<void>` | Same as above |

Common use cases:

- mock `wx.chooseLocation`
- mock APIs that depend on permissions, dialogs, location, or other system capabilities
- restore mocks in `finally` so they do not leak into later scripts

## Screenshots, audits, and tickets

| API | Purpose | Return | Notes |
| --- | --- | --- | --- |
| `screenshot(options?)` | Capture the current page | `Promise<string \| void>` | Simulator only; requires `automator 0.9.0+`, base library `2.9.5+`, DevTools `1.02.2001082+` |
| `stopAudits(options?)` | Stop performance audits and retrieve the report | `Promise<Object>` | Requires `automator 0.10.0+`, DevTools `1.04.2006242+` |
| `getTicket()` | Get the current login ticket | `Promise<{ ticket: string, expiredTime: number }>` | Requires the DevTools setting that allows ticket retrieval |
| `setTicket(ticket)` | Update the DevTools login ticket | `Promise<void>` | Useful for long-running sessions |
| `refreshTicket()` | Refresh ticket validity | `Promise<void>` | Old tickets become invalid after refresh |

## Accounts, remote debugging, and connection control

| API | Purpose | Return | Notes |
| --- | --- | --- | --- |
| `testAccounts()` | Get multi-account debugging users | `Promise<Account[]>` | Requires `automator 0.9.0+`, DevTools `1.02.2002272+` |
| `remote(auto?)` | Start remote device debugging | `Promise<void>` | Later calls run on the connected device |
| `disconnect()` | Detach from the runtime | `void` | Does not close the project window |
| `close()` | Detach and close the project window | `Promise<void>` | Preferred cleanup path |

## Events

| Event | Meaning | Payload |
| --- | --- | --- |
| `console` | Fired when the Mini Program prints logs | `msg.type`, `msg.args` |
| `exception` | Fired when page JavaScript throws | `error.message`, `error.stack` |

## Selection guidelines

- Prefer built-in routing APIs for normal navigation.
- Use `evaluate()` when you need runtime inspection, custom probes, or a more controlled route-trigger-and-verify flow.
- Prefer `mockWxMethod` for system capability mocking, and restore immediately after the scenario.
- Check the current runtime before using `screenshot()`, because it is simulator-only.

## Official page

- https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/miniprogram.html
