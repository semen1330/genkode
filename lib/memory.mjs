import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

try {
  process.loadEnvFile();
} catch {
  // .env отсутствует — переменные окружения должны быть заданы иначе
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
  realtime: { transport: ws },
});

export async function remember(key, value) {
  const { error } = await supabase
    .from('agent_memory')
    .upsert({ key, value }, { onConflict: 'key' });

  if (error) throw error;
}

export async function recall(key) {
  const { data, error } = await supabase
    .from('agent_memory')
    .select('value')
    .eq('key', key)
    .maybeSingle();

  if (error) throw error;
  return data ? data.value : null;
}
