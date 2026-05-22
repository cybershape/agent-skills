const fs = require('fs')
const path = require('path')

function pushFlag(flags, key, value) {
  if (Object.prototype.hasOwnProperty.call(flags, key)) {
    if (Array.isArray(flags[key])) {
      flags[key].push(value)
    } else {
      flags[key] = [flags[key], value]
    }
    return
  }
  flags[key] = value
}

function parseArgv(argv) {
  const flags = {}
  const positionals = []

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]

    if (arg === '--') {
      positionals.push(...argv.slice(i + 1))
      break
    }

    if (arg === '-h' || arg === '--help') {
      flags.help = true
      continue
    }

    if (!arg.startsWith('--')) {
      positionals.push(arg)
      continue
    }

    if (arg.startsWith('--no-')) {
      pushFlag(flags, arg.slice(5), false)
      continue
    }

    const eqIndex = arg.indexOf('=')
    if (eqIndex !== -1) {
      pushFlag(flags, arg.slice(2, eqIndex), arg.slice(eqIndex + 1))
      continue
    }

    const key = arg.slice(2)
    const next = argv[i + 1]

    if (next == null || (next.startsWith('-') && !/^\-\d/.test(next))) {
      pushFlag(flags, key, true)
      continue
    }

    pushFlag(flags, key, next)
    i += 1
  }

  return { flags, _: positionals }
}

function getFlag(flags, name, fallback) {
  if (Object.prototype.hasOwnProperty.call(flags, name)) {
    return flags[name]
  }
  return fallback
}

function requireFlag(flags, name, message) {
  const value = getFlag(flags, name)
  if (value == null || value === false || value === '') {
    throw new Error(message || `Missing required flag --${name}`)
  }
  return value
}

function asNumber(value, label) {
  if (value == null || value === '') return undefined
  const number = Number(value)
  if (!Number.isFinite(number)) {
    throw new Error(`${label || 'value'} must be a number`)
  }
  return number
}

function asBoolean(value, fallback) {
  if (value == null) return fallback
  if (typeof value === 'boolean') return value
  const normalized = String(value).trim().toLowerCase()
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false
  throw new Error(`Cannot parse boolean value: ${value}`)
}

function resolvePath(value) {
  if (!value) return undefined
  return path.resolve(String(value))
}

function readTextFile(filePath) {
  return fs.readFileSync(resolvePath(filePath), 'utf8')
}

function readTextInput(flags, inlineKey, fileKey, label) {
  const inlineValue = getFlag(flags, inlineKey)
  if (inlineValue != null && inlineValue !== false) {
    return String(inlineValue)
  }

  const filePath = getFlag(flags, fileKey)
  if (filePath) {
    return readTextFile(filePath)
  }

  if (label) {
    throw new Error(`Provide --${inlineKey} or --${fileKey} for ${label}`)
  }
  return undefined
}

function parseJsonString(text, label) {
  try {
    return JSON.parse(text)
  } catch (error) {
    throw new Error(`Invalid JSON for ${label}: ${error.message}`)
  }
}

function readJsonInput(flags, inlineKey, fileKey, label, { required = false } = {}) {
  const inlineValue = getFlag(flags, inlineKey)
  if (inlineValue != null && inlineValue !== false) {
    return parseJsonString(String(inlineValue), label || inlineKey)
  }

  const filePath = getFlag(flags, fileKey)
  if (filePath) {
    return parseJsonString(readTextFile(filePath), label || fileKey)
  }

  if (required) {
    throw new Error(`Provide --${inlineKey} or --${fileKey} for ${label || 'JSON input'}`)
  }

  return undefined
}

function ensureArray(value, label) {
  if (value == null) return []
  if (!Array.isArray(value)) {
    throw new Error(`${label || 'value'} must be an array`)
  }
  return value
}

function sessionHelpText() {
  return `Session flags:
  --mode auto|connect|launch      Session strategy. Default: auto.
  --ws-endpoint URL               WebSocket endpoint for connect mode.
  --project-path PATH             Mini Program project root. Default: current working directory.
  --cli-path PATH                 WeChat DevTools CLI path for launch mode.
  --port NUMBER                   Port for launch mode, or localhost port for connect/auto mode.
  --timeout MS                    Launch timeout in milliseconds.
  --account OPENID                Multi-account debugging openid.
  --ticket TOKEN                  DevTools login ticket.
  --project-config-json JSON      JSON overrides for project.config.json.
  --project-config-file FILE      JSON file overrides for project.config.json.
  --cleanup auto|close|disconnect|none
                                  Cleanup strategy. Default: auto.`
}

module.exports = {
  asBoolean,
  asNumber,
  ensureArray,
  getFlag,
  parseArgv,
  readJsonInput,
  readTextFile,
  readTextInput,
  requireFlag,
  resolvePath,
  sessionHelpText,
}
