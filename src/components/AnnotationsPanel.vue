<script setup>
import { renderText } from '../utils/renderText.js'

defineProps({
  annotations: Array,
  type: String,
  title: String
})

// Клик по аннотации в панели → прокрутка к соответствующему месту в переводе
defineEmits(['goto'])

</script>

<template>
  <section class="annotations-panel" :class="'apanel-' + type">
    <h3 :class="'panel-title-' + type">{{ title }}</h3>
    <div
      v-for="ann in annotations"
      :key="ann.index"
      class="annotation-item"
    >
      <sup
        class="annotation-index"
        :class="'index-' + type"
        role="button"
        tabindex="0"
        title="Перейти к месту в переводе"
        @click="$emit('goto', ann.key)"
        @keydown.enter="$emit('goto', ann.key)"
      >{{ ann.index }}</sup>
      <span class="annotation-ref">
        {{ ann.segments.map(s => ann.target === 'variant' ? (s.variant_ru || s.ru) : s.ru).join(' ') }}
      </span>
      <span class="annotation-sep"> || </span>
      <span class="annotation-text" v-html="renderText(ann.text)"></span>
    </div>
  </section>
</template>

<style scoped>
.annotations-panel h3 {
  font-size: 1rem;
  margin-bottom: 16px;
  font-weight: normal;
}

.panel-title-lang {
  color: var(--color-lang);
}

.panel-title-meaning {
  color: var(--color-meaning);
}

.annotation-item {
  margin-bottom: 10px;
  font-size: 0.9rem;
  line-height: 1.5;
}

/* Кликабельна только цифра-номер: по ней — переход к месту в переводе */
.annotation-index {
  font-size: 0.68em;
  line-height: 0;
  cursor: pointer;
  padding: 2px 3px;
  border-radius: 3px;
  transition: background 0.12s;
  position: relative;
}

.apanel-lang .annotation-index:hover,
.apanel-lang .annotation-index:focus-visible {
  background: var(--highlight-lang);
  outline: none;
}

.apanel-meaning .annotation-index:hover,
.apanel-meaning .annotation-index:focus-visible {
  background: var(--highlight-meaning);
  outline: none;
}

.index-lang {
  color: var(--color-lang);
  margin-right: 4px;
}

.index-meaning {
  color: var(--color-meaning);
  margin-right: 4px;
}

/* Тач-экран: чуть увеличенная зона нажатия вокруг маленькой цифры */
@media (max-width: 900px) {
  .annotation-index::after {
    content: '';
    position: absolute;
    inset: -8px -5px;
  }
}

.annotation-ref {
  font-style: italic;
  color: var(--text);
}

.annotation-sep {
  color: var(--text-secondary);
}

.annotation-text {
  color: var(--text-secondary);
  white-space: pre-line;
  text-align: justify;
}
</style>
