#!/usr/bin/env node
// Проверка живости и встраиваемости YouTube-роликов через oEmbed (0 токенов).
// Использование: node yt-check.js <videoId> [videoId...]
// oEmbed: 200 — жив и встраиваем; 401 — встраивание запрещено; 403 — приватный; 404 — удалён.

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function check(id) {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return { id, ok: false, status: res.status };
    const j = await res.json();
    return { id, ok: true, status: 200, title: j.title, channel: j.author_name, channel_url: j.author_url };
  } catch (e) {
    return { id, ok: false, status: 0, error: e.message };
  }
}

async function main() {
  const ids = process.argv.slice(2);
  if (!ids.length) { console.error('usage: yt-check.js <videoId>...'); process.exit(1); }
  const out = [];
  for (const id of ids) {
    out.push(await check(id));
    await sleep(300);
  }
  console.log(JSON.stringify(out, null, 1));
  if (out.some((r) => !r.ok)) process.exit(2);
}

main();
