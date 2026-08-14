<script setup>
import { renderText } from '../utils/renderText.js'

defineProps({
  sections: { type: Array, required: true }
})
</script>

<template>
  <section class="about-panel">
    <h3 class="about-title">О песне</h3>
    <div v-for="(sec, i) in sections" :key="i" class="about-section">
      <h4 v-if="sec.title" class="about-heading">{{ sec.title }}</h4>
      <p class="about-text" v-html="renderText(sec.text)"></p>
    </div>
  </section>
</template>

<style scoped>
.about-panel {
  margin-top: 36px;
  padding-top: 26px;
  border-top: 1px solid var(--border);
  max-width: 720px;
}

.about-title {
  font-family: var(--font-sans);
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  margin-bottom: 16px;
  color: var(--text);
}

.about-section {
  margin-bottom: 18px;
}

.about-heading {
  font-family: var(--font-sans);
  font-size: 0.92rem;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--text);
}

.about-text {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--text);
  white-space: pre-line;
}

@media print {
  .about-panel {
    display: none;
  }
}
</style>
