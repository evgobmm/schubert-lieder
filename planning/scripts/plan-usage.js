#!/usr/bin/env node
// Реальные проценты лимитов тарифа (0 токенов модели): node planning/scripts/plan-usage.js [--json]
// Берёт OAuth-токен Claude Code из ~/.claude/.credentials.json и спрашивает у Anthropic /api/oauth/usage.
// Токен НИКОГДА не печатается и никуда не пишется — только заголовок запроса.
// Печатает: текущее пятичасовое окно, недельный пул «все модели», недельный пул Opus/Fable и времена сброса.
const fs = require('fs');
const os = require('os');
const path = require('path');

const credPath = path.join(os.homedir(), '.claude', '.credentials.json');
if (!fs.existsSync(credPath)) { console.error('нет ~/.claude/.credentials.json — Claude Code не авторизован'); process.exit(2); }
let token;
try { token = JSON.parse(fs.readFileSync(credPath, 'utf8')).claudeAiOauth.accessToken; } catch { console.error('не разобрать .credentials.json'); process.exit(2); }
if (!token) { console.error('в .credentials.json нет accessToken'); process.exit(2); }

const pct = (u) => {
  if (u == null) return null;
  const n = Number(u);
  if (!isFinite(n)) return null;
  return n <= 1 ? Math.round(n * 1000) / 10 : Math.round(n * 10) / 10;
};
const when = (v) => {
  if (v == null) return '—';
  const n = Number(v);
  const ms = !isFinite(n) ? Date.parse(v) : (n > 1e12 ? n : n * 1000);
  if (!isFinite(ms)) return String(v);
  const d = new Date(ms);
  const left = Math.max(0, ms - Date.now());
  const h = Math.floor(left / 3600000), m = Math.round((left % 3600000) / 60000);
  return `${d.toISOString().slice(11, 16)} UTC (через ${h} ч ${m} мин)`;
};
// поле процента может называться по-разному в разных версиях ответа
const findPct = (o) => {
  if (!o || typeof o !== 'object') return null;
  for (const k of ['utilization', 'used_percent', 'usedPercent', 'percent_used', 'percentUsed', 'percent', 'used']) {
    if (o[k] != null) return pct(o[k]);
  }
  return null;
};
const findReset = (o) => {
  if (!o || typeof o !== 'object') return null;
  for (const k of ['resets_at', 'resetsAt', 'reset_at', 'resetAt', 'resets', 'next_reset']) if (o[k] != null) return o[k];
  return null;
};

(async () => {
  let r;
  try {
    r = await fetch('https://api.anthropic.com/api/oauth/usage', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'anthropic-beta': 'oauth-2025-04-20',
        'User-Agent': 'claude-code-usage-check',
      },
    });
  } catch (e) { console.error('сеть недоступна:', e.message); process.exit(3); }
  if (!r.ok) { console.error(`ответ ${r.status} ${r.statusText}`); process.exit(3); }
  const j = await r.json();
  if (process.argv.includes('--json')) { console.log(JSON.stringify(j, null, 1)); return; }

  const NAMES = {
    five_hour: 'Сессия (5 ч)', seven_day: 'Неделя, все модели', seven_day_opus: 'Неделя, Opus/Fable',
    seven_day_sonnet: 'Неделя, Sonnet', seven_day_oauth_apps: 'Неделя, приложения',
  };
  const rows = [];
  // показываем ВСЕ пулы с ненулевым процентом — имена служебных пулов меняются между версиями
  for (const [k, v] of Object.entries(j)) {
    if (!v || typeof v !== 'object') continue;
    const p = findPct(v);
    if (p == null) continue;
    rows.push([NAMES[k] || k, p, when(findReset(v))]);
  }
  if (!rows.length) { console.log('структура ответа незнакомая, показываю как есть:'); console.log(JSON.stringify(j, null, 1).slice(0, 2000)); return; }
  const w = Math.max(...rows.map((x) => x[0].length));
  for (const [name, p, reset] of rows) console.log(`${name.padEnd(w)}  ${String(p).padStart(5)} %   сброс ${reset}`);
})();
