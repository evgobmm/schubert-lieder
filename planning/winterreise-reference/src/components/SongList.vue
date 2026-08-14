<script setup>
defineProps({
  songs: Array,
  current: Number
})

defineEmits(['select'])
</script>

<template>
  <nav class="song-list">
    <ul>
      <li
        v-for="song in songs"
        :key="song.number"
        :class="{ active: song.number === current, disabled: !song.ready }"
      >
        <a
          v-if="song.ready"
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
  </nav>
</template>

<style scoped>
.song-list ul {
  list-style: none;
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
  min-width: 22px;
  text-align: right;
  color: var(--text-secondary);
}

.song-list li.active .song-number {
  color: rgba(255, 255, 255, 0.7);
}
</style>
