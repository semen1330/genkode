import './lib/env.mjs';
import config from './config.mjs';
import { ask } from './lib/llm.mjs';
import { remember, recall } from './lib/memory.mjs';
import { startTelegram } from './lib/tg.mjs';
import { checkAgent } from './lib/nadzor.mjs';
import { startServer } from './server.mjs';

const TICK_MS = 1000;
const WATCHDOG_MS = 5 * 60 * 1000;
let timer;
let watchdogTimer;

async function init() {
  const lastStart = await recall('last_start');
  console.log(lastStart ? `Прошлый запуск: ${lastStart}` : 'первый запуск');
  await remember('last_start', new Date().toISOString());

  console.log('агент запущен');
  console.log('Запущен агент:', config.name);

  startTelegram(onTelegramMessage);
  startServer();
}

const taskQueue = ['/помощь', '/статус', 'просто текст'];

function listen() {
  return taskQueue.shift();
}

async function think(task) {
  return ask(task);
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
  try {
    const t = listen();
    if (!t) return;

    if (t.includes('запомни')) {
      await rememberFromTask(t);
      return;
    }

    act(t, await think(t));
  } finally {
    try {
      await remember('heartbeat', new Date().toISOString());
    } catch (err) {
      console.error('Ошибка записи heartbeat в Supabase:', err);
    }
  }
}

function shutdown() {
  clearInterval(timer);
  clearInterval(watchdogTimer);
  console.log('агент остановлен');
  process.exit(0);
}

function onTelegramMessage(text, chatId) {
  console.log(`[telegram] ${chatId}: ${text}`);
}

await init();
timer = setInterval(tick, TICK_MS);
watchdogTimer = setInterval(checkAgent, WATCHDOG_MS);
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
