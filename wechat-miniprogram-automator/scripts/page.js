#!/usr/bin/env node
const { getFlag, parseArgv, sessionHelpText } = require('./lib/args')
const { runCli } = require('./lib/runner')
const { cleanupSession, openSession, sessionSummary } = require('./lib/session')
const { runPageAction } = require('./lib/ops')

function helpText() {
  return `page.js

Operate on the current page object.

Usage:
  node scripts/page.js --action wait-for --selector .loaded-flag [session flags]
  node scripts/page.js --action data --path form.status [session flags]
  node scripts/page.js --action call-method --method submit --args-json '[]' [session flags]
  node scripts/page.js --action set-data --data-json '{"debug":true}' [session flags]

Page flags:
  --action wait-for | data | set-data | call-method | size | scroll-top
  --selector SELECTOR               For wait-for.
  --ms NUMBER                       For wait-for.
  --path DATA_PATH                  For data.
  --data-json JSON                  For set-data.
  --method NAME                     For call-method.
  --args-json JSON                  JSON array for call-method arguments.

${sessionHelpText()}
`
}

runCli(async () => {
  const args = parseArgv(process.argv.slice(2))
  if (args.flags.help) {
    process.stdout.write(helpText())
    return null
  }

  const action = String(getFlag(args.flags, 'action') || '')
  if (!action) {
    throw new Error('page.js requires --action')
  }

  const session = await openSession(args.flags)
  const context = { miniProgram: session.miniProgram, page: null }

  try {
    return {
      result: await runPageAction(context, action, args.flags),
      script: 'page.js',
      session: sessionSummary(session),
    }
  } finally {
    await cleanupSession(session)
  }
})
