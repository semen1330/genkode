import dns from 'node:dns';

try {
  process.loadEnvFile();
} catch {
  // .env отсутствует — переменные окружения должны быть заданы иначе
}

// На этом сервере нет рабочего маршрута IPv6, а DNS всё равно отдаёт AAAA-записи
// для api.telegram.org — из-за этого fetch() периодически пытается подключиться
// по IPv6 и вываливается по таймауту. Форсируем IPv4.
dns.setDefaultResultOrder('ipv4first');
