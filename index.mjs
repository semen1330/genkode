const TICK_MS = 1000;
let timer;

function init() {
  console.log('агент запущен');
}

function listen() {
  console.log('слушаю');
}

function think() {
  console.log('думаю');
}

function act() {
  console.log('делаю');
}

function tick() {
  console.log('тик');
  listen();
  think();
  act();
}

function shutdown() {
  clearInterval(timer);
  console.log('агент остановлен');
  process.exit(0);
}

init();
timer = setInterval(tick, TICK_MS);
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
