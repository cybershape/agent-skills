const {
  asBoolean,
  asNumber,
  ensureArray,
  getFlag,
  readJsonInput,
  readTextInput,
} = require('./args')

const ROUTE_METHODS = new Set([
  'navigateTo',
  'redirectTo',
  'navigateBack',
  'reLaunch',
  'switchTab',
])

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitFor(fn, { timeout = 30000, interval = 300 } = {}) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const result = await fn()
    if (result) return result
    await sleep(interval)
  }
  throw new Error('waitFor timeout')
}

async function getCurrentRoutes(miniProgram) {
  return miniProgram.evaluate(() => getCurrentPages().map((page) => page.route))
}

async function pollForRoute(miniProgram, expectedRoute, { timeout = 30000, interval = 300 } = {}) {
  return waitFor(async () => {
    const routes = await getCurrentRoutes(miniProgram)
    return routes.at(-1) === expectedRoute ? routes : null
  }, { timeout, interval })
}

async function ensureCurrentPage(context) {
  if (context.page) return context.page
  context.page = await context.miniProgram.currentPage()
  return context.page
}

function selectorChainFromFlags(flags) {
  const selectorChain = readJsonInput(flags, 'selector-chain-json', 'selector-chain-file', 'selector chain JSON')
  if (selectorChain != null) {
    return ensureArray(selectorChain, 'selector chain')
  }

  const selector = getFlag(flags, 'selector')
  if (selector == null || selector === false || selector === '') {
    throw new Error('Provide --selector or --selector-chain-json/--selector-chain-file')
  }
  return [String(selector)]
}

async function resolveElement(context, { selector, selectorChain } = {}) {
  const page = await ensureCurrentPage(context)
  const chain = selectorChain || (selector ? [selector] : null)
  if (!chain || chain.length === 0) {
    throw new Error('A selector or selectorChain is required')
  }

  let current = await page.$(chain[0])
  if (!current) {
    throw new Error(`Element not found for selector "${chain[0]}"`)
  }
  for (let index = 1; index < chain.length; index += 1) {
    const next = await current.$(chain[index])
    if (!next) {
      throw new Error(
        `Element not found at selector chain depth ${index + 1}: ` +
        `"${chain.slice(0, index + 1).join(' -> ')}"`
      )
    }
    current = next
  }

  return current
}

function routeArgsFromFlags(flags) {
  const method = String(getFlag(flags, 'method', 'reLaunch'))
  const url = getFlag(flags, 'url')
  const delta = asNumber(getFlag(flags, 'delta'), 'delta')
  const timeout = asNumber(getFlag(flags, 'route-timeout'), 'route-timeout') || 30000
  const interval = asNumber(getFlag(flags, 'route-interval'), 'route-interval') || 300
  const verifyRoute = getFlag(flags, 'verify-route')
  const strategy = String(getFlag(flags, 'strategy', 'helper'))
  const waitMs = asNumber(getFlag(flags, 'wait-ms'), 'wait-ms')
  const waitSelector = getFlag(flags, 'wait-selector')

  if (!ROUTE_METHODS.has(method)) {
    throw new Error(`Unsupported route method: ${method}`)
  }

  if (['navigateTo', 'redirectTo', 'reLaunch', 'switchTab'].includes(method) && !url) {
    throw new Error(`--url is required for method ${method}`)
  }

  if (!['helper', 'evaluate'].includes(strategy)) {
    throw new Error(`Unsupported --strategy value: ${strategy}`)
  }

  return {
    delta,
    interval,
    method,
    strategy,
    timeout,
    url,
    verifyRoute,
    waitMs,
    waitSelector,
  }
}

async function runNavigation(context, options) {
  let page

  if (options.strategy === 'helper') {
    if (options.method === 'navigateBack') {
      page = await context.miniProgram.navigateBack()
    } else if (options.method === 'navigateTo') {
      page = await context.miniProgram.navigateTo(options.url)
    } else if (options.method === 'redirectTo') {
      page = await context.miniProgram.redirectTo(options.url)
    } else if (options.method === 'reLaunch') {
      page = await context.miniProgram.reLaunch(options.url)
    } else if (options.method === 'switchTab') {
      page = await context.miniProgram.switchTab(options.url)
    }
  } else {
    await context.miniProgram.evaluate((payload) => new Promise((resolve) => {
      const { method, url, delta } = payload
      const api = wx[method]
      const routeOptions = {
        complete: resolve,
      }
      if (url) routeOptions.url = url
      if (delta != null) routeOptions.delta = delta
      api(routeOptions)
    }), {
      delta: options.delta,
      method: options.method,
      url: options.url,
    })
  }

  if (options.verifyRoute) {
    await pollForRoute(context.miniProgram, options.verifyRoute, {
      interval: options.interval,
      timeout: options.timeout,
    })
  }

  if (!page) {
    page = await context.miniProgram.currentPage()
  }
  context.page = page

  if (options.waitSelector) {
    await page.waitFor(String(options.waitSelector))
  }
  if (options.waitMs != null) {
    await page.waitFor(options.waitMs)
  }

  return {
    currentRoute: (await getCurrentRoutes(context.miniProgram)).at(-1),
    method: options.method,
    routes: await getCurrentRoutes(context.miniProgram),
    strategy: options.strategy,
    waitedFor: {
      ms: options.waitMs,
      selector: options.waitSelector,
    },
  }
}

async function runWaitFor(context, { ms, selector }) {
  const page = await ensureCurrentPage(context)
  if (selector) {
    await page.waitFor(String(selector))
    return { selector: String(selector) }
  }
  if (ms != null) {
    await page.waitFor(ms)
    return { ms }
  }
  throw new Error('wait-for requires --selector or --ms')
}

async function runElementAction(context, action, flags) {
  const element = await resolveElement(context, {
    selectorChain: selectorChainFromFlags(flags),
  })

  if (action === 'tap') {
    await element.tap()
    return { action }
  }
  if (action === 'longpress') {
    await element.longpress()
    return { action }
  }
  if (action === 'input') {
    const value = String(getFlag(flags, 'value', ''))
    await element.input(value)
    return { action, value }
  }
  if (action === 'trigger') {
    const type = String(getFlag(flags, 'event-type') || getFlag(flags, 'type') || '')
    if (!type) throw new Error('trigger requires --event-type')
    const detail = readJsonInput(flags, 'detail-json', 'detail-file', 'event detail JSON')
    await element.trigger(type, detail)
    return { action, detail, eventType: type }
  }
  if (action === 'text') return { action, value: await element.text() }
  if (action === 'value') return { action, value: await element.value() }
  if (action === 'attribute') {
    const name = String(getFlag(flags, 'name') || '')
    if (!name) throw new Error('attribute requires --name')
    return { action, name, value: await element.attribute(name) }
  }
  if (action === 'property') {
    const name = String(getFlag(flags, 'name') || '')
    if (!name) throw new Error('property requires --name')
    return { action, name, value: await element.property(name) }
  }
  if (action === 'style') {
    const name = String(getFlag(flags, 'name') || '')
    if (!name) throw new Error('style requires --name')
    return { action, name, value: await element.style(name) }
  }
  if (action === 'size') return { action, value: await element.size() }
  if (action === 'offset') return { action, value: await element.offset() }
  if (action === 'wxml') return { action, value: await element.wxml() }
  if (action === 'outer-wxml') return { action, value: await element.outerWxml() }
  if (action === 'call-method') {
    const method = String(getFlag(flags, 'method') || '')
    if (!method) throw new Error('call-method requires --method')
    const args = readJsonInput(flags, 'args-json', 'args-file', 'method arguments JSON') || []
    return { action, method, value: await element.callMethod(method, ...ensureArray(args, 'method args')) }
  }
  if (action === 'data') {
    const dataPath = getFlag(flags, 'path')
    return { action, path: dataPath, value: await element.data(dataPath) }
  }
  if (action === 'set-data') {
    const data = readJsonInput(flags, 'data-json', 'data-file', 'setData payload', { required: true })
    await element.setData(data)
    return { action, value: data }
  }
  if (action === 'scroll-to') {
    const x = asNumber(getFlag(flags, 'x'), 'x') || 0
    const y = asNumber(getFlag(flags, 'y'), 'y') || 0
    await element.scrollTo(x, y)
    return { action, value: { x, y } }
  }
  if (action === 'swipe-to') {
    const index = asNumber(getFlag(flags, 'index'), 'index')
    await element.swipeTo(index)
    return { action, value: { index } }
  }
  if (action === 'move-to') {
    const x = asNumber(getFlag(flags, 'x'), 'x') || 0
    const y = asNumber(getFlag(flags, 'y'), 'y') || 0
    await element.moveTo(x, y)
    return { action, value: { x, y } }
  }
  if (action === 'slide-to') {
    const value = asNumber(getFlag(flags, 'value'), 'value')
    await element.slideTo(value)
    return { action, value }
  }

  throw new Error(`Unsupported element action: ${action}`)
}

async function runPageAction(context, action, flags) {
  const page = await ensureCurrentPage(context)

  if (action === 'wait-for') {
    return runWaitFor(context, {
      ms: asNumber(getFlag(flags, 'ms'), 'ms'),
      selector: getFlag(flags, 'selector'),
    })
  }
  if (action === 'data') {
    const dataPath = getFlag(flags, 'path')
    return { action, path: dataPath, value: await page.data(dataPath) }
  }
  if (action === 'set-data') {
    const data = readJsonInput(flags, 'data-json', 'data-file', 'setData payload', { required: true })
    await page.setData(data)
    return { action, value: data }
  }
  if (action === 'call-method') {
    const method = String(getFlag(flags, 'method') || '')
    if (!method) throw new Error('call-method requires --method')
    const args = readJsonInput(flags, 'args-json', 'args-file', 'method arguments JSON') || []
    return { action, method, value: await page.callMethod(method, ...ensureArray(args, 'method args')) }
  }
  if (action === 'size') return { action, value: await page.size() }
  if (action === 'scroll-top') return { action, value: await page.scrollTop() }

  throw new Error(`Unsupported page action: ${action}`)
}

async function runRuntimeAction(context, action, flags) {
  const miniProgram = context.miniProgram

  if (action === 'system-info') {
    return { action, value: await miniProgram.systemInfo() }
  }
  if (action === 'current-page') {
    const page = await miniProgram.currentPage()
    context.page = page
    return { action, value: { path: page.path, query: page.query } }
  }
  if (action === 'page-stack') {
    const stack = await miniProgram.pageStack()
    return {
      action,
      value: stack.map((page) => ({ path: page.path, query: page.query })),
    }
  }
  if (action === 'evaluate') {
    const fnSource = readTextInput(flags, 'function', 'function-file', 'evaluate function source')
    const args = readJsonInput(flags, 'args-json', 'args-file', 'evaluate arguments JSON') || []
    const fn = new Function(`return (${fnSource.trim()})`)()
    return { action, value: await miniProgram.evaluate(fn, ...ensureArray(args, 'evaluate args')) }
  }
  if (action === 'call-wx') {
    const method = String(getFlag(flags, 'method') || '')
    if (!method) throw new Error('call-wx requires --method')
    const args = readJsonInput(flags, 'args-json', 'args-file', 'wx method arguments JSON') || []
    return { action, method, value: await miniProgram.callWxMethod(method, ...ensureArray(args, 'wx args')) }
  }
  if (action === 'call-plugin-wx') {
    const pluginId = String(getFlag(flags, 'plugin-id') || '')
    const method = String(getFlag(flags, 'method') || '')
    if (!pluginId) throw new Error('call-plugin-wx requires --plugin-id')
    if (!method) throw new Error('call-plugin-wx requires --method')
    const args = readJsonInput(flags, 'args-json', 'args-file', 'plugin wx arguments JSON') || []
    return {
      action,
      method,
      pluginId,
      value: await miniProgram.callPluginWxMethod(pluginId, method, ...ensureArray(args, 'plugin wx args')),
    }
  }
  if (action === 'mock-wx') {
    const method = String(getFlag(flags, 'method') || '')
    if (!method) throw new Error('mock-wx requires --method')
    const result = readJsonInput(flags, 'result-json', 'result-file', 'mock result JSON', { required: true })
    await miniProgram.mockWxMethod(method, result)
    return { action, method, value: result }
  }
  if (action === 'restore-wx') {
    const method = String(getFlag(flags, 'method') || '')
    if (!method) throw new Error('restore-wx requires --method')
    await miniProgram.restoreWxMethod(method)
    return { action, method }
  }
  if (action === 'mock-plugin-wx') {
    const pluginId = String(getFlag(flags, 'plugin-id') || '')
    const method = String(getFlag(flags, 'method') || '')
    if (!pluginId) throw new Error('mock-plugin-wx requires --plugin-id')
    if (!method) throw new Error('mock-plugin-wx requires --method')
    const result = readJsonInput(flags, 'result-json', 'result-file', 'mock plugin result JSON', { required: true })
    await miniProgram.mockPluginWxMethod(pluginId, method, result)
    return { action, method, pluginId, value: result }
  }
  if (action === 'restore-plugin-wx') {
    const pluginId = String(getFlag(flags, 'plugin-id') || '')
    const method = String(getFlag(flags, 'method') || '')
    if (!pluginId) throw new Error('restore-plugin-wx requires --plugin-id')
    if (!method) throw new Error('restore-plugin-wx requires --method')
    await miniProgram.restorePluginWxMethod(pluginId, method)
    return { action, method, pluginId }
  }
  if (action === 'page-scroll-to') {
    const scrollTop = asNumber(getFlag(flags, 'scroll-top'), 'scroll-top')
    await miniProgram.pageScrollTo(scrollTop)
    return { action, value: { scrollTop } }
  }
  if (action === 'screenshot') {
    const options = readJsonInput(flags, 'options-json', 'options-file', 'screenshot options JSON')
    return { action, value: await miniProgram.screenshot(options) }
  }
  if (action === 'remote') {
    const auto = asBoolean(getFlag(flags, 'auto'), undefined)
    await miniProgram.remote(auto)
    return { action, value: { auto } }
  }
  if (action === 'routes') {
    return { action, value: await getCurrentRoutes(miniProgram) }
  }

  throw new Error(`Unsupported runtime action: ${action}`)
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key)
}

async function runFlowStep(context, step) {
  const action = String(step.action || '')
  if (!action) throw new Error('Every flow step requires an action')

  if (['navigateTo', 'redirectTo', 'navigateBack', 'reLaunch', 'switchTab'].includes(action)) {
    return runNavigation(context, {
      delta: step.delta,
      interval: step.routeInterval || 300,
      method: action,
      strategy: step.strategy || 'helper',
      timeout: step.routeTimeout || 30000,
      url: step.url,
      verifyRoute: step.verifyRoute,
      waitMs: step.waitMs,
      waitSelector: step.waitSelector,
    })
  }

  if (action === 'waitFor') {
    return runWaitFor(context, {
      ms: step.ms,
      selector: step.selector,
    })
  }

  if (action === 'element') {
    const elementAction = step.elementAction || step.operation || step.kind || step.command || 'tap'
    const flags = {
      'args-json': hasOwn(step, 'args') ? JSON.stringify(step.args) : undefined,
      'data-json': hasOwn(step, 'data') ? JSON.stringify(step.data) : undefined,
      'detail-json': hasOwn(step, 'detail') ? JSON.stringify(step.detail) : undefined,
      'event-type': step.eventType,
      index: step.index,
      method: step.method,
      name: step.name,
      path: step.path,
      selector: step.selector,
      'selector-chain-json': hasOwn(step, 'selectorChain') ? JSON.stringify(step.selectorChain) : undefined,
      value: step.value,
      x: step.x,
      y: step.y,
    }
    return runElementAction(context, elementAction, flags)
  }

  if (action === 'page') {
    const pageAction = step.pageAction || step.operation || step.kind || 'data'
    const flags = {
      'args-json': hasOwn(step, 'args') ? JSON.stringify(step.args) : undefined,
      'data-json': hasOwn(step, 'data') ? JSON.stringify(step.data) : undefined,
      method: step.method,
      ms: step.ms,
      path: step.path,
      selector: step.selector,
    }
    return runPageAction(context, pageAction, flags)
  }

  if (action === 'runtime') {
    const runtimeAction = step.runtimeAction || step.operation || step.kind || 'current-page'
    const flags = {
      'args-json': hasOwn(step, 'args') ? JSON.stringify(step.args) : undefined,
      auto: step.auto,
      function: step.function,
      method: step.method,
      'options-json': hasOwn(step, 'options') ? JSON.stringify(step.options) : undefined,
      'plugin-id': step.pluginId,
      'result-json': hasOwn(step, 'result') ? JSON.stringify(step.result) : undefined,
      'scroll-top': step.scrollTop,
    }
    return runRuntimeAction(context, runtimeAction, flags)
  }

  if (action === 'assertRoute') {
    const expected = String(step.route || '')
    if (!expected) throw new Error('assertRoute requires route')
    const routes = await pollForRoute(context.miniProgram, expected, {
      interval: step.routeInterval || 300,
      timeout: step.routeTimeout || 30000,
    })
    return { route: expected, routes }
  }

  if (action === 'assertPageData') {
    const page = await ensureCurrentPage(context)
    const actual = await page.data(step.path)
    const actualJson = JSON.stringify(actual)
    const expectedJson = JSON.stringify(step.equals)
    if (actualJson !== expectedJson) {
      throw new Error(
        `assertPageData failed for path "${step.path}": ` +
        `expected ${expectedJson}, got ${actualJson}`
      )
    }
    return { equals: step.equals, path: step.path, value: actual }
  }

  throw new Error(`Unsupported flow action: ${action}`)
}

module.exports = {
  ensureCurrentPage,
  getCurrentRoutes,
  pollForRoute,
  resolveElement,
  routeArgsFromFlags,
  runElementAction,
  runFlowStep,
  runNavigation,
  runPageAction,
  runRuntimeAction,
  runWaitFor,
  selectorChainFromFlags,
  sleep,
  waitFor,
}
