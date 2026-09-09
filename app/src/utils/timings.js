// Пословные тайминги под конкретные записи: app/src/data/timings/d<D>-<videoId>.json
// (формат — docs/rules/word-sync.md). Ключ — пара (D-номер, videoId): тайминги
// действительны только для той записи, по которой считались.
// Файлы грузятся лениво (по одному, когда запись выбрана в плеере): их 2400+, ~22 МБ, и жадный
// import.meta.glob вкладывал их все в бандл (17 МБ на каждого посетителя, сборка падала по памяти).
const loaders = import.meta.glob('../data/timings/*.json')

// Индекс по имени файла: d<prefix>-<videoId>.json, videoId — всегда 11 знаков; в prefix дефис = «/» в D-номере
const byKey = new Map()   // `${d}|${videoId}` -> путь модуля
const byD = new Map()     // d -> [videoId…] в порядке файлов
for (const path of Object.keys(loaders).sort()) {
  const name = path.slice(path.lastIndexOf('/') + 1, -'.json'.length)
  if (name.length < 13 || name[name.length - 12] !== '-') continue
  const videoId = name.slice(-11)
  const d = name.slice(1, -12).replace(/-/g, '/')
  byKey.set(`${d}|${videoId}`, path)
  if (!byD.has(d)) byD.set(d, [])
  byD.get(d).push(videoId)
}

const cache = new Map()
// Тайминги записи (Promise; null — файла нет или он невалиден)
export function getTiming(d, videoId) {
  if (!d || !videoId) return Promise.resolve(null)
  const key = `${d}|${videoId}`
  const path = byKey.get(key)
  if (!path) return Promise.resolve(null)
  if (!cache.has(key)) {
    cache.set(key, loaders[path]().then((mod) => {
      const t = mod.default || mod
      return t && t.d && t.videoId && Array.isArray(t.route) ? t : null
    }).catch(() => null))
  }
  return cache.get(key)
}

// Записи песни, для которых есть тайминги (в порядке файлов)
export function syncedVideoIds(d) {
  return byD.get(d) || []
}

// Паузу между словами короче этого порога закрывает предыдущее слово — подсветка
// не мигает между словами одной фразы; более длинная пауза (вздох, интерлюдия)
// остаётся без подсветки.
export const GAP_BRIDGE = 1.0

// Плоский список слов маршрута в порядке звучания. Слово: {start, end, until, s, l, k};
// s/l — строфа и строка текста (−1 у строк вне текста, см. extra_lines), k — номер слова
// в строке по пробелам, until — момент снятия подсветки (конец слова либо начало следующего).
export function buildWordIndex(timing) {
  const words = []
  for (const pass of timing.route || []) {
    if (!Array.isArray(pass.w)) continue
    const s = Number.isInteger(pass.s) ? pass.s : -1
    const l = Number.isInteger(pass.l) ? pass.l : -1
    pass.w.forEach((iv, k) => {
      if (!Array.isArray(iv) || iv.length < 2) return
      const start = Number(iv[0])
      const end = Number(iv[1])
      if (!Number.isFinite(start) || !Number.isFinite(end)) return
      words.push({ start, end: Math.max(end, start), s, l, k, until: 0 })
    })
  }
  words.sort((a, b) => a.start - b.start)
  for (let i = 0; i < words.length; i++) {
    const w = words[i]
    const next = words[i + 1]
    let until = w.end
    if (next) {
      if (next.start - w.end <= GAP_BRIDGE) until = next.start
      until = Math.min(until, next.start)
    }
    w.until = Math.max(until, w.start)
  }
  return words
}

// Слово, звучащее в момент t, или null (пауза, интерлюдия, до начала пения)
export function findWordAt(words, t) {
  if (!words || !words.length) return null
  let lo = 0
  let hi = words.length - 1
  let found = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (words[mid].start <= t) {
      found = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  if (found < 0) return null
  const w = words[found]
  return t < w.until ? w : null
}

// Начало слова k строки (s, l). Если строка спета несколько раз — проход,
// ближайший по времени к текущей позиции now.
export function findWordStart(words, s, l, k, now) {
  let best = null
  for (const w of words) {
    if (w.s !== s || w.l !== l || w.k !== k) continue
    if (!best || Math.abs(w.start - now) < Math.abs(best.start - now)) best = w
  }
  return best ? best.start : null
}
