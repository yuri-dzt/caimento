// Sobe backend (tsx watch) e frontend (vite) juntos, sem dependência extra.
// Funciona em Windows, Linux e macOS.
const { spawn } = require('node:child_process')

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const children = ['dev:server', 'dev:client'].map((script) =>
  spawn(npm, ['run', script], { stdio: 'inherit', shell: process.platform === 'win32' }),
)

function shutdown(code) {
  for (const child of children) child.kill()
  process.exit(code)
}

for (const child of children) {
  child.on('exit', (code) => shutdown(code ?? 0))
}
process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
