import { ref } from 'vue'

// Поисковый индекс: названия из каталога (index.json, в бандле) и строки текста каждой песни.
// Строки текста живут в отдельном модуле virtual:search-text (его собирает vite.config.js
// из файлов песен) и подгружаются только при первом поиске по тексту: файлы песен в
// основной бандл больше не входят. Пока модуль не пришёл, поиск по тексту отвечает
// { pending: true }; textIndexReady переключается, и вызывающие перезапускают поиск.
let textMap = null
let textLoading = null
export const textIndexReady = ref(false)

function loadTextIndex() {
  if (!textLoading) {
    textLoading = import('virtual:search-text').then(m => {
      textMap = m.default
      textIndexReady.value = true
    })
  }
  return textLoading
}

// Нормализация для поиска: регистр, немецкие умляуты/ß, ударения,
// типографские апострофы — чтобы «trane» находило «Träne», а «hab'» — «hab’»
export function fold(s) {
  return s
    .toLowerCase()
    .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss')
    .replace(/ё/g, 'е')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[’‘`]/g, "'")
}

// Посимвольная нормализация с картой «символ свёрнутой строки → индекс в исходной»:
// нужна, чтобы подсветить найденный фрагмент в исходном написании (ß → ss меняет длину)
const charCache = new Map()

function foldChar(ch) {
  let f = charCache.get(ch)
  if (f === undefined) {
    f = fold(ch)
    charCache.set(ch, f)
  }
  return f
}

export function findRange(text, q) {
  if (!text || !q) return null
  let folded = ''
  const map = []
  for (let i = 0; i < text.length; i++) {
    const f = foldChar(text[i])
    for (let k = 0; k < f.length; k++) map.push(i)
    folded += f
  }
  const at = folded.indexOf(q)
  if (at < 0) return null
  return [map[at], map[at + q.length - 1] + 1]
}

const textCache = new Map()

// Все строки песни (немецкие; для переведённых — и русские) одним массивом
export function songLines(file) {
  if (!textMap) return []
  if (textCache.has(file)) return textCache.get(file)
  const lines = textMap[file] || []
  const entry = lines.map(text => ({ text, folded: fold(text) }))
  textCache.set(file, entry)
  return entry
}

// Запрос как номер по Дойчу: «118», «d 118», «D118», «795/1», «795.1», «965a» → «118», «795/1», «965a»
function dQuery(raw) {
  const m = raw.toLowerCase().match(/^d?\s*(\d{1,4}[a-z]?)(?:[/.](\d{1,2}))?$/)
  if (!m) return null
  return m[2] ? `${m[1]}/${m[2]}` : m[1]
}

// Ранг совпадения в названии: 0 — целиком, 1 — с начала, 2 — с начала слова, 3 — внутри слова; 4 — совпало имя поэта
function titleScore(folded, q) {
  const at = folded.indexOf(q)
  if (at < 0) return null
  if (folded === q) return 0
  if (at === 0) return 1
  if (/[^a-z0-9а-я']/.test(folded[at - 1])) return 2
  return 3
}

// Поиск: сначала названия (de + ru) и D-номера; если пусто — по тексту песен.
// Результат: { mode: 'title'|'text'|null, hits: [{ song, score, de, ru, d, line? }] },
// где de/ru — диапазон [от, до) совпадения в названии (для подсветки) либо null,
// d — совпал номер по Дойчу, line — { text, range } найденной строки текста.
export function searchSongs(songsIndex, query) {
  const raw = query.trim()
  const q = fold(raw)
  const dq = dQuery(raw)
  const byTitle = q.length >= 2
  if (!byTitle && !dq) return { mode: null, hits: [] }

  const hits = []
  for (const song of songsIndex) {
    let score = null
    const d = !!dq && song.d.toLowerCase() === dq
    if (d) score = -1
    if (byTitle) {
      const sd = titleScore(fold(song.title_de), q)
      const sr = song.title_ru ? titleScore(fold(song.title_ru), q) : null
      for (const s of [sd, sr]) if (s !== null && (score === null || s < score)) score = s
      // Имя поэта (русское или немецкое) — после всех совпадений в названиях: «Шиллер» показывает его песни
      if (score === null && [song.poet_ru, song.poet_de].some(p => p && fold(p).includes(q))) score = 4
    }
    if (score === null) continue
    hits.push({
      song,
      score,
      d,
      de: byTitle ? findRange(song.title_de, q) : null,
      ru: byTitle && song.title_ru ? findRange(song.title_ru, q) : null
    })
  }
  if (hits.length) {
    hits.sort((a, b) => a.score - b.score || a.song.number - b.song.number)
    return { mode: 'title', hits }
  }
  if (!byTitle) return { mode: 'title', hits: [] }
  if (!textMap) {
    loadTextIndex()
    return { mode: 'text', hits: [], pending: true }
  }

  const textHits = []
  for (const song of songsIndex) {
    if (!song.file) continue
    const line = songLines(song.file).find(l => l.folded.includes(q))
    if (line) {
      textHits.push({ song, score: 4, d: false, de: null, ru: null, line: { text: line.text, range: findRange(line.text, q) } })
    }
  }
  return { mode: 'text', hits: textHits }
}

// Русское число с существительным: plural(3, 'песня', 'песни', 'песен') → «3 песни»
export function plural(n, one, few, many) {
  const m10 = n % 10
  const m100 = n % 100
  const word = m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many
  return `${n} ${word}`
}
