<script setup>
defineProps({
  index: Number,
  type: String,
  // Якорь для прокрутки из нижних панелей: id вида fn-<ключ аннотации>
  anchorKey: { type: String, default: null }
})

</script>

<template>
  <sup
    class="footnote-mark"
    :class="'mark-' + type"
    :id="anchorKey ? 'fn-' + anchorKey : undefined"
    :title="'Сноска ' + index"
  >{{ index }}</sup>
</template>

<style scoped>
.footnote-mark {
  cursor: pointer;
  /* Обычные цифры вместо юникод-суперскриптов (⁰⁴⁵… нет во многих шрифтах —
     браузер брал их из запасного, и «10» прыгало по вертикали).
     Подъём — через relative/top: vertical-align игнорируется во флекс-строках
     слов (.ru-row — inline-flex), а этот способ работает в любом контексте. */
  font-size: 0.66em;
  line-height: 1;
  vertical-align: baseline;
  align-self: baseline;
  position: relative;
  top: -0.55em;
  margin-left: 2px;
  font-style: normal;
}

.mark-lang {
  color: var(--color-lang);
}

.mark-meaning {
  color: var(--color-meaning);
}

.footnote-mark:hover {
  text-decoration: underline;
}

/* Мобильная: увеличенная зона тапа вокруг маленькой цифры (без сдвига вёрстки) */
@media (max-width: 900px) {
  .footnote-mark::after {
    content: '';
    position: absolute;
    inset: -10px -9px;
  }
}
</style>
