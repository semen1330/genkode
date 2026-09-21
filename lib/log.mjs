function timestamp() {
  const pad = (n) => String(n).padStart(2, '0');
  const d = new Date();
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  return `${date} ${time}`;
}

function log(level, text) {
  console.log(`[${timestamp()}] ${level} | ${text}`);
}

export function info(text) {
  log('INFO', text);
}

export function warn(text) {
  log('WARN', text);
}

export function error(text) {
  log('ERROR', text);
}
