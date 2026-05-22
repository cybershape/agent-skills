#!/usr/bin/env node
const { parseArgv, sessionHelpText } = require('./lib/args')
const { runCli } = require('./lib/runner')
const { cleanupSession, openSession, sessionSummary } = require('./lib/session')
const { routeArgsFromFlags, runNavigation } = require('./lib/ops')

function helpText() {
  return `navigate.js

Navigate with built-in route helpers or with evaluate()+route polling.

Usage:
  node scripts/navigate.js --method reLaunch --url /pages/home/index [session flags]
  node scripts/navigate.js --method navigateTo --url /pages/detail/index?id=1 --verify-route pages/detail/index --wait-ms 500 [session flags]
  node scripts/navigate.js --method navigateTo --strategy evaluate --url /pages/detail/index?id=1 --verify-route pages/detail/index [session flags]

Route flags:
  --method navigateTo|redirectTo|navigateBack|reLaunch|switchTab
  --url URL                      Required for all route methods except navigateBack.
  --delta NUMBER                 Optional delta for navigateBack when using --strategy evaluate.
  --strategy helper|evaluate     Default: helper.
  --verify-route ROUTE           Poll getCurrentPages() until this route is active.
  --route-timeout MS             Default: 30000.
  --route-interval MS            Default: 300.
  --wait-selector SELECTOR       Additional page.waitFor(selector) after navigation.
  --wait-ms MS                   Additional page.waitFor(ms) after navigation.

${sessionHelpText()}
`
}

runCli(async () => {
  const args = parseArgv(process.argv.slice(2))
  if (args.flags.help) {
    process.stdout.write(helpText())
    return null
  }

  const session = await openSession(args.flags)
  const context = { miniProgram: session.miniProgram, page: null }

  try {
    return {
      result: await runNavigation(context, routeArgsFromFlags(args.flags)),
      script: 'navigate.js',
      session: sessionSummary(session),
    }
  } finally {
    await cleanupSession(session)
  }
})
