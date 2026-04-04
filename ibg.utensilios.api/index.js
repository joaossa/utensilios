require('dotenv/config')

const fs = require('fs')
const path = require('path')

const startupLogPath = path.join(__dirname, 'startup.log')

function writeStartupLog(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`

  try {
    fs.appendFileSync(startupLogPath, line, 'utf8')
  } catch {}

  try {
    console.log(line.trim())
  } catch {}
}

process.on('uncaughtException', (error) => {
  writeStartupLog(`uncaughtException: ${error?.stack || error}`)
})

process.on('unhandledRejection', (reason) => {
  writeStartupLog(`unhandledRejection: ${reason?.stack || reason}`)
})

writeStartupLog('Bootstrap start')
writeStartupLog(`node=${process.version}`)
writeStartupLog(`cwd=${process.cwd()}`)
writeStartupLog(`__dirname=${__dirname}`)
writeStartupLog(`has DATABASE_URL=${Boolean(process.env.DATABASE_URL)}`)
writeStartupLog(`has JWT_SECRET=${Boolean(process.env.JWT_SECRET)}`)
writeStartupLog(
  `dist/src/server.js exists=${fs.existsSync(path.join(__dirname, 'dist', 'src', 'server.js'))}`,
)

try {
  require('./dist/src/server.js')
  writeStartupLog('dist/src/server.js required successfully')
} catch (error) {
  writeStartupLog(`bootstrap failure: ${error?.stack || error}`)
  throw error
}
