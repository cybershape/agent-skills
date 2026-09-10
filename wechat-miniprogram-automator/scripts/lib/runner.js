async function runCli(main) {
  try {
    const result = await main()
    if (result == null) return
    process.stdout.write(`${JSON.stringify({ ok: true, ...result }, null, 2)}\n`)
  } catch (error) {
    const payload = {
      ok: false,
      error: {
        message: error && error.message ? error.message : String(error),
        stack: error && error.stack ? error.stack : undefined,
      },
    }
    process.stderr.write(`${JSON.stringify(payload, null, 2)}\n`)
    process.exitCode = 1
  }
}

module.exports = { runCli }
