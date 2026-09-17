import config from './config.mjs';
import { route } from './lib/router.mjs';
import { remember, recall } from './lib/memory.mjs';

const TICK_MS = 1000;
let timer;

async function init() {
  const lastStart = await recall('last_start');
  console.log(lastStart ? `Прошлый запуск: ${lastStart}` : 'первый запуск');
  await remember('last_start', new Date().toISOString());

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

async function rememberFromTask(task) {
  const [, key, ...rest] = task.split(' ');
  const value = rest.join(' ');
  await remember(key, value);
  console.log(`Запомнил: ${key} = ${value}`);
}

async function tick() {
  const t = listen();
  if (!t) return;

  if (t.includes('запомни')) {
    await rememberFromTask(t);
    return;
  }

  act(t, think(t));
}

function shutdown() {
  clearInterval(timer);
  console.log('агент остановлен');
  process.exit(0);
}

await init();
timer = setInterval(tick, TICK_MS);
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
