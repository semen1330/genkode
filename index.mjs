const TICK_MS = 1000;
let timer;

function init() {
  console.log('агент запущен');
}

const taskQueue = [
  'привет, как дела?',
  'подготовь отчет за неделю',
  'скажи привет коллеге',
  'почисти базу данных',
];

function listen() {
  return taskQueue.shift();
}

function think(task) {
  if (task.toLowerCase().includes('привет')) {
    return 'Привет!';
  }
  return `Принял задачу: ${task}`;
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
