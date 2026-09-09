<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import InterlinearLine from './InterlinearLine.vue'
import AnnotationsPanel from './AnnotationsPanel.vue'
import FootnoteMark from './FootnoteMark.vue'
import AboutPanel from './AboutPanel.vue'
import LineDe from './LineDe.vue'
import { renderText } from '../utils/renderText.js'
import { lastEnd, sliceRanges } from '../utils/ranges.js'
import { playback, seekTo } from '../utils/playback.js'
import { getTiming, buildWordIndex, findWordAt, findWordStart } from '../utils/timings.js'
import { mapWordsToSegments } from '../utils/lineTokens.js'

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

// Узкая колонка метаданных в шапке: первая строка — «1816, D 399», ниже — «стихи — поэт»
const metaLine = computed(() => {
  if (!song.value) return ''
  return [song.value.year && String(song.value.year), song.value.d && `D ${song.value.d}`].filter(Boolean).join(', ')
})

// Поэты — по строкам: одно имя не переносится (ширина колонки — по самой длинной строке),
// соавторы стоят каждый на своей строке
const metaPoets = computed(() => {
  const poet = song.value && (song.value.poet_ru || song.value.poet_de)
  return poet ? poet.split(/,\s*/) : []
})

// Новая колонка страницы (правее перевода): ширина по самой длинной строке метаданных
// (имя поэта не переносится), но не уже 220 px — столько нужно кнопке и предупреждению;
// всё остальное место достаётся переводу. Предел на узких экранах задаёт CSS (clamp)
const SIDE_COL_MIN = 220
const metaRef = ref(null)
const sideCol = ref(SIDE_COL_MIN)

function measureSideCol() {
  const el = metaRef.value
  if (!el) { sideCol.value = SIDE_COL_MIN; return }
  const cs = getComputedStyle(el)
  const probe = document.createElement('span')
  probe.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font-family:${cs.fontFamily};font-size:${cs.fontSize};font-weight:${cs.fontWeight};letter-spacing:${cs.letterSpacing}`
  document.body.appendChild(probe)
  let w = 0
  el.querySelectorAll('.meta-line, .meta-poet-line').forEach(line => {
    probe.textContent = line.textContent
    w = Math.max(w, probe.getBoundingClientRect().width)
  })
  probe.remove()
  sideCol.value = Math.max(SIDE_COL_MIN, Math.ceil(w) + 1)
}

onMounted(() => {
  measureSideCol()
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureSideCol)
})

watch(song, () => nextTick(measureSideCol))

function scrollToAbout() {
  const el = articleRef.value && articleRef.value.querySelector('.about-panel')
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Build a global map: "stanzaIdx-lineIdx-annIdx" -> display number, sorted by footnote position
const annNumberMap = computed(() => {
  if (!song.value || song.value.text_only) return new Map()
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
  if (!song.value || song.value.text_only) return []
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
  if (!song.value || song.value.text_only) return map
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

// ---- Подсветка пропеваемого слова под запись в плеере (docs/rules/word-sync.md) ----
// Тайминги есть только у записей с файлом в data/timings; плеер сообщает загруженную
// запись и позицию через общее состояние playback.
const timing = ref(null)   // тайминги текущей записи; файл подгружается лениво (utils/timings.js), пока грузится — подсветки нет
watch(() => [song.value && song.value.d, playback.videoId], async ([d, videoId]) => {
  timing.value = null
  if (!d || !videoId) return
  const t = await getTiming(d, videoId)
  if (song.value && song.value.d === d && playback.videoId === videoId) timing.value = t
}, { immediate: true })
const wordIndex = computed(() => timing.value ? buildWordIndex(timing.value) : null)
const syncActive = computed(() => !!wordIndex.value)
// Слова строки, спетые в текущей записи иначе, чем в тексте (variants файла таймингов): {k: спетое}
function sungWordsIn(si, li) {
  const vs = timing.value && timing.value.variants
  if (!Array.isArray(vs)) return null
  let out = null
  for (const v of vs) {
    if (v.s === si && v.l === li && Number.isInteger(v.k) && v.heard) { if (!out) out = {}; out[v.k] = v.heard }
  }
  return out
}

const activeWord = computed(() => {
  if (!wordIndex.value) return null
  if (playback.status !== 'playing' && playback.status !== 'paused') return null
  return findWordAt(wordIndex.value, playback.time)
})

function activeWordIn(si, li) {
  const w = activeWord.value
  return w && w.s === si && w.l === li ? w.k : -1
}

// Слово немецкой строки → сегмент подстрочника (подсветка и в правой колонке)
const segMaps = computed(() => {
  if (!song.value || song.value.text_only) return null
  return song.value.stanzas.map(stanza =>
    stanza.lines_de.map((line, li) => {
      const lineRu = stanza.lines_ru && stanza.lines_ru[li]
      return mapWordsToSegments(line, lineRu ? lineRu.segments : null)
    })
  )
})

function sungSegment(si, li) {
  const k = activeWordIn(si, li)
  if (k < 0 || !segMaps.value) return -1
  const map = segMaps.value[si] && segMaps.value[si][li]
  return map && k < map.length ? map[k] : -1
}

// Клик по слову — перемотка записи на его начало (с небольшим упреждением, чтобы слышать атаку)
const SEEK_LEAD = 0.15

function onWordClick(si, li, k) {
  if (!wordIndex.value) return
  const t = findWordStart(wordIndex.value, si, li, k, playback.time)
  if (t == null) return
  seekTo(t - SEEK_LEAD)
}

// Клик по русскому сегменту: первое из его немецких слов; у сегмента без немецкого
// соответствия (добавленное по-русски слово) — ближайший сегмент той же строки,
// сначала вправо, потом влево; в крайнем случае — начало строки.
function segmentWord(si, li, segIdx) {
  const map = segMaps.value && segMaps.value[si] && segMaps.value[si][li]
  if (!map || !map.length) return -1
  const firstWordOf = j => map.findIndex(sIdx => sIdx === j)
  const n = song.value.stanzas[si].lines_ru[li].segments.length
  for (let j = segIdx; j < n; j++) {
    const k = firstWordOf(j)
    if (k >= 0) return k
  }
  for (let j = segIdx - 1; j >= 0; j--) {
    const k = firstWordOf(j)
    if (k >= 0) return k
  }
  return 0
}

function onSegmentClick(si, li, segIdx) {
  const k = segmentWord(si, li, segIdx)
  if (k >= 0) onWordClick(si, li, k)
}

// Прокрутка вслед за подсветкой — только пока читатель следит за ней: если предыдущая
// подсвеченная строка была на экране, а новая ушла за край, подтягиваем новую; если
// читатель ушёл в другое место страницы (строка не видна) — не дёргаем.
const activeLineKey = computed(() => {
  const w = activeWord.value
  return w && w.s >= 0 ? `${w.s}-${w.l}` : null
})
let lastLineKey = null

function lineEl(key) {
  return articleRef.value ? articleRef.value.querySelector(`[data-line="${key}"]`) : null
}

watch(activeLineKey, (key) => {
  if (!key) return
  const prevKey = lastLineKey
  lastLineKey = key
  const el = lineEl(key)
  if (!el) return
  const vh = window.innerHeight
  const r = el.getBoundingClientRect()
  if (r.top >= 0 && r.bottom <= vh) return
  const prev = prevKey ? lineEl(prevKey) : null
  if (!prev) return
  const pr = prev.getBoundingClientRect()
  if (pr.bottom <= 0 || pr.top >= vh) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
})

watch(() => [props.songFile, playback.videoId], () => { lastLineKey = null })
</script>

<template>
  <article v-if="song" class="song-view" ref="articleRef" :style="{ '--side-col': sideCol + 'px' }">
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
          v-if="song.title_ru"
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

    <!-- Новая колонка, строка названий: «1816, D 399», ниже отдельной строкой «стихи — поэт» -->
    <div v-if="metaLine || metaPoets.length" ref="metaRef" class="side-meta">
      <div v-if="metaLine" class="meta-line">{{ metaLine }}</div>
      <div v-if="metaPoets.length" class="meta-poet"><span
        v-for="(name, i) in metaPoets"
        :key="i"
        class="meta-poet-line"
      >{{ i === 0 ? 'стихи — ' : '' }}{{ name }}{{ i < metaPoets.length - 1 ? ', ' : '' }}</span></div>
    </div>

    <!-- Новая колонка, строка начала перевода: кнопка «О песне» и предупреждение -->
    <aside class="side-lower">
      <button
        v-if="song.about && song.about.length"
        class="about-btn"
        type="button"
        @click="scrollToAbout"
      >
        <span class="about-btn-label">О песне</span>
        <svg class="about-btn-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="m7 6 5 5 5-5" />
          <path d="m7 13 5 5 5-5" />
        </svg>
      </button>
      <p class="site-note">Сайт предназначен для общего знакомства с&nbsp;песнями.<br />Он сделан с&nbsp;помощью ИИ и&nbsp;на данный момент не&nbsp;может рассматриваться как источник знаний.</p>
    </aside>

    <!-- Режим «только текст»: немецкий текст без перевода (переводы добавляются постепенно) -->
    <div v-if="song.text_only" class="song-body text-only-body">
      <p class="text-only-note">Пословный перевод готовится. Пока — немецкий текст, как он поётся.</p>
      <div
        v-for="(stanza, si) in song.stanzas"
        :key="si"
        class="stanza"
      >
        <LineDe
          v-for="(line, li) in stanza.lines_de"
          :key="li"
          :text="line"
          :data-line="`${si}-${li}`"
          :active-word="activeWordIn(si, li)"
          :sung-words="sungWordsIn(si, li)"
          :clickable="syncActive"
          @word-click="onWordClick(si, li, $event)"
        />
      </div>
    </div>

    <div v-else class="song-body">
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
          :data-line="`${si}-${li}`"
        >
          <div class="col-de">
            <LineDe
              v-if="stanza.lines_de[li]"
              :text="stanza.lines_de[li]"
              :variant="getLineDeParts(stanza, li)"
              :active-word="activeWordIn(si, li)"
          :sung-words="sungWordsIn(si, li)"
              :clickable="syncActive"
              @word-click="onWordClick(si, li, $event)"
            />
          </div>
          <div class="col-ru">
            <InterlinearLine
              :line="lineRu"
              :ann-number-map="annNumberMap"
              :ann-key-prefix="`${si}-${li}`"
              :inherited-annotations="getInheritedAnnotations(si, li)"
              :hovered-ann-key="highlightKey"
              :sung-segment="sungSegment(si, li)"
              :clickable="syncActive"
              :show-annotations="showAnnotations"
              :show-lang="showLang"
              :show-meaning="showMeaning"
              @hover-ann="handleHover"
              @tap-ann="handleTap"
              @seek-segment="onSegmentClick(si, li, $event)"
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

    <AboutPanel v-if="song.about && song.about.length" :sections="song.about" />
  </article>
</template>

<style scoped>
/* Страница песни — сетка из двух колонок: текст (немецкий + перевод) и новая колонка
   (год, D-номер, поэт; кнопка «О песне»; предупреждение). Ширина новой колонки —
   по её содержимому, не уже 220 px (--side-col ставит скрипт), предел — свободное место при
   380 (немецкая колонка) + 2 × 40 (промежутки) + 140 (минимум переводу).
   Сетка только на широких экранах (от 1700 px); ниже колонка уходит в поток — см. медиазапрос */
.song-view {
  /* Немецкая колонка: 36 % области текста, но не уже 380 px и не шире 460 px
     (696 = список 260 + настройки 340 + боковые отступы области текста 96) */
  --de-col: clamp(380px, calc((100vw - 696px) * 0.36), 460px);
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(120px, var(--side-col, 220px), calc(100% - var(--de-col) - 220px));
  column-gap: 40px;
  align-items: start;
}

/* По умолчанию всё ниже текста (пояснения, «О песне») — во всю ширину обеих колонок */
.song-view > * {
  grid-column: 1 / -1;
}

.song-header {
  grid-column: 1;
  grid-row: 1;
  align-self: baseline;
  display: flex;
  gap: 40px;
  align-items: baseline;
  margin-bottom: 32px;
}

.song-body {
  grid-column: 1;
  grid-row: 2;
}

.side-meta {
  grid-column: 2;
  grid-row: 1;
  align-self: baseline;
}

.side-lower {
  grid-column: 2;
  grid-row: 2;
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

/* Метаданные новой колонки: первая строка стоит на базовой линии названий
   (align-self: baseline у элементов первой строки сетки) */
.side-meta {
  font-family: var(--font-sans);
  font-size: 0.85rem;
  line-height: 1.45;
  color: var(--text-secondary);
}

.meta-line {
  white-space: nowrap;
}

.meta-poet {
  margin-top: 2px;
}

/* Каждый автор — на своей строке */
.meta-poet-line {
  display: block;
}

/* ---- Новая колонка на линии начала перевода ---- */
.side-lower {
  font-family: var(--font-sans);
}

/* Кнопка «О песне» — в стиле кнопок «Исполнения»/«Печать», компактнее: надпись и двойной шеврон вниз */
.about-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px 6px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--sidebar-bg);
  color: var(--text);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  font-weight: 500;
  line-height: 1.3;
  cursor: pointer;
  transition: background 0.15s;
}

.about-btn:hover {
  background: var(--highlight);
}

.about-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.about-btn-chev {
  color: var(--accent);
  flex: none;
}

.site-note {
  margin-top: 10px;
  font-size: 0.78rem;
  line-height: 1.45;
  color: var(--text-secondary);
}

.stanza {
  margin-bottom: 28px;
}

/* Режим «только текст» */
.text-only-note {
  margin-bottom: 26px;
  font-family: var(--font-sans);
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.line-pair {
  display: flex;
  gap: 40px;
  align-items: flex-start;
  margin-bottom: 8px;
}

.col-de {
  flex: 0 0 var(--de-col, 380px);
  display: flex;
  align-items: flex-start;
}

.col-ru {
  flex: 1;
  min-width: 0;
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
/* Экраны уже 1700 px: сетке с новой колонкой места нет (переводу осталось бы < 240 px) —
   она распадается в поток: метаданные строкой под названиями, затем кнопка и предупреждение,
   затем текст */
@media (max-width: 1699px) {
  .song-view {
    display: block;
  }

  .side-meta {
    margin: -14px 0 16px;
  }

  .meta-line,
  .meta-poet,
  .meta-poet-line {
    display: inline;
    margin: 0;
  }

  .meta-line::after {
    content: ', ';
  }

  .side-lower {
    margin: 0 0 22px;
  }
}

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
  .hover-tooltip,
  .side-lower {
    display: none;
  }
}
</style>
