import express from 'express';
import { ask } from './lib/llm.mjs';

const PORT = process.env.PORT || 3000;

async function think(text) {
  return ask(text);
}

export function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', ts: Date.now() });
  });

  app.post('/task', async (req, res) => {
    const { text } = req.body || {};
    if (!text) {
      res.status(400).json({ error: 'text is required' });
      return;
    }

    try {
      const result = await think(text);
      res.json({ result });
    } catch (err) {
      console.error('Ошибка в /task:', err);
      res.status(500).json({ error: 'internal error' });
    }
  });

  return app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
  });
}
