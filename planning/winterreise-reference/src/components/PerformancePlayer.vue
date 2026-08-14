<script setup>
import { ref, computed, watch } from 'vue'
import data from '../data/performances.json'

const props = defineProps({
  songNumber: { type: Number, required: true }
})

const performers = data.performers
const expanded = ref(false)

const savedPerformer = localStorage.getItem('performer')
const performer = ref(
  performers.some(p => p.id === savedPerformer) ? savedPerformer : performers[0].id
)
watch(performer, v => localStorage.setItem('performer', v))

const videoId = computed(() => {
  const entry = data.videos[String(props.songNumber)]
  return entry ? entry[performer.value] : null
})

const embedSrc = computed(() =>
  videoId.value
    ? `https://www.youtube-nocookie.com/embed/${videoId.value}?rel=0&modestbranding=1&autoplay=1`
    : ''
)
</script>

<template>
  <div class="performance">
    <button
      class="perf-toggle"
      :class="{ open: expanded }"
      @click="expanded = !expanded"
    >
      <span class="perf-note">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <ellipse cx="6.2" cy="18.8" rx="2.9" ry="2.1" transform="rotate(-14 6.2 18.8)" />
          <ellipse cx="17" cy="16.9" rx="2.9" ry="2.1" transform="rotate(-14 17 16.9)" />
          <rect x="8.3" y="6.2" width="1.4" height="12.6" />
          <rect x="19.1" y="4.4" width="1.4" height="12.5" />
          <polygon points="8.3,6.2 20.5,4.4 20.5,7.6 8.3,9.4" />
        </svg>
      </span>
      <span class="perf-label">Исполнения</span>
      <span class="perf-chevron" :class="{ open: expanded }"></span>
    </button>

    <div v-if="expanded" class="perf-body">
      <div class="perf-performers">
        <button
          v-for="p in performers"
          :key="p.id"
          class="perf-name"
          :class="{ active: p.id === performer }"
          @click="performer = p.id"
        ><span class="perf-pname">{{ p.name }}</span><span class="perf-year">{{ p.year }}</span></button>
      </div>

      <div v-if="videoId" class="perf-frame">
        <iframe
          :key="videoId"
          :src="embedSrc"
          title="Исполнение"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>
      <p v-else class="perf-none">Для этой песни записи нет.</p>
    </div>
  </div>
</template>

<style scoped>
.performance {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.perf-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 7px 10px;
  font-family: inherit;
  font-size: 1rem;
  color: var(--text);
  background: var(--sidebar-bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.perf-toggle:hover {
  background: var(--highlight);
}

.perf-toggle.open {
  border-color: var(--accent);
}

.perf-note {
  display: flex;
  color: var(--accent);
  flex-shrink: 0;
}

.perf-label {
  flex: 1;
  text-align: left;
}

.perf-chevron {
  flex-shrink: 0;
  width: 7px;
  height: 7px;
  margin-right: 3px;
  border-right: 1.6px solid var(--text-secondary);
  border-bottom: 1.6px solid var(--text-secondary);
  transform: rotate(-45deg);
  transition: transform 0.2s ease;
}

.perf-chevron.open {
  transform: rotate(45deg);
}

.perf-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.perf-performers {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.perf-name {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 6px 9px;
  font-family: inherit;
  font-size: 0.9rem;
  line-height: 1.25;
  text-align: left;
  color: var(--text-secondary);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}

.perf-year {
  flex-shrink: 0;
  opacity: 0.6;
  font-size: 0.85em;
}

.perf-name:hover {
  color: var(--text);
}

.perf-name.active {
  color: #fff;
  background: var(--accent);
  border-color: var(--accent);
}

.perf-frame {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 6px;
  overflow: hidden;
  background: #000;
}

.perf-frame iframe {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}

.perf-none {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-style: italic;
}

@media print {
  .performance {
    display: none;
  }
}
</style>
