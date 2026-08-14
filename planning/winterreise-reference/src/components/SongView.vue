<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import InterlinearLine from './InterlinearLine.vue'
import AnnotationsPanel from './AnnotationsPanel.vue'
import FootnoteMark from './FootnoteMark.vue'
import { renderText } from '../utils/renderText.js'
import { lastEnd, sliceRanges } from '../utils/ranges.js'

const songModules = import.meta.glob('../data/songs/*.json', { eager: true })

const props = defineProps({
  songFile: String,
  showAnnotations: Boolean,
  showLang: Boolean,
  showMeaning: Boolean,
  // Номер перед немецким названием (используется только печатным листом)
  number: { type: Number, default: 0 },
  // Сквозная нумерация сносок: Язык продолжает счёт после Смысла
  // (для чёрно-белой печати, где типы не различить цветом)
  continuousNumbering: { type: Boolean, default: false }
})

const song = computed(() => {
  if (!props.songFile) return null
  const key = `../data/songs/${props.songFile}`
  const mod = songModules[key]
  return mod ? mod.default : null
})

// Build a global map: "stanzaIdx-lineIdx-annIdx" -> display number, sorted by footnote position
const annNumberMap = computed(() => {
  if (!song.value) return new Map()
  const byType = { lang: [], meaning: [] }
  const titleAnns = song.value.title_annotations || []
  for (let a = 0; a < titleAnns.length; a++) {
    const type = titleAnns[a].type || 'meaning'
    byType[type].push({ key: `title-${a}`, footS: -1, footL: 0, footSeg: a })
  }
  const stanzas = song.value.stanzas
  for (let s = 0; s < stanzas.length; s++) {
    const stanza = stanzas[s]
    for (let l = 0; l < stanza.lines_ru.length; l++) {
      for (let a = 0; a < (stanza.lines_ru[l].annotations || []).length; a++) {
        const ann = stanza.lines_ru[l].annotations[a]
        const type = ann.type || 'meaning'
        const span = ann.line_span || 1
        let footS = s, footL = l + span - 1
        while (footS < stanzas.length && footL >= stanzas[footS].lines_ru.length) {
          footL -= stanzas[footS].lines_ru.length
          footS++
        }
        let footSeg = lastEnd(ann.segment_range)
        if (span > 1) {
          if (ann.continuation_ranges && ann.continuation_ranges.length > 0) {
            let lastRange = null
            for (let ci = ann.continuation_ranges.length - 1; ci >= 0; ci--) {
              if (ann.continuation_ranges[ci] !== null) { lastRange = ann.continuation_ranges[ci]; break }
            }
            footSeg = lastRange ? lastEnd(lastRange) : lastEnd(ann.segment_range)
          } else {
            const footStanza = stanzas[footS]
            if (footStanza && footStanza.lines_ru[footL]) {
              footSeg = footStanza.lines_ru[footL].segments.length - 1
            }
          }
        }
        byType[type].push({ key: `${s}-${l}-${a}`, footS, footL, footSeg })
      }
    }
  }
  const result = new Map()
  for (const type of ['lang', 'meaning']) {
    byType[type].sort((a, b) => a.footS !== b.footS ? a.footS - b.footS : a.footL !== b.footL ? a.footL - b.footL : a.footSeg - b.footSeg)
  }
  // Сквозной режим: Язык продолжает нумерацию после Смысла (если Смысл показан)
  const langOffset = props.continuousNumbering && props.showMeaning ? byType.meaning.length : 0
  byType.meaning.forEach((item, i) => { result.set(item.key, i + 1) })
  byType.lang.forEach((item, i) => { result.set(item.key, langOffset + i + 1) })
  return result
})

function collectAnnotations(type) {
  if (!song.value) return []
  const items = []
  const titleAnns = song.value.title_annotations || []
  for (let a = 0; a < titleAnns.length; a++) {
    const ann = titleAnns[a]
    if ((ann.type || 'meaning') === type) {
      const displayNum = annNumberMap.value.get(`title-${a}`) || 0
      items.push({
        key: `title-${a}`,
        text: ann.text,
        type: ann.type || 'meaning',
        target: null,
        segments: [{ ru: song.value.title_ru, de: song.value.title_de }],
        displayNum
      })
    }
  }
  const stanzas = song.value.stanzas
  for (let s = 0; s < stanzas.length; s++) {
    const stanza = stanzas[s]
    for (let l = 0; l < stanza.lines_ru.length; l++) {
      const line = stanza.lines_ru[l]
      for (let a = 0; a < (line.annotations || []).length; a++) {
        const ann = line.annotations[a]
        if ((ann.type || 'meaning') === type) {
          const segments = sliceRanges(line.segments, ann.segment_range)
          if (ann.continuation_ranges) {
            for (let c = 0; c < ann.continuation_ranges.length; c++) {
              const cr = ann.continuation_ranges[c]
              if (cr === null) continue
              let tS = s, tL = l + c + 1
              while (tS < stanzas.length && tL >= stanzas[tS].lines_ru.length) {
                tL -= stanzas[tS].lines_ru.length
                tS++
              }
              const nextLine = tS < stanzas.length ? stanzas[tS].lines_ru[tL] : null
              if (nextLine) {
                segments.push(...sliceRanges(nextLine.segments, cr))
              }
            }
          }
          const displayNum = annNumberMap.value.get(`${s}-${l}-${a}`) || 0
          items.push({
            key: `${s}-${l}-${a}`,
            text: ann.text,
            type: ann.type || 'meaning',
            target: ann.target || null,
            segments,
            displayNum
          })
        }
      }
    }
  }
  items.sort((a, b) => a.displayNum - b.displayNum)
  return items.map(item => ({ ...item, index: item.displayNum }))
}

const langAnnotations = computed(() => collectAnnotations('lang'))
const meaningAnnotations = computed(() => collectAnnotations('meaning'))

const TOOLTIP_VERT_MARGIN = 16
const TOOLTIP_HORIZ_GAP = 8
const SETTINGS_COLUMN = 340
const SETTINGS_RESERVE = SETTINGS_COLUMN + TOOLTIP_HORIZ_GAP
const TOOLTIP_MIN_WIDTH = 200
const TOOLTIP_MAX_WIDTH = 280

const hoveredAnnKey = ref(null)
const hoveredY = ref(TOOLTIP_VERT_MARGIN)
const tooltipRef = ref(null)
const tooltipReady = ref(false)
const articleRef = ref(null)
const tooltipLeft = ref(0)
const tooltipWidth = ref(TOOLTIP_MIN_WIDTH)
let lastKey = null

function getContentRight() {
  if (!articleRef.value) return null
  const segments = articleRef.value.querySelectorAll('.col-ru .segment')
  if (segments.length === 0) {
    return articleRef.value.getBoundingClientRect().right
  }
  let maxRight = 0
  for (const el of segments) {
    const r = el.getBoundingClientRect().right
    if (r > maxRight) maxRight = r
  }
  return maxRight
}

function updateTooltipPosition() {
  const right = getContentRight()
  if (right == null) return
  const desiredLeft = right + TOOLTIP_HORIZ_GAP
  const rightBoundary = window.innerWidth - SETTINGS_RESERVE
  const naturalWidth = rightBoundary - desiredLeft
  const width = Math.min(TOOLTIP_MAX_WIDTH, Math.max(TOOLTIP_MIN_WIDTH, naturalWidth))
  tooltipLeft.value = Math.max(TOOLTIP_HORIZ_GAP, Math.min(desiredLeft, rightBoundary - width))
  tooltipWidth.value = width
}

onMounted(() => {
  updateTooltipPosition()
  window.addEventListener('resize', updateTooltipPosition)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateTooltipPosition)
})

const annDataByKey = computed(() => {
  const map = new Map()
  if (!song.value) return map
  const titleAnns = song.value.title_annotations || []
  for (let a = 0; a < titleAnns.length; a++) {
    const ann = titleAnns[a]
    map.set(`title-${a}`, { text: ann.text, type: ann.type || 'meaning' })
  }
  const stanzas = song.value.stanzas
  for (let s = 0; s < stanzas.length; s++) {
    const stanza = stanzas[s]
    for (let l = 0; l < stanza.lines_ru.length; l++) {
      const anns = stanza.lines_ru[l].annotations || []
      for (let a = 0; a < anns.length; a++) {
        const ann = anns[a]
        map.set(`${s}-${l}-${a}`, { text: ann.text, type: ann.type || 'meaning' })
      }
    }
  }
  return map
})

const TOOLTIP_WIDTH_STEP = 40
const TOOLTIP_FIT_HARD_MAX = 720

function handleHover(payload) {
  if (!payload) {
    hoveredAnnKey.value = null
    tooltipReady.value = false
    lastKey = null
    return
  }
  updateTooltipPosition()
  hoveredAnnKey.value = payload.key
  if (payload.key === lastKey) return
  lastKey = payload.key
  hoveredY.value = Math.max(TOOLTIP_VERT_MARGIN, payload.y)
  tooltipReady.value = false
  nextTick(async () => {
    if (!tooltipRef.value) return
    const vh = window.innerHeight
    const maxHeight = vh - TOOLTIP_VERT_MARGIN * 2
    const screenMax = window.innerWidth - TOOLTIP_HORIZ_GAP * 2
    const fitMax = Math.min(TOOLTIP_FIT_HARD_MAX, screenMax)

    let h = tooltipRef.value.offsetHeight

    // If too tall, widen step-by-step until it fits or we hit the hard max
    while (h > maxHeight && tooltipWidth.value < fitMax) {
      tooltipWidth.value = Math.min(tooltipWidth.value + TOOLTIP_WIDTH_STEP, fitMax)
      const screenRight = window.innerWidth - TOOLTIP_HORIZ_GAP
      if (tooltipLeft.value + tooltipWidth.value > screenRight) {
        tooltipLeft.value = Math.max(TOOLTIP_HORIZ_GAP, screenRight - tooltipWidth.value)
      }
      await nextTick()
      if (!tooltipRef.value) return
      h = tooltipRef.value.offsetHeight
    }

    if (h > maxHeight) {
      hoveredY.value = TOOLTIP_VERT_MARGIN
    } else {
      const maxTop = vh - h - TOOLTIP_VERT_MARGIN
      hoveredY.value = Math.max(TOOLTIP_VERT_MARGIN, Math.min(payload.y, maxTop))
    }
    tooltipReady.value = true
  })
}

const hoveredTooltip = computed(() => {
  if (!hoveredAnnKey.value) return null
  const data = annDataByKey.value.get(hoveredAnnKey.value)
  if (!data) return null
  if (!props.showAnnotations) return null
  if (data.type === 'lang' && !props.showLang) return null
  if (data.type === 'meaning' && !props.showMeaning) return null
  return data
})

function getInheritedAnnotations(stanzaIndex, lineIndex) {
  if (!song.value) return []
  const result = []

  const stanzas = song.value.stanzas

  // Check all stanzas at or before current; for each anchor, compute distance to current line.
  for (let prevS = 0; prevS <= stanzaIndex; prevS++) {
    const prevStanza = stanzas[prevS]
    const prevLineCount = prevStanza.lines_ru.length
    const lineLimit = (prevS === stanzaIndex) ? lineIndex : prevLineCount
    for (let l = 0; l < lineLimit; l++) {
      const lineAnns = prevStanza.lines_ru[l].annotations || []
      for (let a = 0; a < lineAnns.length; a++) {
        const ann = lineAnns[a]
        const span = ann.line_span || 1

        // Distance from anchor (prevS, l) to current line (stanzaIndex, lineIndex), 0-indexed.
        let distance
        if (prevS === stanzaIndex) {
          distance = lineIndex - l
        } else {
          distance = prevLineCount - l
          for (let ts = prevS + 1; ts < stanzaIndex; ts++) {
            distance += stanzas[ts].lines_ru.length
          }
          distance += lineIndex
        }

        if (distance >= 1 && distance < span) {
          const isLastSpannedLine = (distance === span - 1)
          const type = ann.type || 'meaning'
          let displayIndex = null
          if (isLastSpannedLine) {
            displayIndex = annNumberMap.value.get(`${prevS}-${l}-${a}`) || 0
          }
          const contIndex = distance - 1
          const segmentRange = ann.continuation_ranges ? ann.continuation_ranges[contIndex] : null
          if (ann.continuation_ranges && segmentRange === null) continue
          result.push({
            key: `${prevS}-${l}-${a}`,
            type,
            isLastSpannedLine,
            displayIndex,
            text: ann.text,
            segmentRange
          })
        }
      }
    }
  }

  return result
}

const titleFootnotes = computed(() => {
  if (!song.value) return []
  const titleAnns = song.value.title_annotations || []
  return titleAnns.map((ann, a) => {
    const type = ann.type || 'meaning'
    return {
      key: `title-${a}`,
      type,
      displayIndex: annNumberMap.value.get(`title-${a}`) || 0,
      visible: props.showAnnotations && (type === 'lang' ? props.showLang : props.showMeaning)
    }
  })
})

function onTitleHover(key, event) {
  handleHover({ key, y: event.currentTarget.getBoundingClientRect().top })
}

// Тап по сноске (только мобильная раскладка) — модальное окошко с пояснением
const tappedAnnKey = ref(null)

function handleTap(key) {
  if (!window.matchMedia('(max-width: 900px)').matches) return
  tappedAnnKey.value = key
}

const tappedTooltip = computed(() => {
  if (!tappedAnnKey.value) return null
  return annDataByKey.value.get(tappedAnnKey.value) || null
})

watch(() => props.songFile, () => {
  tappedAnnKey.value = null
  flashKey.value = null
})

// Переход из нижних панелей к месту в переводе: подсветка-вспышка + прокрутка к сноске-якорю.
// Подсветку ведёт highlightKey (наведение ИЛИ вспышка), всплывающую подсказку — только наведение.
const flashKey = ref(null)
let flashTimer = null
const highlightKey = computed(() => hoveredAnnKey.value || flashKey.value)

function goto(key) {
  handleHover(null)         // снять возможную подсказку/наведение
  tappedAnnKey.value = null // закрыть мобильное окошко, если открыто
  flashKey.value = key
  clearTimeout(flashTimer)
  flashTimer = setTimeout(() => { flashKey.value = null }, 2000)
  nextTick(() => {
    const el = document.getElementById('fn-' + key)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

function getLineDeParts(stanza, lineIndex) {
  const line = stanza.lines_ru[lineIndex]
  const lineDe = stanza.lines_de[lineIndex]
  if (!line || !lineDe) return null
  const variantSeg = line.segments.find(s => s.variant_de)
  if (!variantSeg) return null
  // Вариант надстраивается только над различающимся словом (существительным),
  // а не над общим артиклем: для «артикль + существительное» (напр. «den Wegen»)
  // берём последнее слово («Wegen»), чтобы «Straßen» встало над «Wegen», а не над «den Wegen».
  const fullIdx = lineDe.indexOf(variantSeg.de)
  if (fullIdx === -1) return null
  const deWords = variantSeg.de.split(/\s+/)
  const mainWord = deWords[deWords.length - 1]
  const idx = fullIdx + variantSeg.de.lastIndexOf(mainWord)
  return {
    before: lineDe.substring(0, idx),
    main: mainWord,
    variant: variantSeg.variant_de,
    after: lineDe.substring(idx + mainWord.length)
  }
}
</script>

<template>
  <article v-if="song" class="song-view" ref="articleRef">
    <header class="song-header">
      <div class="col-de">
        <h2
          :class="{
            'title-highlighted-lang': titleFootnotes.some(fn => fn.visible && fn.key === highlightKey && fn.type === 'lang'),
            'title-highlighted-meaning': titleFootnotes.some(fn => fn.visible && fn.key === highlightKey && fn.type === 'meaning')
          }"
        >{{ (number ? number + '. ' : '') + song.title_de }}</h2>
      </div>
      <div class="col-ru">
        <h2
          class="title-ru"
          :class="{
            'title-highlighted-lang': titleFootnotes.some(fn => fn.visible && fn.key === highlightKey && fn.type === 'lang'),
            'title-highlighted-meaning': titleFootnotes.some(fn => fn.visible && fn.key === highlightKey && fn.type === 'meaning')
          }"
          @mouseenter="titleFootnotes.find(fn => fn.visible) ? onTitleHover(titleFootnotes.find(fn => fn.visible).key, $event) : null"
          @mouseleave="handleHover(null)"
        >{{ song.title_ru }}<FootnoteMark
          v-for="fn in titleFootnotes.filter(f => f.visible)"
          :key="fn.key"
          :index="fn.displayIndex"
          :type="fn.type"
          :anchor-key="fn.key"
          @click.stop="handleTap(fn.key)"
        /></h2>
      </div>
    </header>

    <div class="song-body">
      <div
        v-for="(stanza, si) in song.stanzas"
        :key="si"
        class="stanza"
      >
        <div
          v-for="(lineRu, li) in stanza.lines_ru"
          :key="li"
          class="line-pair"
          :class="{ 'with-variant': lineRu.segments.some(s => s.variant_ru || s.variant_de) }"
        >
          <div class="col-de">
            <p v-if="stanza.lines_de[li]" class="line-de">
              <template v-if="getLineDeParts(stanza, li)">
                {{ getLineDeParts(stanza, li).before }}<span class="de-variant-stack"><span class="de-variant-word">{{ getLineDeParts(stanza, li).variant }}</span><span>{{ getLineDeParts(stanza, li).main }}</span></span>{{ getLineDeParts(stanza, li).after }}
              </template>
              <template v-else>
                {{ stanza.lines_de[li] }}
              </template>
            </p>
          </div>
          <div class="col-ru">
            <InterlinearLine
              :line="lineRu"
              :ann-number-map="annNumberMap"
              :ann-key-prefix="`${si}-${li}`"
              :inherited-annotations="getInheritedAnnotations(si, li)"
              :hovered-ann-key="highlightKey"
              :show-annotations="showAnnotations"
              :show-lang="showLang"
              :show-meaning="showMeaning"
              @hover-ann="handleHover"
              @tap-ann="handleTap"
            />
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="hoveredTooltip"
      :key="hoveredAnnKey"
      ref="tooltipRef"
      class="hover-tooltip"
      :class="[
        'hover-tooltip-' + hoveredTooltip.type,
        { 'is-ready': tooltipReady }
      ]"
      :style="{ top: hoveredY + 'px', left: tooltipLeft + 'px', width: tooltipWidth + 'px' }"
    >
      <span v-html="renderText(hoveredTooltip.text)"></span>
    </div>

    <!-- Мобильное окошко пояснения (открывается тапом по сноске) -->
    <div
      v-if="tappedTooltip"
      class="tap-popup-backdrop"
      @click="tappedAnnKey = null"
    >
      <div class="tap-popup" :class="'tap-popup-' + tappedTooltip.type" @click.stop>
        <button class="tap-popup-close" aria-label="Закрыть" @click="tappedAnnKey = null">✕</button>
        <div class="tap-popup-type">{{ tappedTooltip.type === 'lang' ? 'язык' : 'смысл' }}</div>
        <div class="tap-popup-text" v-html="renderText(tappedTooltip.text)"></div>
      </div>
    </div>

    <div
      v-if="showAnnotations && (langAnnotations.length || meaningAnnotations.length)"
      class="annotations-columns"
    >
      <AnnotationsPanel
        v-if="showMeaning && meaningAnnotations.length"
        :annotations="meaningAnnotations"
        type="meaning"
        title="Смысл"
        @goto="goto"
      />
      <AnnotationsPanel
        v-if="showLang && langAnnotations.length"
        :annotations="langAnnotations"
        type="lang"
        title="Язык"
        @goto="goto"
      />
    </div>
  </article>
</template>

<style scoped>
.song-header {
  display: flex;
  gap: 40px;
  margin-bottom: 32px;
}

.song-header h2 {
  font-size: 1.5rem;
}

/* Курсив — маркер немецкого оригинала (только левая колонка) */
.col-de h2 {
  font-family: var(--font-de);
  font-style: italic;
}

.title-ru {
  font-weight: normal;
  font-style: normal;
  color: var(--text-secondary);
}

.title-highlighted-lang {
  background: var(--highlight-lang);
  border-radius: 2px;
  padding: 0 4px;
  margin: 0 -4px;
}

.title-highlighted-meaning {
  background: var(--highlight-meaning);
  border-radius: 2px;
  padding: 0 4px;
  margin: 0 -4px;
}

.stanza {
  margin-bottom: 28px;
}

.line-pair {
  display: flex;
  gap: 40px;
  align-items: flex-start;
  margin-bottom: 8px;
}

.col-de {
  flex: 0 0 380px;
  display: flex;
  align-items: flex-start;
}

.col-ru {
  flex: 1;
  min-width: 0;
}

.line-de {
  font-family: var(--font-de);
  font-style: italic;
  color: var(--text);
  line-height: 1.5;
}

.de-variant-stack {
  position: relative;
  display: inline;
}

.de-variant-word {
  position: absolute;
  bottom: 100%;
  left: 0;
  white-space: nowrap;
}

.annotations-columns {
  display: flex;
  gap: 40px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
}

.annotations-columns > * {
  flex: 1;
  min-width: 0;
}

.hover-tooltip {
  position: fixed;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 0.85rem;
  line-height: 1.4;
  color: var(--text);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  pointer-events: none;
  white-space: pre-wrap;
  opacity: 0;
  transition: opacity 0.08s;
}

.hover-tooltip.is-ready {
  opacity: 1;
}

.hover-tooltip-lang {
  border-left: 3px solid var(--color-lang);
}

.hover-tooltip-meaning {
  border-left: 3px solid var(--color-meaning);
}

/* Мобильная раскладка: колонки складываются в столбик; на десктопе не действует */
@media (max-width: 900px) {
  .song-header {
    flex-direction: column;
    gap: 0;
    margin-bottom: 22px;
  }

  .line-pair {
    flex-direction: column;
    gap: 4px;
    margin-bottom: 18px;
  }

  .col-de {
    flex: none;
  }

  .annotations-columns {
    flex-direction: column;
    gap: 28px;
  }

  /* Наведения на тач-экране нет; пояснения читаются в панелях ниже или тапом */
  .hover-tooltip {
    display: none;
  }

  /* Строки с поднятым вариантом (Wegen/Straßen, путях/дорогах) — даём
     надстройке воздух, чтобы она не налезала на соседнюю строку */
  .line-pair.with-variant .line-de {
    padding-top: 1.35em;
  }

  .line-pair.with-variant .col-ru {
    padding-top: 1.45rem;
  }

  /* Окошко пояснения по тапу */
  .tap-popup-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    z-index: 90;
  }

  .tap-popup {
    position: fixed;
    left: 12px;
    right: 12px;
    bottom: 12px;
    max-height: 65vh;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 14px 42px 16px 14px;
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.25);
    white-space: pre-line;
  }

  .tap-popup-lang {
    border-left: 3px solid var(--color-lang);
  }

  .tap-popup-meaning {
    border-left: 3px solid var(--color-meaning);
  }

  .tap-popup-type {
    font-family: var(--font-sans);
    font-size: 0.75rem;
    letter-spacing: 0.05em;
    margin-bottom: 6px;
  }

  .tap-popup-lang .tap-popup-type {
    color: var(--color-lang);
  }

  .tap-popup-meaning .tap-popup-type {
    color: var(--color-meaning);
  }

  .tap-popup-text {
    font-size: 0.95rem;
    line-height: 1.55;
    color: var(--text);
  }

  .tap-popup-close {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 36px;
    height: 36px;
    border: none;
    background: none;
    color: var(--text-secondary);
    font-size: 1.15rem;
    cursor: pointer;
  }
}

@media print {
  .hover-tooltip {
    display: none;
  }
}
</style>
