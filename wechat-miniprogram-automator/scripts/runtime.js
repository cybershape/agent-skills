#!/usr/bin/env node
const { getFlag, parseArgv, sessionHelpText } = require('./lib/args')
const { runCli } = require('./lib/runner')
const { cleanupSession, openSession, sessionSummary } = require('./lib/session')
const { runRuntimeAction } = require('./lib/ops')

function helpText() {
  return `runtime.js

Run runtime-level MiniProgram actions.

Usage:
  node scripts/runtime.js --action current-page [session flags]
  node scripts/runtime.js --action evaluate --function '() => getCurrentPages().map((p) => p.route)' [session flags]
  node scripts/runtime.js --action call-wx --method getSystemInfo --args-json '[]' [session flags]
  node scripts/runtime.js --action mock-wx --method chooseLocation --result-json '{"name":"Mock Place"}' [session flags]
  node scripts/runtime.js --action screenshot --options-json '{"path":"./shot.png"}' [session flags]

Runtime actions:
  current-page | page-stack | routes | system-info | evaluate |
  call-wx | call-plugin-wx | mock-wx | restore-wx |
  mock-plugin-wx | restore-plugin-wx |
  page-scroll-to | screenshot | remote

Runtime flags:
  --action ACTION
  --function SOURCE               Function source for evaluate.
  --function-file FILE            File containing function source for evaluate.
  --args-json JSON                JSON array for evaluate/call-wx arguments.
  --method NAME                   For call-wx / mock-wx / restore-wx / plugin variants.
  --plugin-id ID                  For plugin variants.
  --result-json JSON              For mock-wx / mock-plugin-wx.
  --scroll-top NUMBER             For page-scroll-to.
  --options-json JSON             For screenshot options.
  --auto true|false               For remote(auto).

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
    throw new Error('runtime.js requires --action')
  }

  const session = await openSession(args.flags)
  const context = { miniProgram: session.miniProgram, page: null }

  try {
    return {
      result: await runRuntimeAction(context, action, args.flags),
      script: 'runtime.js',
      session: sessionSummary(session),
    }
  } finally {
    await cleanupSession(session)
  }
})
