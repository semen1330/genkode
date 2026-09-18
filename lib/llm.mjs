import OpenAI from 'openai';
import { loadLessons } from './lessons.mjs';

const client = new OpenAI({
  baseURL: 'https://api.polza.ai/api/v1',
  apiKey: process.env.POLZA_API_KEY,
});

export async function ask(prompt) {
  let systemPrompt = 'Отвечай только на русском языке.';

  const rules = await loadLessons();
  if (rules.length > 0) {
    systemPrompt = rules.join('\n') + '\n\n' + systemPrompt;
  }

  const completion = await client.chat.completions.create({
    model: 'qwen/qwen3.8-max',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
  });

  return completion.choices[0].message.content;
}
