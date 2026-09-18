import { execSync } from 'node:child_process';
import { recall } from './memory.mjs';
import { sendAlert } from './tg.mjs';

const STALE_MS = 10 * 60 * 1000;
const PM2_PROCESS_NAME = 'moy-agent';

export async function checkAgent() {
  try {
    const heartbeat = await recall('heartbeat');

    if (!heartbeat) {
      console.warn('nadzor: heartbeat в agent_memory не найден');
      return;
    }

    const ageMs = Date.now() - new Date(heartbeat).getTime();

    if (ageMs <= STALE_MS) {
      console.log('пульс в норме');
      return;
    }

    console.warn(`nadzor: heartbeat устарел (${Math.round(ageMs / 1000)} сек) — перезапускаю ${PM2_PROCESS_NAME}`);
    execSync(`pm2 restart ${PM2_PROCESS_NAME}`);
    await sendAlert('⚠️ moy-agent завис — перезапущен автоматически');
  } catch (err) {
    console.error('nadzor: ошибка проверки heartbeat:', err);
  }
}
