// Поисковый индекс: строки текста каждой песни, у которой есть файл.
// Файлы песен уже входят в бандл (eager-глоб в SongView) — дублирования нет.
const songModules = import.meta.glob('../data/songs/*.json', { eager: true })

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

const textCache = new Map()

// Все строки песни (немецкие; для переведённых — и русские) одним массивом
export function songLines(file) {
  if (textCache.has(file)) return textCache.get(file)
  const mod = songModules[`../data/songs/${file}`]
  const lines = []
  if (mod) {
    const song = mod.default
    for (const stanza of song.stanzas || []) {
      for (const de of stanza.lines_de || []) lines.push(de)
      for (const ru of stanza.lines_ru || []) {
        if (ru && ru.segments) lines.push(ru.segments.map(s => s.ru).join(' '))
      }
    }
  }
  const entry = lines.map(text => ({ text, folded: fold(text) }))
  textCache.set(file, entry)
  return entry
}

// Поиск: сначала названия (de + ru); если пусто — по тексту песен.
// Возвращает { mode: 'title'|'text'|null, hits: [{ song, line? }] }
export function searchSongs(songsIndex, query) {
  const q = fold(query.trim())
  if (q.length < 2) return { mode: null, hits: [] }

  const titleHits = songsIndex.filter(s =>
    fold(s.title_de).includes(q) || (s.title_ru && fold(s.title_ru).includes(q))
  )
  if (titleHits.length) return { mode: 'title', hits: titleHits.map(song => ({ song })) }

  const textHits = []
  for (const song of songsIndex) {
    if (!song.file) continue
    const line = songLines(song.file).find(l => l.folded.includes(q))
    if (line) textHits.push({ song, line: line.text })
  }
  return { mode: 'text', hits: textHits }
}
