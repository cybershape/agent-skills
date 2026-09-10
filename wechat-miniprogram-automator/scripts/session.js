#!/usr/bin/env node
const { parseArgv, sessionHelpText } = require('./lib/args')
const { runCli } = require('./lib/runner')
const { cleanupSession, openSession, sessionSummary } = require('./lib/session')
const { getCurrentRoutes } = require('./lib/ops')

function helpText() {
  return `session.js

Open a session with connect/launch/auto, run a cheap smoke check, and print session details.

Usage:
  node scripts/session.js [session flags]

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
  try {
    const systemInfo = await session.miniProgram.systemInfo()
    let currentPage = null
    try {
      currentPage = await session.miniProgram.currentPage()
    } catch (error) {
      currentPage = null
    }

    return {
      result: {
        currentPage: currentPage
          ? {
              path: currentPage.path,
              query: currentPage.query,
            }
          : null,
        routes: await getCurrentRoutes(session.miniProgram).catch(() => []),
        systemInfo,
      },
      script: 'session.js',
      session: sessionSummary(session),
    }
  } finally {
    await cleanupSession(session)
  }
})
