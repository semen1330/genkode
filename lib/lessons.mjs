import { supabase } from './memory.mjs';

export async function recordLesson(situation, lesson) {
  const { error } = await supabase
    .from('agent_lessons')
    .insert({ situation, lesson });

  if (error) throw error;
}

export async function loadLessons() {
  const { data, error } = await supabase
    .from('agent_lessons')
    .select('situation, lesson')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []).map(
    (row) => `помни: ${row.lesson} (ситуация: ${row.situation})`
  );
}
