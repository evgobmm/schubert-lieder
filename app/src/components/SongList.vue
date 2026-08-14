<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  songs: Array,
  sections: Array,
  current: Number
})

defineEmits(['select'])

// Песни, сгруппированные по разделам (порядок разделов — из sections.json)
const groups = computed(() => {
  if (!props.sections || !props.sections.length) return [{ id: '_', title: null, songs: props.songs }]
  const byId = new Map(props.sections.map(s => [s.id, { ...s, songs: [] }]))
  for (const song of props.songs) {
    const g = byId.get(song.section)
    if (g) g.songs.push(song)
  }
  return [...byId.values()].filter(g => g.songs.length)
})

const currentSectionId = computed(() => {
  const song = (props.songs || []).find(s => s.number === props.current)
  return song ? song.section : null
})

// Аккордеон: по умолчанию всё закрыто; раскрыт максимум один раздел —
// открытие раздела закрывает предыдущий (правило: docs/rules/project.md)
const expanded = ref(null)

function toggle(id) {
  expanded.value = expanded.value === id ? null : id
}
</script>

<template>
  <nav class="song-list">
    <div v-for="group in groups" :key="group.id" class="song-group">
      <button
        v-if="group.title"
        class="group-header"
        :class="{ open: expanded === group.id, 'has-active': group.id === currentSectionId }"
        @click="toggle(group.id)"
      >
        <span class="group-chevron" aria-hidden="true">▸</span>
        <span class="group-name">{{ group.title }}</span>
        <span class="group-count">{{ group.songs.length }}</span>
      </button>
      <ul v-if="!group.title || expanded === group.id">
        <li
          v-for="song in group.songs"
          :key="song.number"
          :class="{ active: song.number === current, disabled: !song.file }"
        >
          <a
            v-if="song.file"
            class="song-link"
            :href="`?song=${song.number}`"
            @click.exact.prevent="$emit('select', song.number)"
          >
            <span class="song-number">{{ song.number }}.</span>
            <span class="song-title">{{ song.title_de }}</span>
          </a>
          <span v-else class="song-link">
            <span class="song-number">{{ song.number }}.</span>
            <span class="song-title">{{ song.title_de }}</span>
          </span>
        </li>
      </ul>
    </div>
  </nav>
</template>

<style scoped>
.song-list ul {
  list-style: none;
  margin: 2px 0 8px;
}

.song-group {
  margin-bottom: 2px;
}

.group-header {
  display: flex;
  align-items: baseline;
  gap: 7px;
  width: 100%;
  padding: 7px 10px;
  border: none;
  background: none;
  border-radius: 4px;
  cursor: pointer;
  text-align: left;
  font-family: var(--font-sans);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--text-secondary);
}

.group-header:hover {
  background: var(--highlight);
  color: var(--text);
}

.group-chevron {
  flex: none;
  font-size: 0.7rem;
  transition: transform 0.15s;
}

.group-header.open .group-chevron {
  transform: rotate(90deg);
}

.group-name {
  flex: 1;
}

/* Свёрнутый раздел с текущей песней — виден и так */
.group-header.has-active .group-name {
  color: var(--accent);
}

.group-count {
  flex: none;
  font-weight: 400;
  font-size: 0.72rem;
  color: var(--text-secondary);
  opacity: 0.75;
}

.song-list li {
  cursor: pointer;
  border-radius: 4px;
  font-size: 0.9rem;
}

/* Ссылка заполняет пункт меню и выглядит ровно как раньше выглядел li */
.song-link {
  display: flex;
  gap: 6px;
  padding: 6px 10px;
  color: inherit;
  text-decoration: none;
}

.song-list li:hover:not(.disabled) {
  background: var(--highlight);
}

.song-list li.active {
  background: var(--accent);
  color: #fff;
}

.song-list li.active:hover:not(.disabled) {
  background: var(--accent-hover);
}

.song-list li.disabled {
  opacity: 0.4;
  cursor: default;
}

.song-number {
  min-width: 30px;
  text-align: right;
  color: var(--text-secondary);
}

.song-list li.active .song-number {
  color: rgba(255, 255, 255, 0.7);
}
</style>
