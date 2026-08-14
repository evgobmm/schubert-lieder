<script setup>
import { winterEnabled, toggleWinter } from '../utils/snow.js'
</script>

<template>
  <button
    class="snow-toggle"
    :class="{ active: winterEnabled }"
    @click="toggleWinter"
    :title="winterEnabled ? 'Вернуть обычный вид' : 'Зима'"
  >{{ winterEnabled ? '❀' : '❅' }}</button>
</template>

<style scoped>
.snow-toggle {
  background: none;
  border: 1px solid var(--border);
  border-radius: 50%;
  width: 46px;
  height: 46px;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}

.snow-toggle:hover {
  background: var(--highlight);
}

.snow-toggle.active {
  color: var(--accent);
  border-color: var(--accent);
}
</style>
