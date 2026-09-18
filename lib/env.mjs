try {
  process.loadEnvFile();
} catch {
  // .env отсутствует — переменные окружения должны быть заданы иначе
}
