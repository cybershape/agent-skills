# Page API

Adapted from the official WeChat Mini Program `Page` documentation.

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `page.path` | `string` | Page path |
| `page.query` | `Object` | Page query parameters |

## Methods

| API | Purpose | Return | Notes |
| --- | --- | --- | --- |
| `page.$(selector)` | Get a single element from the page | `Promise<Element>` | Supports only part of CSS selector syntax |
| `page.$$(selector)` | Get an array of page elements | `Promise<Element[]>` | Cannot cross into custom components |
| `page.waitFor(condition)` | Wait for a condition | `Promise<void>` | `string` for selector, `number` for timeout, `Function` for predicate |
| `page.data(path?)` | Get page render data | `Promise<Object>` | Requires `automator 0.6.0+`, base library `2.9.0+`; supports data paths |
| `page.setData(data)` | Set page render data | `Promise<void>` | Directly drives the page data layer |
| `page.size()` | Get page size | `Promise<{ width: number, height: number }>` | Returns scrollable page size |
| `page.scrollTop()` | Get page scroll position | `Promise<number>` | Requires `automator 0.7.0+` |
| `page.callMethod(method, ...args)` | Call a page method | `Promise<any>` | Useful for triggering page logic |

## Common patterns

### Wait until the page is stable

```js
await page.waitFor('.loaded-flag')
await page.waitFor(500)
await page.waitFor(() => !!getCurrentPages().length)
```

### Assert page data

```js
const status = await page.data('form.status')
```

### Trigger page logic

```js
await page.callMethod('submit')
```

## Selector notes

- `page.$()` and `page.$$()` cannot cross into custom components.
- If the target node is inside a custom component, first get the component root and then use `element.$()` or `element.$$()`.

## Official page

- https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/page.html
