<script setup>
// Окно «Источники и благодарности» — публичная версия реестра docs/rules/acknowledgements.md
// (данные: src/data/acknowledgements.json; при пополнении реестра пополняется и он)
import { onMounted, onUnmounted } from 'vue'
import data from '../data/acknowledgements.json'

const emit = defineEmits(['close'])

function onKey(e) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <div class="ack-backdrop" @click="emit('close')">
      <div class="ack-menu" role="dialog" aria-labelledby="ack-title" @click.stop>
        <div class="ack-head">
          <h3 id="ack-title" class="ack-title">Источники и благодарности</h3>
          <button class="ack-close" type="button" aria-label="Закрыть" @click="emit('close')">
            <svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
              <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
            </svg>
          </button>
        </div>

        <p v-for="(p, i) in data.intro" :key="i" class="ack-intro">{{ p }}</p>

        <section v-for="sec in data.sections" :key="sec.title" class="ack-section">
          <h4 class="ack-heading">{{ sec.title }}</h4>
          <ul class="ack-list">
            <li v-for="it in sec.items" :key="it.name">
              <a v-if="it.url" class="ack-name" :href="it.url" target="_blank" rel="noopener">{{ it.name }}</a><span v-else class="ack-name">{{ it.name }}</span><template v-if="it.note"> — {{ it.note }}</template>
            </li>
          </ul>
        </section>

        <div class="ack-actions">
          <button class="ack-cancel" type="button" @click="emit('close')">Закрыть</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.ack-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 120;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.ack-menu {
  width: 680px;
  max-width: calc(100vw - 32px);
  max-height: 88vh;
  overflow-y: auto;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 20px 24px 18px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  font-family: var(--font-sans);
}

.ack-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.ack-title {
  font-family: var(--font-serif);
  font-size: 1.25rem;
  font-weight: 600;
}

.ack-close {
  flex: none;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: none;
  color: var(--text);
  cursor: pointer;
}

.ack-close:hover {
  background: var(--highlight);
}

.ack-intro {
  font-family: var(--font-serif);
  font-size: 0.98rem;
  line-height: 1.55;
  color: var(--text);
  margin-bottom: 8px;
}

.ack-section {
  margin-top: 18px;
}

.ack-heading {
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.ack-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.ack-list li {
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--text);
  padding: 3px 0;
}

.ack-name {
  font-weight: 500;
}

a.ack-name {
  color: var(--link);
  text-decoration: none;
  border-bottom: 1px solid color-mix(in srgb, var(--link) 35%, transparent);
}

a.ack-name:hover {
  border-bottom-color: var(--link);
}

.ack-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid var(--border);
}

.ack-cancel {
  font-family: inherit;
  font-size: 0.95rem;
  color: var(--text);
  background: none;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px 14px;
  cursor: pointer;
}

.ack-cancel:hover {
  background: var(--highlight);
}

@media print {
  .ack-backdrop {
    display: none;
  }
}
</style>
