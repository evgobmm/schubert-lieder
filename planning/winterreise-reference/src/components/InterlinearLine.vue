<script setup>
import { computed } from 'vue'
import FootnoteMark from './FootnoteMark.vue'
import { inRanges, lastEnd } from '../utils/ranges.js'

const props = defineProps({
  line: Object,
  annNumberMap: { type: Map, default: () => new Map() },
  inheritedAnnotations: { type: Array, default: () => [] },
  hoveredAnnKey: { type: String, default: null },
  annKeyPrefix: String,
  showAnnotations: { type: Boolean, default: true },
  showLang: { type: Boolean, default: true },
  showMeaning: { type: Boolean, default: true }
})

function isVisible(annOrFn) {
  if (!annOrFn || !props.showAnnotations) return false
  if (annOrFn.type === 'lang') return props.showLang
  if (annOrFn.type === 'meaning') return props.showMeaning
  return true
}

const emit = defineEmits(['hoverAnn', 'tapAnn'])

function resolveAnnKey(info, isVariantHover) {
  if (isVariantHover) {
    if (info.variantFootnote && isVisible(info.variantFootnote)) {
      return info.variantFootnote.key
    }
    const variantAnn = info.annKeys.find(a => a.isVariant && isVisible(a))
    const mainAnn = info.annKeys.find(a => !a.isVariant && isVisible(a))
    return (variantAnn && variantAnn.key) || (mainAnn && mainAnn.key) || null
  }
  if (info.footnote && isVisible(info.footnote)) {
    return info.footnote.key
  }
  const mainAnn = info.annKeys.find(a => !a.isVariant && isVisible(a))
  return (mainAnn && mainAnn.key) || null
}

function onHover(info, isVariantHover, event) {
  const key = resolveAnnKey(info, isVariantHover)
  if (key) {
    emit('hoverAnn', { key, y: event.currentTarget.getBoundingClientRect().top })
  }
}

// Тап по сноске (мобильное окошко); выбор ключа — тот же, что у наведения
function onTap(info, isVariantHover) {
  const key = resolveAnnKey(info, isVariantHover)
  if (key) {
    emit('tapAnn', key)
  }
}

function onLeave() {
  emit('hoverAnn', null)
}

const segmentInfo = computed(() => {
  return props.line.segments.map((seg, i) => {
    const annKeys = []
    let primaryKey = null
    let primaryType = null
    let primaryLocalIndex = null
    let footnote = null
    let variantFootnote = null

    if (props.line.annotations) {
      for (let a = 0; a < props.line.annotations.length; a++) {
        const ann = props.line.annotations[a]
        if (inRanges(i, ann.segment_range)) {
          const key = `${props.annKeyPrefix}-${a}`
          const type = ann.type || 'meaning'
          const isVariant = ann.target === 'variant'
          annKeys.push({ key, type, isVariant })

          if (primaryKey === null) {
            primaryKey = key
            primaryType = type
            primaryLocalIndex = a
          }

          const isLastOfThis = i === lastEnd(ann.segment_range) && !(ann.line_span && ann.line_span > 1)
          if (isLastOfThis) {
            const displayIndex = props.annNumberMap.get(key) || 0
            const fn = { key, type, displayIndex, text: ann.text }
            if (isVariant) {
              variantFootnote = fn
            } else {
              footnote = fn
            }
          }
        }
      }
    }

    for (const inh of props.inheritedAnnotations) {
      const inRange = !inh.segmentRange || inRanges(i, inh.segmentRange)
      if (inRange) {
        annKeys.push({ key: inh.key, type: inh.type })
        if (primaryKey === null) {
          primaryKey = inh.key
          primaryType = inh.type
        }
        if (inh.isLastSpannedLine) {
          const lastSeg = inh.segmentRange ? lastEnd(inh.segmentRange) : props.line.segments.length - 1
          if (i === lastSeg) {
            footnote = { key: inh.key, type: inh.type, displayIndex: inh.displayIndex, text: inh.text }
          }
        }
      }
    }

    return { seg, annKeys, primaryKey, primaryType, footnote, variantFootnote }
  })
})

</script>

<template>
  <div class="interlinear-line">
    <span
      v-for="(info, i) in segmentInfo"
      :key="i"
      class="segment"
      :class="{
        annotated: info.annKeys.some(a => isVisible(a)),
        'highlighted-lang': info.annKeys.some(a => a.key === hoveredAnnKey && a.type === 'lang' && !a.isVariant && isVisible(a)),
        'highlighted-meaning': info.annKeys.some(a => a.key === hoveredAnnKey && a.type === 'meaning' && !a.isVariant && isVisible(a)),
        'highlighted-variant':
          info.annKeys.some(a => a.key === hoveredAnnKey && a.isVariant && isVisible(a))
          || (info.seg.variant_ru
              && !info.annKeys.some(a => a.isVariant && isVisible(a))
              && info.annKeys.some(a => a.key === hoveredAnnKey && !a.isVariant && isVisible(a)))
      }"
    >
      <span class="ru-row"
        @mouseenter="onHover(info, false, $event)"
        @mouseleave="onLeave"
      >
        <span v-if="info.seg.variant_ru" class="variant-ru"
          @mouseenter.stop="onHover(info, true, $event)"
          @mouseleave.stop="onLeave"
        >{{ info.seg.variant_ru }}
          <FootnoteMark
            v-if="isVisible(info.variantFootnote)"
            :index="info.variantFootnote.displayIndex"
            :type="info.variantFootnote.type"
            :anchor-key="info.variantFootnote.key"
            @click.stop="onTap(info, true)"
          />
        </span>
        <span class="ru-word">{{ info.seg.ru || '\u00A0' }}</span>
        <FootnoteMark
          v-if="isVisible(info.footnote)"
          :index="info.footnote.displayIndex"
          :type="info.footnote.type"
          :anchor-key="info.footnote.key"
          @click.stop="onTap(info, false)"
        />
      </span>
      <span class="de-gloss">
        <template v-if="info.seg.variant_de">{{ info.seg.de }} / {{ info.seg.variant_de }}</template>
        <template v-else>{{ info.seg.de || '\u00A0' }}</template>
      </span>
    </span>
  </div>
</template>

<style scoped>
.interlinear-line {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  margin-bottom: 8px;
  align-items: flex-start;
}

.segment {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  position: relative;
}

.ru-row {
  display: inline-flex;
  align-items: baseline;
  position: relative;
}

.segment.annotated {
  border-radius: 2px;
  padding: 1px 3px;
  margin: -1px -3px;
  cursor: pointer;
  transition: background 0.15s;
}

.segment.highlighted-lang {
  background: var(--highlight-lang);
}

.segment.highlighted-meaning {
  background: var(--highlight-meaning);
}

.segment.highlighted-variant .variant-ru {
  background: var(--highlight-meaning);
  border-radius: 2px;
  padding: 0 2px;
  margin: 0 -2px;
}

.segment.highlighted-variant.highlighted-lang .variant-ru {
  background: var(--highlight-lang);
}

.ru-word {
  font-size: 1rem;
  color: var(--text);
}

.variant-ru {
  position: absolute;
  top: -1.2rem;
  left: 0;
  font-size: 1rem;
  color: var(--text);
  white-space: nowrap;
}

.de-gloss {
  font-size: 0.75rem;
  color: var(--de-text);
  font-style: italic;
  white-space: nowrap;
}

</style>
