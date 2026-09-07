// Разбиение немецкой строки на слова (для подсветки пропеваемого слова)
// и сопоставление её слов с сегментами подстрочника.

// Токены строки: слова (word — порядковый номер по пробелам, как нумерует слова файл
// таймингов) и пробельные промежутки (word = -1). Конкатенация токенов даёт исходный текст.
// variant — {before, main, variant} (см. getLineDeParts в SongView): над словом main
// надстраивается вариант; main всегда лежит внутри одного токена.
export function tokenizeLine(text, variant) {
  const tokens = []
  if (!text) return tokens
  const re = /\s+|\S+/g
  const vStart = variant ? variant.before.length : -1
  const vEnd = variant ? vStart + variant.main.length : -1
  let word = 0
  let m
  while ((m = re.exec(text)) !== null) {
    const tok = m[0]
    const at = m.index
    if (/\s/.test(tok[0])) {
      tokens.push({ text: tok, word: -1 })
      continue
    }
    const t = { text: tok, word: word++ }
    if (variant && vStart >= at && vEnd <= at + tok.length) {
      t.variant = {
        prefix: tok.slice(0, vStart - at),
        main: variant.main,
        variant: variant.variant,
        suffix: tok.slice(vEnd - at)
      }
    }
    tokens.push(t)
  }
  return tokens
}

function norm(w) {
  return w.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')
}

// Для каждого слова строки — индекс сегмента подстрочника, в чьём de оно стоит (или -1).
// Сегменты идут в порядке русского текста; «Ist... vergällt» — разрывный сегмент из двух слов.
// Одинаковые слова разбираются по порядку: первое незанятое совпадение.
export function mapWordsToSegments(lineDe, segments) {
  const words = String(lineDe || '').split(/\s+/).filter(Boolean).map(norm)
  const map = new Array(words.length).fill(-1)
  if (!Array.isArray(segments)) return map
  segments.forEach((seg, si) => {
    const de = String(seg.de || '').replace(/(\.\.\.|…)/g, ' ')
    for (const part of de.split(/\s+/)) {
      const n = norm(part)
      if (!n) continue
      const wi = words.findIndex((w, i) => map[i] === -1 && w === n)
      if (wi >= 0) map[wi] = si
    }
  })
  return map
}
