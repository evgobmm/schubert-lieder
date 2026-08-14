<script setup>
import { ref, computed, nextTick, onUnmounted } from 'vue'
import SongView from './SongView.vue'
import songsIndex from '../data/index.json'

const props = defineProps({
  currentSongNumber: { type: Number, required: true },
  showAnnotations: Boolean,
  showLang: Boolean,
  showMeaning: Boolean
})

const emit = defineEmits(['close'])

// Локальные копии настроек: всё, что выбирается в этом меню, живёт только здесь
// и не трогает состояние приложения — ни до печати, ни после закрытия.
const pAnn = ref(props.showAnnotations)
const pMeaning = ref(props.showMeaning)
const pLang = ref(props.showLang)
const selected = ref(new Set([props.currentSongNumber]))

function toggleSong(n) {
  const next = new Set(selected.value)
  if (next.has(n)) next.delete(n)
  else next.add(n)
  selected.value = next
}

function selectAll() {
  selected.value = new Set(songsIndex.map(s => s.number))
}

function clearAll() {
  selected.value = new Set()
}

const selectedSongs = computed(() =>
  songsIndex.filter(s => selected.value.has(s.number))
)

// На время печати рендерим «печатный лист» с выбранными песнями (на экране он
// спрятан за краем); body.printing-songs прячет приложение в @media print.
const printing = ref(false)
const sheetRef = ref(null)

// Полезная высота страницы A4 при полях 24мм сверху / 20мм снизу
const MM = 96 / 25.4
const PAGE_H = (297 - 24 - 20) * MM
// Жёсткое требование — последняя страница ≥20%; рабочий порог с запасом:
// экранная модель расходится с печатным движком на величину до ~10% страницы
// (потери на границах строк), поэтому целимся в ≥32%.
const SAFE_FILL = 0.32

function blockH(el) {
  const cs = getComputedStyle(el)
  return el.offsetHeight + (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.marginBottom) || 0)
}

// Жадная симуляция печатной разбивки: блоки неразрывны (строфы, пункты
// комментариев) — блок, не влезающий в остаток страницы, уходит на следующую.
// Блок выше целой страницы движок всё равно рвёт — учитываем перетекание.
function paginate(blocks) {
  let pages = 1
  let y = 0
  for (const h of blocks) {
    if (y > 0 && y + h > PAGE_H) {
      pages += 1
      y = 0
    }
    y += h
    while (y > PAGE_H) {
      pages += 1
      y -= PAGE_H
    }
  }
  return { pages, lastFill: y / PAGE_H }
}

// Текстовая часть песни: шапка приклеена к первой строфе, далее строфы целиком
function textBlocks(songEl) {
  const header = songEl.querySelector('.song-header')
  const stanzas = [...songEl.querySelectorAll('.stanza')]
  if (!stanzas.length) return []
  const blocks = [(header ? blockH(header) : 0) + blockH(stanzas[0])]
  for (const st of stanzas.slice(1)) blocks.push(blockH(st))
  return blocks
}

// Комментарии — построчная модель: движок рвёт прозу только по границам
// строк, заголовок панели не отрывается от первого пункта. Блок = строка
// (+приклеенный заголовок, +нижний отступ пункта у его последней строки).
function notesLineBlocks(songEl) {
  const blocks = []
  for (const panel of songEl.querySelectorAll('.annotations-panel')) {
    const h3 = panel.querySelector('h3')
    const pcs = getComputedStyle(panel)
    let glue = (h3 ? blockH(h3) : 0) + (parseFloat(pcs.marginTop) || 0)
    for (const it of panel.querySelectorAll('.annotation-item')) {
      const cs = getComputedStyle(it)
      const lineH = parseFloat(cs.lineHeight) || 20
      const lines = Math.max(1, Math.round(it.offsetHeight / lineH))
      const mb = parseFloat(cs.marginBottom) || 0
      for (let i = 0; i < lines; i++) {
        blocks.push({
          h: lineH + (i === 0 ? glue : 0) + (i === lines - 1 ? mb : 0),
          itemEl: i === 0 ? it : null
        })
        if (i === 0) glue = 0
      }
    }
  }
  return blocks
}

function notesMetrics(songEl) {
  return paginate(notesLineBlocks(songEl).map(b => b.h))
}

// Гарантия от «огрызка», когда ужатие не помогло: переносим разрыв страницы
// раньше — на границу пункта так, чтобы последней странице досталось около
// полустраницы. Устойчиво к мелким расхождениям модели и реального рендера.
function clearForcedBreaks(songEl) {
  songEl.querySelectorAll('.annotation-item.print-break-before')
    .forEach(e => e.classList.remove('print-break-before'))
}

function rebalanceNotes(songEl) {
  const blocks = notesLineBlocks(songEl)
  let acc = 0
  for (let i = blocks.length - 1; i > 0; i--) {
    acc += blocks[i].h
    if (acc >= PAGE_H / 2 && blocks[i].itemEl) {
      blocks[i].itemEl.classList.add('print-break-before')
      return
    }
  }
}

// Поэтическая строка не должна переноситься: ищем переносы в DE-строках
// (высота больше одной текстовой строки) и в RU-подстрочнике (сегменты
// ушли на второй ряд).
function hasWraps(songEl) {
  for (const ln of songEl.querySelectorAll('.col-de .line-de')) {
    const lh = parseFloat(getComputedStyle(ln).lineHeight) || 20
    if (ln.offsetHeight > lh * 1.6) return true
  }
  for (const il of songEl.querySelectorAll('.col-ru .interlinear-line')) {
    const segs = il.children
    if (segs.length > 1 && segs[segs.length - 1].offsetTop > segs[0].offsetTop + 4) {
      return true
    }
  }
  return false
}

const TEXT_LVL_MAX = 8

// Текст: (1) минимальный кегль, при котором ни одна поэтическая строка не
// переносится; (2) поверх — упаковка: минимальный уровень, дающий наименьшее
// число страниц (плотные страницы без лишнего ужатия).
function fitText(el) {
  const setLvl = (l) => {
    if (l > 0) el.setAttribute('data-compact-text', String(l))
    else el.removeAttribute('data-compact-text')
  }
  let wrapLvl = 0
  for (; wrapLvl < TEXT_LVL_MAX; wrapLvl++) {
    setLvl(wrapLvl)
    if (!hasWraps(el)) break
  }
  setLvl(wrapLvl)
  let best = wrapLvl
  let bestPages = paginate(textBlocks(el)).pages
  for (let l = wrapLvl + 1; l <= TEXT_LVL_MAX; l++) {
    setLvl(l)
    const p = paginate(textBlocks(el)).pages
    if (p < bestPages) {
      best = l
      bestPages = p
    }
  }
  setLvl(best)
}

// Перебалансировка текста: только когда хвост неустраним ужатием (например,
// строфа выше страницы — её всё равно рвёт движок). Разрыв переносится на
// границу пары строк, чтобы последней странице досталось ~полстраницы.
function rebalanceText(songEl) {
  const pairs = [...songEl.querySelectorAll('.line-pair')]
  let acc = 0
  for (let i = pairs.length - 1; i > 0; i--) {
    acc += blockH(pairs[i])
    if (acc >= PAGE_H / 2) {
      pairs[i].classList.add('print-break-before')
      return
    }
  }
}

function clearTextBreaks(songEl) {
  songEl.querySelectorAll('.line-pair.print-break-before')
    .forEach(e => e.classList.remove('print-break-before'))
}

// Подгонка кегля ступенями (1-3), без результата — возврат как было.
// alwaysPack=true (текст): пробуем всегда, успех — только меньше страниц
// (неразрывные строфы оставляют пустоты — лёгкое ужатие может убрать страницу).
// alwaysPack=false (пояснения): пробуем только при «огрызке» (<20% страницы),
// успех — меньше страниц либо заполнение последней ≥20%.
// Одностраничный фрагмент не трогаем (его не ужать в ноль страниц).
function fitFragment(el, attr, measure, alwaysPack) {
  el.removeAttribute(attr)
  const base = measure()
  // Страница «впритык» (>93%): мельчайший дрейф печатного рендера даст
  // перелив на 1-2 строки — превентивно лёгкая первая ступень
  if (base.lastFill > 0.93) {
    el.setAttribute(attr, '1')
    return
  }
  if (base.pages <= 1) return
  if (!alwaysPack && base.lastFill >= SAFE_FILL) return
  let applied = 0
  for (let lvl = 1; lvl <= 3; lvl++) {
    el.setAttribute(attr, String(lvl))
    const m = measure()
    if (m.pages < base.pages || (!alwaysPack && m.lastFill >= SAFE_FILL)) {
      applied = lvl
      break
    }
  }
  if (!applied) el.removeAttribute(attr)
}

// Текст и комментарии — независимые фрагменты (комментарии начинаются
// с новой страницы), каждый подгоняется отдельно.
function autoFitPrint() {
  const songs = sheetRef.value ? sheetRef.value.querySelectorAll('.print-song') : []
  for (const el of songs) {
    clearTextBreaks(el)
    fitText(el)
    const textAfter = paginate(textBlocks(el))
    el.setAttribute('data-dbg-text', `${textAfter.pages}p ${Math.round(textAfter.lastFill * 100)}%`)
    // Перебалансировка текста допустима, только если строфы и так рвутся
    // движком (строфа выше страницы) — иначе запрет на разрыв строф священен
    if (
      textAfter.pages > 1 &&
      textAfter.lastFill < SAFE_FILL &&
      textBlocks(el).some(h => h > PAGE_H)
    ) {
      rebalanceText(el)
    }
    if (el.querySelector('.annotations-columns')) {
      clearForcedBreaks(el)
      fitFragment(el, 'data-compact-notes', () => notesMetrics(el), false)
      const after = notesMetrics(el)
      el.setAttribute('data-dbg-notes', `${after.pages}p ${Math.round(after.lastFill * 100)}%`)
      if (after.pages > 1 && after.lastFill < SAFE_FILL) {
        rebalanceNotes(el)
      }
    }
  }
}

async function doPrint() {
  if (!selectedSongs.value.length) return
  printing.value = true
  document.body.classList.add('printing-songs')
  await nextTick()
  if (document.fonts && document.fonts.ready) await document.fonts.ready
  autoFitPrint()
  window.print()
  document.body.classList.remove('printing-songs')
  printing.value = false
  emit('close')
}

onUnmounted(() => document.body.classList.remove('printing-songs'))
</script>

<template>
  <Teleport to="body">
    <div class="print-backdrop" @click="emit('close')">
      <div class="print-menu" @click.stop>
        <h3 class="print-title">Печать</h3>

        <div class="print-anns">
          <label class="print-check">
            <input type="checkbox" v-model="pAnn" /> Пояснения
          </label>
          <label class="print-check print-meaning" :class="{ disabled: !pAnn }">
            <input type="checkbox" v-model="pMeaning" :disabled="!pAnn" /> Смысл
          </label>
          <label class="print-check print-lang" :class="{ disabled: !pAnn }">
            <input type="checkbox" v-model="pLang" :disabled="!pAnn" /> Язык
          </label>
        </div>

        <div class="print-songs-head">
          <span class="print-songs-label">Песни</span>
          <button class="print-mini" @click="selectAll">Выбрать все</button>
          <button class="print-mini" @click="clearAll">Снять все</button>
        </div>

        <div class="print-song-list">
          <label
            v-for="s in songsIndex"
            :key="s.number"
            class="print-song-item"
          >
            <input
              type="checkbox"
              :checked="selected.has(s.number)"
              @change="toggleSong(s.number)"
            />
            {{ s.number }}. {{ s.title_de }}
          </label>
        </div>

        <div class="print-actions">
          <button class="print-go" :disabled="!selectedSongs.length" @click="doPrint">
            Печать{{ selectedSongs.length > 1 ? ` (${selectedSongs.length})` : '' }}
          </button>
          <button class="print-cancel" @click="emit('close')">Отмена</button>
        </div>
      </div>
    </div>

    <!-- Печатный лист: на экране спрятан за краем (линейка для измерений) -->
    <div v-if="printing" ref="sheetRef" class="print-sheet">
      <div
        v-for="s in selectedSongs"
        :key="s.number"
        class="print-song"
      >
        <SongView
          :song-file="s.file"
          :number="s.number"
          :continuous-numbering="true"
          :show-annotations="pAnn"
          :show-lang="pLang"
          :show-meaning="pMeaning"
        />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.print-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 120;
  display: flex;
  align-items: center;
  justify-content: center;
}

.print-menu {
  width: 520px;
  max-width: calc(100vw - 48px);
  max-height: 84vh;
  overflow-y: auto;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 20px 22px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  font-family: var(--font-sans);
}

.print-title {
  font-family: var(--font-serif);
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 14px;
}

.print-anns {
  display: flex;
  gap: 18px;
  align-items: center;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border);
}

.print-check {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.95rem;
  color: var(--text-secondary);
  cursor: pointer;
}

.print-check input {
  cursor: pointer;
  accent-color: var(--text-secondary);
}

.print-meaning {
  color: var(--color-meaning);
}

.print-meaning input {
  accent-color: var(--color-meaning);
}

.print-lang {
  color: var(--color-lang);
}

.print-lang input {
  accent-color: var(--color-lang);
}

.print-check.disabled {
  opacity: 0.4;
}

.print-songs-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 14px 0 10px;
}

.print-songs-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text);
  margin-right: auto;
}

.print-mini {
  font-family: inherit;
  font-size: 0.82rem;
  color: var(--link);
  background: none;
  border: 1px solid var(--border);
  border-radius: 5px;
  padding: 4px 9px;
  cursor: pointer;
}

.print-mini:hover {
  background: var(--highlight);
}

.print-song-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 14px;
  max-height: 38vh;
  overflow-y: auto;
  padding: 2px;
}

.print-song-item {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.88rem;
  color: var(--text);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.print-song-item input {
  cursor: pointer;
  accent-color: var(--accent);
  flex-shrink: 0;
}

.print-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--border);
}

.print-go {
  font-family: inherit;
  font-size: 0.95rem;
  color: #fff;
  background: var(--accent);
  border: none;
  border-radius: 6px;
  padding: 8px 18px;
  cursor: pointer;
}

.print-go:hover:not(:disabled) {
  background: var(--accent-hover);
}

.print-go:disabled {
  opacity: 0.45;
  cursor: default;
}

.print-cancel {
  font-family: inherit;
  font-size: 0.95rem;
  color: var(--text);
  background: none;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px 14px;
  cursor: pointer;
}

.print-cancel:hover {
  background: var(--highlight);
}

/* Сам лист (.print-sheet) оформлен в main.css: на экране спрятан за краем
   и служит линейкой для измерений, на печати встаёт в поток */
@media print {
  .print-backdrop {
    display: none;
  }

  .print-song {
    break-after: page;
    page-break-after: always;
  }

  .print-song:last-child {
    break-after: auto;
    page-break-after: auto;
  }
}
</style>
