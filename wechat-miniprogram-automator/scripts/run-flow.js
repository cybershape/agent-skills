#!/usr/bin/env node
const { parseArgv, readJsonInput, sessionHelpText } = require('./lib/args')
const { runCli } = require('./lib/runner')
const { cleanupSession, openSession, sessionSummary } = require('./lib/session')
const { runFlowStep } = require('./lib/ops')

function helpText() {
  return `run-flow.js

Run a multi-step automation flow in a single session.

Usage:
  node scripts/run-flow.js --flow-file ./flow.json [session flags]
  node scripts/run-flow.js --flow-json '{"steps":[{"action":"reLaunch","url":"/pages/home/index","waitMs":500}]}' [session flags]

Flow input:
  --flow-json JSON
  --flow-file FILE

Flow shape:
  {
    "steps": [
      { "action": "reLaunch", "url": "/pages/home/index", "waitMs": 500 },
      { "action": "element", "elementAction": "tap", "selector": ".submit-button" },
      { "action": "page", "pageAction": "data", "path": "status" },
      { "action": "runtime", "runtimeAction": "routes" },
      { "action": "assertRoute", "route": "pages/home/index" }
    ]
  }

Supported flow actions:
  reLaunch | navigateTo | redirectTo | navigateBack | switchTab |
  waitFor |
  element | page | runtime |
  assertRoute | assertPageData

${sessionHelpText()}
`
}

runCli(async () => {
  const args = parseArgv(process.argv.slice(2))
  if (args.flags.help) {
    process.stdout.write(helpText())
    return null
  }

  const flow = readJsonInput(args.flags, 'flow-json', 'flow-file', 'flow JSON', { required: true })
  const steps = Array.isArray(flow) ? flow : flow.steps
  if (!Array.isArray(steps) || steps.length === 0) {
    throw new Error('Flow must be an array or an object with a non-empty steps array')
  }

  const session = await openSession(args.flags)
  const context = {
    miniProgram: session.miniProgram,
    page: null,
    results: {},
  }

  try {
    const stepResults = []
    for (let index = 0; index < steps.length; index += 1) {
      const step = steps[index]
      const result = await runFlowStep(context, step)
      if (step.saveAs) {
        context.results[step.saveAs] = result
      }
      stepResults.push({
        index,
        result,
        saveAs: step.saveAs,
        step,
      })
    }

    return {
      result: {
        saved: context.results,
        steps: stepResults,
      },
      script: 'run-flow.js',
      session: sessionSummary(session),
    }
  } finally {
    await cleanupSession(session)
  }
})
