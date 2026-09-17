function handleHelp() {
  return 'Доступные команды: /помощь, /статус';
}

function handleStatus() {
  return 'Агент работает нормально ✅';
}

function handleText(msg) {
  return 'Получил сообщение: ' + msg;
}

export function route(message) {
  if (message.startsWith('/помощь')) {
    return handleHelp();
  }
  if (message.startsWith('/статус')) {
    return handleStatus();
  }
  return handleText(message);
}
