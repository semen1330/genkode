import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://api.polza.ai/api/v1',
  apiKey: process.env.POLZA_API_KEY,
});

export async function ask(prompt) {
  const completion = await client.chat.completions.create({
    model: 'qwen/qwen3.8-max',
    messages: [{ role: 'user', content: prompt }],
  });

  return completion.choices[0].message.content;
}
