import TelegramBot from 'node-telegram-bot-api';
import { PDFParse } from 'pdf-parse';
import { ask, fetchPageText, askWithImage } from './llm.mjs';

const DOCUMENT_TEXT_LIMIT = 5000;
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry(fn, attempts = RETRY_ATTEMPTS) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.error(`попытка ${i + 1}/${attempts} не удалась: ${error.message}`);
      if (i < attempts - 1) await sleep(RETRY_DELAY_MS * (i + 1));
    }
  }
  throw lastError;
}

async function fetchFileBuffer(bot, fileId) {
  return withRetry(async () => {
    const fileLink = await bot.getFileLink(fileId);
    const response = await fetch(fileLink, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`не удалось скачать файл: HTTP ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  });
}

export async function sendAlert(text) {
  const bot = new TelegramBot(process.env.TELEGRAM_TOKEN);
  await bot.sendMessage(process.env.TELEGRAM_CHAT_ID, text);
}

async function extractDocumentText(bot, msg) {
  const buffer = await fetchFileBuffer(bot, msg.document.file_id);

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
  const buffer = await fetchFileBuffer(bot, largestPhoto.file_id);
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

    try {
      const answer = await describePhoto(bot, msg);
      await bot.sendMessage(chatId, answer);
    } catch (error) {
      console.error('ошибка обработки фото:', error);
      await bot.sendMessage(chatId, 'Не получилось обработать фото, попробуйте ещё раз.');
    }
  });

  bot.on('document', async (msg) => {
    console.log('получен документ');

    const chatId = msg.chat.id;
    const fileName = msg.document.file_name || '';
    const lower = fileName.toLowerCase();

    if (!lower.endsWith('.txt') && !lower.endsWith('.pdf')) {
      await bot.sendMessage(chatId, 'Поддерживаются только файлы .txt и .pdf');
      return;
    }

    onMessage(msg.caption || `[документ] ${fileName}`, chatId);

    try {
      const answer = await describeDocument(bot, msg);
      await bot.sendMessage(chatId, answer);
    } catch (error) {
      console.error('ошибка обработки документа:', error);
      await bot.sendMessage(chatId, 'Не получилось обработать файл, попробуйте ещё раз.');
    }
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
