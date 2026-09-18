import TelegramBot from 'node-telegram-bot-api';
import { ask } from './llm.mjs';

export async function sendAlert(text) {
  const bot = new TelegramBot(process.env.TELEGRAM_TOKEN);
  await bot.sendMessage(process.env.TELEGRAM_CHAT_ID, text);
}

export function startTelegram(onMessage) {
  const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

  bot.on('message', async (msg) => {
    const text = msg.text;
    const chatId = msg.chat.id;
    if (!text) return;

    onMessage(text, chatId);

    const answer = await ask(text);
    await bot.sendMessage(chatId, answer);
  });

  return bot;
}
