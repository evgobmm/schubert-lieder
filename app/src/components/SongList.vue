<script setup>
import { computed } from 'vue'

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
</script>

<template>
  <nav class="song-list">
    <div v-for="group in groups" :key="group.id" class="song-group">
      <div v-if="group.title" class="group-title">{{ group.title }}</div>
      <ul>
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
}

.song-group {
  margin-bottom: 10px;
}

.group-title {
  padding: 8px 10px 4px;
  font-family: var(--font-sans);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-secondary);
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
