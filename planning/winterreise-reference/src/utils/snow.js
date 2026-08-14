import { ref, watch } from 'vue'

// Режим «Зима»: холодная палитра фона + снег/метель.
// Состояние запоминается в localStorage (как тема). По умолчанию — выключено.
localStorage.removeItem('snow') // чистим устаревший ключ прежней версии (просто снег)

export const winterEnabled = ref(localStorage.getItem('winter') === '1')

function apply(v) {
  document.documentElement.setAttribute('data-season', v ? 'winter' : 'none')
}

// Применяем сразу при загрузке модуля, чтобы палитра встала до отрисовки.
apply(winterEnabled.value)

watch(winterEnabled, (v) => {
  localStorage.setItem('winter', v ? '1' : '0')
  apply(v)
})

export function toggleWinter() {
  winterEnabled.value = !winterEnabled.value
}
