import TelegramBot from 'node-telegram-bot-api';
import { PDFParse } from 'pdf-parse';
import { ask, fetchPageText, askWithImage } from './llm.mjs';

const DOCUMENT_TEXT_LIMIT = 5000;

export async function sendAlert(text) {
  const bot = new TelegramBot(process.env.TELEGRAM_TOKEN);
  await bot.sendMessage(process.env.TELEGRAM_CHAT_ID, text);
}

async function extractDocumentText(bot, msg) {
  const fileLink = await bot.getFileLink(msg.document.file_id);
  const response = await fetch(fileLink);
  const buffer = Buffer.from(await response.arrayBuffer());

  const fileName = (msg.document.file_name || '').toLowerCase();

  if (fileName.endsWith('.pdf')) {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    return result.text;
  }

  return buffer.toString('utf-8');
}

async function describeDocument(bot, msg) {
  const text = (await extractDocumentText(bot, msg)).slice(0, DOCUMENT_TEXT_LIMIT);

  const prompt = msg.caption
    ? `${msg.caption}\n\n${text}`
    : 'Перескажи суть этого документа:' + text;

  return ask(prompt);
}

async function describePhoto(bot, msg) {
  const largestPhoto = msg.photo[msg.photo.length - 1];
  const fileLink = await bot.getFileLink(largestPhoto.file_id);

  const response = await fetch(fileLink);
  const buffer = Buffer.from(await response.arrayBuffer());
  const imageDataUrl = `data:image/jpeg;base64,${buffer.toString('base64')}`;

  const prompt = msg.caption || 'Опиши что на этом изображении и извлеки любые текстовые данные';

  return askWithImage(prompt, imageDataUrl);
}

export function startTelegram(onMessage) {
  const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

  bot.on('photo', async (msg) => {
    console.log('получено фото');

    const chatId = msg.chat.id;
    onMessage(msg.caption || '[фото]', chatId);
    const answer = await describePhoto(bot, msg);
    await bot.sendMessage(chatId, answer);
  });

  bot.on('document', async (msg) => {
    const chatId = msg.chat.id;
    const fileName = msg.document.file_name || '';
    const lower = fileName.toLowerCase();

    if (!lower.endsWith('.txt') && !lower.endsWith('.pdf')) {
      await bot.sendMessage(chatId, 'Поддерживаются только файлы .txt и .pdf');
      return;
    }

    onMessage(msg.caption || `[документ] ${fileName}`, chatId);
    const answer = await describeDocument(bot, msg);
    await bot.sendMessage(chatId, answer);
  });

  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    if (msg.photo || msg.document) return;

    const text = msg.text;
    if (!text) return;

    onMessage(text, chatId);

    let answer;
    if (text.startsWith('http://') || text.startsWith('https://')) {
      const pageText = await fetchPageText(text);
      answer = await ask('Перескажи главное из этой страницы:' + pageText);
    } else {
      answer = await ask(text);
    }
    await bot.sendMessage(chatId, answer);
  });

  return bot;
}
