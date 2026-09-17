import config from './config.mjs';
import { route } from './lib/router.mjs';

const TICK_MS = 1000;
let timer;

function init() {
  console.log('агент запущен');
  console.log('Запущен агент:', config.name);
}

const taskQueue = ['/помощь', '/статус', 'просто текст'];

function listen() {
  return taskQueue.shift();
}

function think(task) {
  return route(task);
}

function act(task, decision) {
  console.log(decision);
}

function tick() {
  const t = listen();
  if (t) act(t, think(t));
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
