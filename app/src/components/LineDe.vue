<script setup>
import { computed } from 'vue'
import { tokenizeLine } from '../utils/lineTokens.js'

// Строка немецкого текста, разбитая на слова: пропеваемое слово подсвечивается,
// клик по слову (когда в плеере запись с таймингами) — переход записи на него.
const props = defineProps({
  text: { type: String, default: '' },
  // {before, main, variant, after} из getLineDeParts — надстроенный вариант слова, либо null
  variant: { type: Object, default: null },
  // Номер подсвечиваемого слова (по пробелам) или -1
  activeWord: { type: Number, default: -1 },
  clickable: { type: Boolean, default: false }
})

const emit = defineEmits(['wordClick'])

const tokens = computed(() => tokenizeLine(props.text, props.variant))

function onClick(word) {
  if (props.clickable && word >= 0) emit('wordClick', word)
}
</script>

<template>
  <p class="line-de" :class="{ 'sync-clickable': clickable }">
    <template v-for="(t, i) in tokens" :key="i">
      <span
        v-if="t.word >= 0"
        class="w"
        :class="{ sung: t.word === activeWord }"
        @click="onClick(t.word)"
      ><template v-if="t.variant">{{ t.variant.prefix }}<span class="de-variant-stack"><span class="de-variant-word">{{ t.variant.variant }}</span><span>{{ t.variant.main }}</span></span>{{ t.variant.suffix }}</template><template v-else>{{ t.text }}</template></span>
      <template v-else>{{ t.text }}</template>
    </template>
  </p>
</template>

<style scoped>
.line-de {
  font-family: var(--font-de);
  font-style: italic;
  color: var(--text);
  line-height: 1.5;
}

.de-variant-stack {
  position: relative;
  display: inline;
}

.de-variant-word {
  position: absolute;
  bottom: 100%;
  left: 0;
  white-space: nowrap;
}

.w {
  border-radius: 3px;
  transition: background-color 0.1s, box-shadow 0.1s;
}

.sync-clickable .w {
  cursor: pointer;
}

@media (hover: hover) {
  .sync-clickable .w:hover {
    background: var(--highlight);
    box-shadow: 0 0 0 2px var(--highlight);
  }
}

/* Пропеваемое слово: фон с небольшим «воздухом» вокруг, без сдвига строки */
.w.sung,
.sync-clickable .w.sung:hover {
  background: var(--highlight-sung);
  box-shadow: 0 0 0 2px var(--highlight-sung);
}

@media print {
  .w.sung {
    background: none;
    box-shadow: none;
  }
}
</style>
