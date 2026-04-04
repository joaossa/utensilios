const fs = require('fs')
const path = require('path')

const stage = process.argv[2] || 'unknown'
const logPath = path.join(__dirname, 'hostinger-stages.log')

const lines = [
  `[${new Date().toISOString()}] stage=${stage}`,
  `cwd=${process.cwd()}`,
  `__dirname=${__dirname}`,
  `node=${process.version}`,
  `has DATABASE_URL=${Boolean(process.env.DATABASE_URL)}`,
  `has JWT_SECRET=${Boolean(process.env.JWT_SECRET)}`,
  '---',
]

try {
  fs.appendFileSync(logPath, `${lines.join('\n')}\n`, 'utf8')
} catch {}

for (const line of lines) {
  try {
    console.log(line)
  } catch {}
}
