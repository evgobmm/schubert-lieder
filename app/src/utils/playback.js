import { reactive } from 'vue'

// Состояние проигрывания записи — общее для плеера (PerformancePlayer) и страницы песни (SongView).
// Плеер пишет позицию и статус, страница по ним подсвечивает пропеваемое слово
// и по клику на слово просит перемотать запись (docs/rules/word-sync.md).
export const playback = reactive({
  videoId: null,   // запись, загруженная в плеер (null — плеер закрыт или API недоступен)
  status: 'idle',  // idle | playing | paused | ended
  time: 0          // текущая позиция записи, с
})

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
  window.__playback = { state: playback, registerSeek, seekTo }
}
