<script setup>
import { ref, computed, watch } from 'vue'
import { searchSongs } from '../utils/searchIndex.js'

const props = defineProps({
  songs: Array,
  sections: Array,
  current: Number
})

const emit = defineEmits(['select'])

// Поиск: срабатывает сам с задержкой 300 мс; сначала названия, затем текст песен
const searchInput = ref('')
const searchResult = ref({ mode: null, hits: [] })
let searchTimer = null

watch(searchInput, (q) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    searchResult.value = searchSongs(props.songs, q)
  }, 300)
})

const searching = computed(() => searchInput.value.trim().length >= 2)

// Переход из поиска: открыть песню, раскрыть её раздел, сбросить поиск
function goToHit(hit) {
  emit('select', hit.song.number)
  expanded.value = hit.song.section
  searchInput.value = ''
  searchResult.value = { mode: null, hits: [] }
}

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
    <div class="search-box">
      <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <line x1="16.5" y1="16.5" x2="21" y2="21" />
      </svg>
      <input
        v-model="searchInput"
        class="search-input"
        type="search"
        placeholder="Поиск"
        aria-label="Поиск по песням"
      />
    </div>

    <!-- Результаты поиска (вместо оглавления, пока введён запрос) -->
    <div v-if="searching" class="search-results">
      <p v-if="!searchResult.hits.length" class="search-empty">Ничего не найдено</p>
      <p v-else-if="searchResult.mode === 'text'" class="search-note">В названиях нет — найдено в тексте песен:</p>
      <ul>
        <li
          v-for="hit in searchResult.hits"
          :key="hit.song.number"
          :class="{ active: hit.song.number === current, disabled: !hit.song.file }"
        >
          <a
            v-if="hit.song.file"
            class="song-link search-hit"
            :href="`?song=${hit.song.number}`"
            @click.exact.prevent="goToHit(hit)"
          >
            <span class="song-title">{{ hit.song.title_de }}<template v-if="hit.song.title_ru"> — {{ hit.song.title_ru }}</template></span>
            <span v-if="hit.line" class="hit-line">{{ hit.line }}</span>
          </a>
          <span v-else class="song-link search-hit">
            <span class="song-title">{{ hit.song.title_de }}</span>
            <span class="hit-line">страница готовится</span>
          </span>
        </li>
      </ul>
    </div>

    <div v-for="group in groups" v-show="!searching" :key="group.id" class="song-group">
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

/* Строка поиска */
.search-box {
  position: relative;
  margin: 0 0 10px;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 7px 10px 7px 32px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-sans);
  font-size: 0.88rem;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent);
}

.search-input::placeholder {
  color: var(--text-secondary);
  opacity: 0.7;
}

/* Результаты поиска */
.search-empty,
.search-note {
  padding: 4px 10px 8px;
  font-family: var(--font-sans);
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.search-hit {
  flex-direction: column;
  gap: 1px;
}

.hit-line {
  font-size: 0.78rem;
  color: var(--text-secondary);
  font-style: italic;
}

.search-results li.active .hit-line {
  color: rgba(255, 255, 255, 0.75);
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
