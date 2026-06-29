// Minimal structured logger with levels + simple coloring.
const COLORS = {
  reset: '\x1b[0m', dim: '\x1b[2m', red: '\x1b[31m', green: '\x1b[32m',
  yellow: '\x1b[33m', blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m',
};
const useColor = process.stdout.isTTY;
const c = (color, s) => (useColor ? COLORS[color] + s + COLORS.reset : s);

function stamp() {
  return new Date().toISOString().slice(11, 19);
}

export const log = {
  step: (msg) => console.log(`${c('dim', stamp())} ${c('cyan', '▸')} ${msg}`),
  info: (msg) => console.log(`${c('dim', stamp())} ${c('blue', 'ℹ')} ${msg}`),
  ok: (msg) => console.log(`${c('dim', stamp())} ${c('green', '✓')} ${msg}`),
  warn: (msg) => console.log(`${c('dim', stamp())} ${c('yellow', '!')} ${msg}`),
  err: (msg) => console.error(`${c('dim', stamp())} ${c('red', '✗')} ${msg}`),
  title: (msg) => console.log(`\n${c('magenta', '◆ ' + msg)}`),
  detail: (msg) => console.log(`${c('dim', '    ' + msg)}`),
};

export default log;
