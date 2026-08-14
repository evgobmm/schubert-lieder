<script setup>
import { ref, onMounted } from 'vue'

const isDark = ref(false)

onMounted(() => {
  isDark.value = localStorage.getItem('theme') === 'dark'
  applyTheme()
})

function toggle() {
  isDark.value = !isDark.value
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  applyTheme()
}

function applyTheme() {
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
}
</script>

<template>
  <button class="theme-toggle" @click="toggle" :title="isDark ? 'Светлая тема' : 'Тёмная тема'">
    {{ isDark ? '☀' : '☾' }}
  </button>
</template>

<style scoped>
.theme-toggle {
  background: none;
  border: 1px solid var(--border);
  border-radius: 50%;
  width: 46px;
  height: 46px;
  font-size: 1.55rem;
  cursor: pointer;
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-toggle:hover {
  background: var(--highlight);
}
</style>
