import OpenAI from 'openai';
import { loadLessons } from './lessons.mjs';

const client = new OpenAI({
  baseURL: 'https://api.polza.ai/api/v1',
  apiKey: process.env.POLZA_API_KEY,
});

const MODEL = 'qwen/qwen3.8-max';

async function buildSystemPrompt() {
  let systemPrompt = 'Отвечай только на русском языке.';

  const rules = await loadLessons();
  if (rules.length > 0) {
    systemPrompt = rules.join('\n') + '\n\n' + systemPrompt;
  }

  return systemPrompt;
}

export async function ask(prompt) {
  const systemPrompt = await buildSystemPrompt();

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
  });

  return completion.choices[0].message.content;
}

export async function askWithImage(prompt, imageDataUrl) {
  const systemPrompt = await buildSystemPrompt();

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageDataUrl } },
        ],
      },
    ],
  });

  return completion.choices[0].message.content;
}

export async function fetchPageText(url) {
  const response = await fetch(url);
  const html = await response.text();

  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  return text.slice(0, 4000);
}
