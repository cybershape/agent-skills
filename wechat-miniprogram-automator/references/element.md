# Element API

Adapted from the official WeChat Mini Program `Element` documentation.

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `element.tagName` | `string` | Lowercase tag name |

## Queries

| API | Purpose | Return | Notes |
| --- | --- | --- | --- |
| `element.$(selector)` | Find a single descendant element | `Promise<Element>` | Useful for entering a component subtree |
| `element.$$(selector)` | Find multiple descendant elements | `Promise<Element[]>` | Same as above |

## Read element state

| API | Purpose | Return | Notes |
| --- | --- | --- | --- |
| `size()` | Get element width and height | `Promise<{ width: number, height: number }>` | - |
| `offset()` | Get absolute element position | `Promise<{ left: number, top: number }>` | Relative to the page top-left corner |
| `text()` | Get element text | `Promise<string>` | - |
| `attribute(name)` | Get an element attribute | `Promise<string>` | For example `class` |
| `property(name)` | Get an element property | `Promise<any>` | Requires `automator 0.9.0+`, base library `2.9.5+` |
| `wxml()` | Get inner WXML | `Promise<string>` | Excludes the element itself |
| `outerWxml()` | Get full WXML | `Promise<string>` | Includes the element itself |
| `value()` | Get the element value | `Promise<string>` | Common for form controls |
| `style(name)` | Get a computed style value | `Promise<string>` | - |

## General interaction

| API | Purpose | Return | Notes |
| --- | --- | --- | --- |
| `tap()` | Tap the element | `Promise<void>` | Most common interaction |
| `longpress()` | Long press the element | `Promise<void>` | - |
| `touchstart(options)` | Start a touch sequence | `Promise<void>` | Requires `automator 0.8.0+`, base library `2.9.1+` |
| `touchmove(options)` | Move during a touch sequence | `Promise<void>` | Same options as `touchstart` |
| `touchend(options)` | End a touch sequence | `Promise<void>` | Same options as `touchstart` |
| `trigger(type, detail?)` | Trigger an element event | `Promise<void>` | Useful for custom component events |
| `input(value)` | Input text | `Promise<void>` | Only for `input` and `textarea`; requires `automator 0.9.0+`, base library `2.9.5+` |

## Component instance capabilities

| API | Purpose | Return | Notes |
| --- | --- | --- | --- |
| `callMethod(method, ...args)` | Call a component instance method | `Promise<any>` | Custom components only; requires `automator 0.6.0+`, base library `2.9.0+` |
| `data(path?)` | Get component render data | `Promise<Object>` | Custom components only; supports data paths |
| `setData(data)` | Set component render data | `Promise<void>` | Custom components only |
| `callContextMethod(method, ...args)` | Call a context object method | `Promise<any>` | `video` only; requires `automator 0.9.0+`, base library `2.9.5+` |

## Component-specific capabilities

| API | Purpose | Return | Supported component |
| --- | --- | --- | --- |
| `scrollWidth()` | Get scroll width | `Promise<number>` | `scroll-view` |
| `scrollHeight()` | Get scroll height | `Promise<number>` | `scroll-view` |
| `scrollTo(x, y)` | Scroll to a position | `Promise<void>` | `scroll-view` |
| `swipeTo(index)` | Switch to a swiper item | `Promise<void>` | `swiper` |
| `moveTo(x, y)` | Move a movable view | `Promise<void>` | `movable-view` |
| `slideTo(value)` | Move a slider to a value | `Promise<void>` | `slider` |

These component-specific APIs require the capability set introduced in `automator 0.9.0+` with base library `2.9.5+`.

## Usage guidelines

- When searching inside a component subtree, continue from `element.$()` instead of jumping back to `page.$()`.
- For text entry, prefer `input()` unless you specifically need a custom event sequence.
- Only use component instance methods or component data APIs when you know the target is a custom component.

## Official page

- https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/element.html
