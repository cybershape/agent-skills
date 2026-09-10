#!/usr/bin/env node
const { getFlag, parseArgv, sessionHelpText } = require('./lib/args')
const { runCli } = require('./lib/runner')
const { cleanupSession, openSession, sessionSummary } = require('./lib/session')
const { runElementAction } = require('./lib/ops')

function helpText() {
  return `element.js

Query or interact with an element selected from the current page.

Usage:
  node scripts/element.js --action tap --selector .submit-button [session flags]
  node scripts/element.js --action input --selector '#keyword' --value 'hello' [session flags]
  node scripts/element.js --action text --selector-chain-json '[".card", ".title"]' [session flags]
  node scripts/element.js --action trigger --selector .picker --event-type change --detail-json '{"value":1}' [session flags]

Element flags:
  --action ACTION
    tap | longpress | input | trigger | text | value | attribute | property | style |
    size | offset | wxml | outer-wxml | call-method | data | set-data |
    scroll-to | swipe-to | move-to | slide-to
  --selector SELECTOR
  --selector-chain-json JSON      Array of selectors for custom-component boundaries.
  --selector-chain-file FILE      JSON file with selector array.
  --value VALUE                   For input or slide-to.
  --event-type TYPE               For trigger.
  --detail-json JSON              For trigger detail.
  --name NAME                     For attribute/property/style.
  --method NAME                   For call-method.
  --args-json JSON                JSON array for call-method arguments.
  --path DATA_PATH                For data.
  --data-json JSON                For set-data.
  --x NUMBER --y NUMBER           For scroll-to / move-to.
  --index NUMBER                  For swipe-to.

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
    throw new Error('element.js requires --action')
  }

  const session = await openSession(args.flags)
  const context = { miniProgram: session.miniProgram, page: null }

  try {
    return {
      result: await runElementAction(context, action, args.flags),
      script: 'element.js',
      session: sessionSummary(session),
    }
  } finally {
    await cleanupSession(session)
  }
})
