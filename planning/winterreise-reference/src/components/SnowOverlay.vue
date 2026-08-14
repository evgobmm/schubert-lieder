<script setup>
// Метель: каждый «хлопок» — внешний span (падение по диагонали с ветром)
// с вложенным span (независимое покачивание). Всё на transform → GPU.
const COUNT = 100

const rand = (min, max) => min + Math.random() * (max - min)

const flakes = Array.from({ length: COUNT }, (_, id) => {
  const fallDuration = rand(7, 14)
  const swayDuration = rand(2.5, 5)
  return {
    id,
    left: rand(-5, 100),
    size: rand(1.5, 6),
    opacity: rand(0.3, 0.9),
    blur: Math.random() < 0.45 ? rand(0.4, 1.2) : 0,
    fallDuration,
    fallDelay: -rand(0, fallDuration),
    wind: rand(7, 17),
    drift: rand(6, 26),
    swayDuration,
    swayDelay: -rand(0, swayDuration)
  }
})
</script>

<template>
  <div class="snow" aria-hidden="true">
    <span
      v-for="f in flakes"
      :key="f.id"
      class="flake"
      :style="{
        left: f.left + 'vw',
        animationDuration: f.fallDuration + 's',
        animationDelay: f.fallDelay + 's',
        '--wind': f.wind + 'vw'
      }"
    >
      <span
        class="flake-dot"
        :style="{
          width: f.size + 'px',
          height: f.size + 'px',
          opacity: f.opacity,
          filter: f.blur ? `blur(${f.blur}px)` : 'none',
          animationDuration: f.swayDuration + 's',
          animationDelay: f.swayDelay + 's',
          '--drift': f.drift + 'px'
        }"
      ></span>
    </span>
  </div>
</template>

<style scoped>
.snow {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 9999;
}

.flake {
  position: absolute;
  top: 0;
  display: block;
  animation-name: snow-fall;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  will-change: transform;
}

.flake-dot {
  display: block;
  border-radius: 50%;
  background: var(--snow);
  animation-name: snow-sway;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
  animation-direction: alternate;
  will-change: transform;
}

@keyframes snow-fall {
  from { transform: translate(0, -10vh); }
  to { transform: translate(var(--wind), 110vh); }
}

@keyframes snow-sway {
  from { transform: translateX(calc(var(--drift) * -1)); }
  to { transform: translateX(var(--drift)); }
}

@media print {
  .snow {
    display: none;
  }
}
</style>
