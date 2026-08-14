// segment_range и элементы continuation_ranges бывают парой [start, end]
// или списком пар [[s1, e1], [s2, e2], ...] — прерывистая подсветка внутри строки.
// Пара [-1, -1] (пропуск строки в continuation_ranges) проходит через эти
// функции без особых случаев: ни один сегмент в неё не попадает.

export function normRanges(r) {
  if (!r) return null
  return Array.isArray(r[0]) ? r : [r]
}

export function inRanges(i, r) {
  const ranges = normRanges(r)
  return !!ranges && ranges.some(([s, e]) => i >= s && i <= e)
}

export function lastEnd(r) {
  const ranges = normRanges(r)
  return ranges ? ranges[ranges.length - 1][1] : null
}

export function sliceRanges(arr, r) {
  const ranges = normRanges(r)
  if (!ranges) return []
  return ranges.flatMap(([s, e]) => arr.slice(s, e + 1))
}
