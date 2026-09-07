<script setup>
// Текст с подсвеченным фрагментом совпадения: range — [от, до) в исходной строке
import { computed } from 'vue'

const props = defineProps({
  text: { type: String, default: '' },
  range: { type: Array, default: null }
})

const parts = computed(() => {
  const t = props.text || ''
  const r = props.range
  if (!r || r[0] < 0 || r[1] > t.length || r[0] >= r[1]) return { pre: t, hit: '', post: '' }
  return { pre: t.slice(0, r[0]), hit: t.slice(r[0], r[1]), post: t.slice(r[1]) }
})
</script>

<template>
  <span class="match-text">{{ parts.pre }}<mark v-if="parts.hit" class="match">{{ parts.hit }}</mark>{{ parts.post }}</span>
</template>

<style>
/* Не scoped: используется и в сайдбаре, и в мобильной шапке */
.match-text .match {
  background: color-mix(in srgb, var(--accent) 24%, transparent);
  color: inherit;
  border-radius: 2px;
  padding: 0 1px;
  margin: 0 -1px;
}
</style>
