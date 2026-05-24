const path = require('path')
const { createRequire } = require('module')
const {
  asNumber,
  getFlag,
  readJsonInput,
  resolvePath,
} = require('./args')

const LAUNCH_RETRYABLE_PATTERNS = [
  'port is in use',
  'http port is open',
  'another project',
  'timed out',
]

function resolveProjectPath(flags) {
  const projectPath = getFlag(flags, 'project-path')
  return resolvePath(projectPath) || process.cwd()
}

function resolveWsEndpoint(flags) {
  const wsEndpoint = getFlag(flags, 'ws-endpoint')
  if (wsEndpoint) return String(wsEndpoint)

  const port = asNumber(getFlag(flags, 'port'), 'port')
  if (port != null) {
    return `ws://localhost:${port}`
  }

  return undefined
}

function loadAutomator(projectPath) {
  const attempted = []
  const candidates = [projectPath, process.cwd()].filter(Boolean)

  for (const candidate of candidates) {
    const base = path.resolve(candidate)
    attempted.push(base)
    try {
      const customRequire = createRequire(path.join(base, 'package.json'))
      return {
        automator: customRequire('miniprogram-automator'),
        resolvedFrom: base,
      }
    } catch (error) {
      // keep trying
    }
  }

  attempted.push(__filename)
  try {
    return {
      automator: require('miniprogram-automator'),
      resolvedFrom: __filename,
    }
  } catch (error) {
    throw new Error(
      `Could not load miniprogram-automator. Tried project-local resolution from: ${attempted.join(', ')}`
    )
  }
}

function isLaunchRetryable(error) {
  const message = (error && error.message) ? error.message : ''
  return LAUNCH_RETRYABLE_PATTERNS.some((pattern) => message.includes(pattern))
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function normalizeSessionOptions(flags) {
  const mode = String(getFlag(flags, 'mode', 'auto'))
  const projectPath = resolveProjectPath(flags)
  const wsEndpoint = resolveWsEndpoint(flags)
  const port = asNumber(getFlag(flags, 'port'), 'port')
  const timeout = asNumber(getFlag(flags, 'timeout'), 'timeout')
  const cliPath = resolvePath(getFlag(flags, 'cli-path'))
  const account = getFlag(flags, 'account')
  const ticket = getFlag(flags, 'ticket')
  const cleanup = String(getFlag(flags, 'cleanup', 'auto'))
  const projectConfig = readJsonInput(flags, 'project-config-json', 'project-config-file', 'project config JSON')
  const retryCount = asNumber(getFlag(flags, 'retry-count'), 'retry-count') ?? 2
  const retryDelayMs = asNumber(getFlag(flags, 'retry-delay-ms'), 'retry-delay-ms') ?? 10000

  if (!['auto', 'connect', 'launch'].includes(mode)) {
    throw new Error(`Unsupported --mode value: ${mode}`)
  }

  if (!['auto', 'close', 'disconnect', 'none'].includes(cleanup)) {
    throw new Error(`Unsupported --cleanup value: ${cleanup}`)
  }

  return {
    account,
    cleanup,
    cliPath,
    mode,
    port,
    projectConfig,
    projectPath,
    retryCount,
    retryDelayMs,
    ticket,
    timeout,
    wsEndpoint,
  }
}

async function tryLaunch(automator, launchOptions, options) {
  let lastError
  const maxAttempts = 1 + (options.retryCount || 0)
  const delayMs = options.retryDelayMs || 10000

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const miniProgram = await automator.launch(launchOptions)
      return { miniProgram, retryAttempts: attempt }
    } catch (error) {
      lastError = error
      if (attempt < maxAttempts - 1 && isLaunchRetryable(error)) {
        process.stderr.write(
          `[session] Launch attempt ${attempt + 1} failed: ${error.message}. ` +
          `Retrying in ${delayMs}ms (${maxAttempts - attempt - 1} left)...\n`
        )
        await sleep(delayMs)
      } else {
        throw error
      }
    }
  }
  throw lastError
}

async function openSession(flags) {
  const options = normalizeSessionOptions(flags)
  const { automator, resolvedFrom } = loadAutomator(options.projectPath)

  const connectOptions = {
    wsEndpoint: options.wsEndpoint,
  }

  const launchOptions = {
    projectPath: options.projectPath,
  }

  if (options.cliPath) launchOptions.cliPath = options.cliPath
  if (options.port != null) launchOptions.port = options.port
  if (options.timeout != null) launchOptions.timeout = options.timeout
  if (options.account) launchOptions.account = options.account
  if (options.ticket) launchOptions.ticket = options.ticket
  if (options.projectConfig) launchOptions.projectConfig = options.projectConfig

  let miniProgram
  let usedMode
  let connectError
  let retryAttempts = 0

  if (options.mode === 'connect') {
    if (!options.wsEndpoint) {
      throw new Error('connect mode requires --ws-endpoint or --port')
    }
    miniProgram = await automator.connect(connectOptions)
    usedMode = 'connect'
  } else if (options.mode === 'launch') {
    const result = await tryLaunch(automator, launchOptions, options)
    miniProgram = result.miniProgram
    retryAttempts = result.retryAttempts
    usedMode = 'launch'
  } else {
    if (options.wsEndpoint) {
      try {
        miniProgram = await automator.connect(connectOptions)
        usedMode = 'connect'
      } catch (error) {
        connectError = error
      }
    }

    if (!miniProgram) {
      try {
        const result = await tryLaunch(automator, launchOptions, options)
        miniProgram = result.miniProgram
        retryAttempts = result.retryAttempts
        usedMode = 'launch'
      } catch (launchError) {
        if (connectError) {
          throw new Error(
            `Both connect and launch failed. ` +
            `Connect: ${connectError.message}. ` +
            `Launch: ${launchError.message}`
          )
        }
        throw launchError
      }
    }
  }

  return {
    connectError,
    connectOptions,
    launchOptions,
    miniProgram,
    options,
    resolvedFrom,
    retryAttempts,
    usedMode,
  }
}

async function cleanupSession(session) {
  const cleanup = session.options.cleanup
  if (cleanup === 'none') return

  if (cleanup === 'close') {
    await session.miniProgram.close()
    return
  }

  if (cleanup === 'disconnect') {
    session.miniProgram.disconnect()
    return
  }

  if (session.usedMode === 'launch') {
    await session.miniProgram.close()
  } else {
    session.miniProgram.disconnect()
  }
}

function sessionSummary(session) {
  const summary = {
    cleanup: session.options.cleanup,
    connectError: session.connectError
      ? {
          message: session.connectError.message,
        }
      : undefined,
    connectOptions: session.connectOptions,
    launchOptions: session.launchOptions,
    resolvedFrom: session.resolvedFrom,
    usedMode: session.usedMode,
  }
  if (session.retryAttempts) {
    summary.retryAttempts = session.retryAttempts
  }
  return summary
}

module.exports = {
  cleanupSession,
  normalizeSessionOptions,
  openSession,
  sessionSummary,
}
