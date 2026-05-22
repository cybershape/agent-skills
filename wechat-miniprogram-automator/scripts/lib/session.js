const path = require('path')
const { createRequire } = require('module')
const {
  asNumber,
  getFlag,
  readJsonInput,
  resolvePath,
} = require('./args')

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
    ticket,
    timeout,
    wsEndpoint,
  }
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

  if (options.mode === 'connect') {
    if (!options.wsEndpoint) {
      throw new Error('connect mode requires --ws-endpoint or --port')
    }
    miniProgram = await automator.connect(connectOptions)
    usedMode = 'connect'
  } else if (options.mode === 'launch') {
    miniProgram = await automator.launch(launchOptions)
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
      miniProgram = await automator.launch(launchOptions)
      usedMode = 'launch'
    }
  }

  return {
    connectError,
    connectOptions,
    launchOptions,
    miniProgram,
    options,
    resolvedFrom,
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
  return {
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
}

module.exports = {
  cleanupSession,
  normalizeSessionOptions,
  openSession,
  sessionSummary,
}
