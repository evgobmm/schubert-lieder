<script setup>
import { computed } from 'vue'
import { tokenizeLine, normWord } from '../utils/lineTokens.js'

// Строка немецкого текста, разбитая на слова: пропеваемое слово подсвечивается,
// клик по слову (когда в плеере запись с таймингами) — переход записи на него.
const props = defineProps({
  text: { type: String, default: '' },
  // {before, main, variant, after} из getLineDeParts — надстроенный вариант слова, либо null
  variant: { type: Object, default: null },
  // Номер подсвечиваемого слова (по пробелам) или -1
  activeWord: { type: Number, default: -1 },
  clickable: { type: Boolean, default: false },
  // Слова, спетые в текущей записи иначе, чем в тексте: {номер слова: спетое слово} (variants файла таймингов)
  sungWords: { type: Object, default: null }
})

const emit = defineEmits(['wordClick'])

const tokens = computed(() => tokenizeLine(props.text, props.variant))

// Этаж над словом: редакторский вариант (variant_de из данных песни) и/или спетое в этой записи слово (variants файла таймингов).
// Как в «Erstarrung»: вариант исполнения стоит отдельным этажом и подсвечивается, когда в данный момент исполняется.
function tierOf(t) {
  const heard = props.sungWords && props.sungWords[t.word] != null ? String(props.sungWords[t.word]) : null
  const ed = t.variant || null
  if (heard) {
    if (ed && normWord(heard) === normWord(ed.variant)) return { word: ed.variant, prefix: ed.prefix, main: ed.main, suffix: ed.suffix, sung: true, perf: false }
    return { word: heard, prefix: '', main: t.text, suffix: '', sung: true, perf: true }
  }
  if (ed) return { word: ed.variant, prefix: ed.prefix, main: ed.main, suffix: ed.suffix, sung: false, perf: false }
  return { word: null, sung: false, perf: false }
}

const hasTier = computed(() => tokens.value.some(t => t.variant) || (props.sungWords && Object.keys(props.sungWords).length > 0))

function onClick(word) {
  if (props.clickable && word >= 0) emit('wordClick', word)
}
</script>

<template>
  <p class="line-de" lang="de" :class="{ 'sync-clickable': clickable, 'has-tier': hasTier }">
    <template v-for="(t, i) in tokens" :key="i">
      <span
        v-if="t.word >= 0"
        class="w"
        :class="{ sung: t.word === activeWord && !tierOf(t).sung, 'sung-under-tier': t.word === activeWord && tierOf(t).sung }"
        @click="onClick(t.word)"
      ><template v-if="tierOf(t).word">{{ tierOf(t).prefix }}<span class="de-variant-stack"><span
            class="de-variant-word"
            :class="{ 'tier-sung': t.word === activeWord && tierOf(t).sung, 'tier-perf': tierOf(t).perf }"
            :title="tierOf(t).perf ? 'так поётся в этой записи' : ''"
          >{{ tierOf(t).word }}&nbsp;</span><span>{{ tierOf(t).main }}</span></span>{{ tierOf(t).suffix }}</template><template v-else>{{ t.text }}</template></span>
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

/* строка с этажом (редакторский вариант или спетое слово) — место над строкой */
.line-de.has-tier {
  padding-top: 1.25em;
}

.de-variant-word.tier-perf {
  color: var(--text);
  opacity: 0.85;
}

/* соседние этажи (перестановка нескольких слов) не слипаются: у этажа есть правый отступ и фон под ним */
.de-variant-word {
  padding-right: 0.3em;
  background: var(--bg, transparent);
}

/* этаж исполняется в данный момент — подсвечен он, а не слово текста */
.de-variant-word.tier-sung {
  background: var(--highlight-sung);
  box-shadow: 0 0 0 2px var(--highlight-sung);
  border-radius: 3px;
}

.w.sung-under-tier {
  background: none;
  box-shadow: none;
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
