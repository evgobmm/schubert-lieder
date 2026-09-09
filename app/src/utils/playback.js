import { reactive } from 'vue'

// Состояние проигрывания записи — общее для плеера (PerformancePlayer) и страницы песни (SongView).
// Плеер пишет позицию и статус, страница по ним подсвечивает пропеваемое слово
// и по клику на слово просит перемотать запись (docs/rules/word-sync.md).
const HIGHLIGHT_KEY = 'wordHighlight'

function storedHighlight() {
  try { return localStorage.getItem(HIGHLIGHT_KEY) !== 'off' } catch (e) { return true }
}

export const playback = reactive({
  videoId: null,   // запись, загруженная в плеер (null — плеер закрыт или API недоступен)
  status: 'idle',  // idle | playing | paused | ended
  time: 0,         // текущая позиция записи, с
  highlight: storedHighlight()  // подсвечивать слова по ходу исполнения (галочка под плеером; по умолчанию да)
})

// Галочка «Подсвечивать слова по ходу исполнения»: выбор запоминается в браузере
export function setHighlight(on) {
  playback.highlight = !!on
  try { localStorage.setItem(HIGHLIGHT_KEY, on ? 'on' : 'off') } catch (e) { /* приватный режим и т. п. */ }
}

let seekHandler = null

export function registerSeek(fn) {
  seekHandler = fn
}

export function unregisterSeek(fn) {
  if (seekHandler === fn) seekHandler = null
}

// Перемотать запись на позицию t (с) и продолжить воспроизведение
export function seekTo(t) {
  if (seekHandler) seekHandler(Math.max(0, t))
}

if (import.meta.env.DEV) {
  // Отладочный доступ из консоли (только dev-сборка)
  window.__playback = { state: playback, registerSeek, seekTo, setHighlight }
}
