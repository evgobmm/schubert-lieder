// Рендер текста аннотаций с поддержкой курсива через *звёздочки*.
// HTML экранируется, затем *...* превращается в <em>...</em>.
// Используется с v-html — безопасно, т.к. сначала экранируем все спецсимволы.
export function renderText(text) {
  const escaped = (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return escaped.replace(/\*([^*]+)\*/g, '<em>$1</em>')
}
