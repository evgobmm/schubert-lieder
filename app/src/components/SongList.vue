<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { searchSongs, plural, textIndexReady } from '../utils/searchIndex.js'
import MatchText from './MatchText.vue'

const props = defineProps({
  songs: Array,
  sections: Array,
  current: Number
})

const emit = defineEmits(['select'])

const bodyRef = ref(null)
const inputRef = ref(null)

// Каноническая ссылка на песню — по номеру Дойча (слэш кодируется точкой)
function hrefFor(song) {
  return `?song=d${song.d.toLowerCase().replace(/\//g, '.')}`
}

// ---------- Разделы ----------

// Заголовок раздела: год — главное слово, уточнение — второстепенное.
// «1815 · январь–май» → { name: '1815', detail: 'январь–май', inline: true }
// «Die schöne Müllerin (D 795, 1823)» → { name: 'Die schöne Müllerin', detail: 'D 795 · 1823', inline: false }
function splitTitle(title) {
  let m = title.match(/^(\d{4}(?:–\d{4})?)(?:\s*·\s*(.+))?$/)
  if (m) return { name: m[1], detail: m[2] || '', inline: true }
  m = title.match(/^(.+?)\s*\((.+)\)$/)
  if (m) return { name: m[1], detail: m[2].replace(/,\s*/g, ' · '), inline: false }
  return { name: title, detail: '', inline: true }
}

// Песни, сгруппированные по разделам (порядок разделов — из sections.json);
// dups — названия, повторяющиеся внутри раздела: у них показывается D-номер
const groups = computed(() => {
  const list = props.songs || []
  const secs = props.sections && props.sections.length
    ? props.sections
    : [{ id: '_', title: '' }]
  const byId = new Map(secs.map(s => [s.id, { ...s, ...splitTitle(s.title || ''), songs: [], dups: new Set() }]))
  for (const song of list) {
    const g = byId.get(song.section) || byId.get('_')
    if (g) g.songs.push(song)
  }
  for (const g of byId.values()) {
    const seen = new Map()
    for (const s of g.songs) seen.set(s.title_de, (seen.get(s.title_de) || 0) + 1)
    for (const [t, n] of seen) if (n > 1) g.dups.add(t)
  }
  return [...byId.values()].filter(g => g.songs.length)
})

const currentSong = computed(() => (props.songs || []).find(s => s.number === props.current) || null)
const currentSectionId = computed(() => currentSong.value ? currentSong.value.section : null)

// Раскрытые разделы — независимо друг от друга; при загрузке открыт раздел текущей песни
const expanded = reactive(new Set(currentSectionId.value ? [currentSectionId.value] : []))

// Разделы, раскрытые программно (переход из поиска, смена песни извне), открываются без анимации:
// иначе прокрутка к строке считается по ещё не выросшей высоте и обрезается
const instant = reactive(new Set())

function toggle(id) {
  if (expanded.has(id)) expanded.delete(id)
  else expanded.add(id)
}

function isOpen(group) {
  return !group.title || expanded.has(group.id)
}

// Кнопка справа от слова «Песни»: свернуть все разделы (сворачиваются с той же анимацией)
function collapseAll() {
  expanded.clear()
}

// Показать текущую песню: раскрыть её раздел и прокрутить список так, чтобы строка была видна
// (только если она не видна целиком — иначе список не дёргается)
function revealCurrent(smooth) {
  const id = currentSectionId.value
  if (id && !expanded.has(id)) {
    instant.add(id)
    expanded.add(id)
  }
  nextTick(() => {
    const body = bodyRef.value
    const row = body && body.querySelector('.song-item.active')
    if (body && row) {
      const top = row.offsetTop // чтение форсирует раскладку — раздел уже в полной высоте
      const h = row.offsetHeight
      const headerH = 36 // липкий заголовок раздела перекрывает верх списка
      const viewTop = body.scrollTop + headerH
      const viewBottom = body.scrollTop + body.clientHeight
      if (top < viewTop || top + h > viewBottom) {
        body.scrollTo({ top: Math.max(0, top - body.clientHeight / 2 + h / 2), behavior: smooth ? 'smooth' : 'auto' })
      }
    }
    // Анимацию возвращаем после того, как раскрытое состояние уже отрисовано
    requestAnimationFrame(() => requestAnimationFrame(() => { if (id) instant.delete(id) }))
  })
}

watch(() => props.current, () => revealCurrent(true))

// ---------- Поиск ----------

const searchInput = ref('')
const searchResult = ref({ mode: null, hits: [] })
const activeIdx = ref(0)
const focused = ref(false)
let searchTimer = null

const query = computed(() => searchInput.value.trim())
const searching = computed(() => query.value.length >= 2 || /^d?\s*\d+/i.test(query.value))
const hits = computed(() => searchResult.value.hits)

function runSearch() {
  searchResult.value = searchSongs(props.songs || [], searchInput.value)
  activeIdx.value = 0
}

// Индекс текста песен пришёл (первый поиск по тексту) — повторить текущий запрос
watch(textIndexReady, () => { if (searching.value) runSearch() })

// Ввод подхватывается сразу; короткая пауза лишь склеивает быстрые нажатия
watch(searchInput, (q) => {
  clearTimeout(searchTimer)
  if (!q.trim()) { runSearch(); return }
  searchTimer = setTimeout(runSearch, 80)
})

const statusText = computed(() => {
  if (!searching.value) return ''
  const n = hits.value.length
  if (!n && searchResult.value.pending) return 'Ищу в тексте песен…'
  if (!n && searchResult.value.mode === null) return ''   // запрос набран, поиск ещё не запущен (пауза 80 мс)
  if (!n) return 'Ничего не найдено'
  if (searchResult.value.mode === 'text') return `В названиях нет · в тексте: ${plural(n, 'песня', 'песни', 'песен')}`
  return plural(n, 'песня', 'песни', 'песен')
})

function hitId(i) {
  return `song-hit-${i}`
}

function clearSearch() {
  clearTimeout(searchTimer)
  searchInput.value = ''
  searchResult.value = { mode: null, hits: [] }
  activeIdx.value = 0
}

function scrollActiveHit() {
  nextTick(() => {
    const el = document.getElementById(hitId(activeIdx.value))
    if (el) el.scrollIntoView({ block: 'nearest' })
  })
}

// Переход из поиска: открыть песню, показать её в списке (раздел раскроется сам), сбросить поиск
function goToHit(hit) {
  if (!hit || !hit.song.file) return
  clearSearch()
  emit('select', hit.song.number)
  nextTick(() => {
    const link = bodyRef.value && bodyRef.value.querySelector('.song-item.active .song-link')
    if (link) link.focus({ preventScroll: true })
  })
}

function onSearchKey(e) {
  if (!searching.value) {
    if (e.key === 'Escape') { clearSearch(); e.target.blur() }
    return
  }
  const n = hits.value.length
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      if (n) { activeIdx.value = (activeIdx.value + 1) % n; scrollActiveHit() }
      break
    case 'ArrowUp':
      e.preventDefault()
      if (n) { activeIdx.value = (activeIdx.value - 1 + n) % n; scrollActiveHit() }
      break
    case 'Enter':
      e.preventDefault()
      if (n) goToHit(hits.value[activeIdx.value])
      break
    case 'Escape':
      e.preventDefault()
      clearSearch()
      break
  }
}

// «/» или Ctrl/⌘+K из любого места страницы ставят курсор в поиск (пока сайдбар виден)
function onGlobalKey(e) {
  const t = e.target
  const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)
  const isK = (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'k'
  const isSlash = e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !typing
  if (!isK && !isSlash) return
  const el = inputRef.value
  if (!el || !el.offsetParent) return
  e.preventDefault()
  el.focus()
  el.select()
}

// Тень под строкой поиска, когда список прокручен
const scrolled = ref(false)
function onBodyScroll(e) {
  scrolled.value = e.target.scrollTop > 0
}

onMounted(() => {
  revealCurrent(false)
  window.addEventListener('keydown', onGlobalKey)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalKey)
  clearTimeout(searchTimer)
})
</script>

<template>
  <nav class="song-list" aria-label="Песни">
    <!-- Заголовок списка: на уровне названия песни в центре; не прокручивается вместе со списком -->
    <div class="list-title">
      <h2 class="sidebar-title">Песни</h2>
      <button
        class="collapse-all"
        type="button"
        data-tip="Свернуть все"
        aria-label="Свернуть все"
        @click="collapseAll"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M4.5 2.5L8 6l3.5-3.5" />
          <path d="M4.5 13.5L8 10l3.5 3.5" />
        </svg>
      </button>
    </div>
    <div class="list-head" :class="{ scrolled }">
      <div class="search-box">
        <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <line x1="16.5" y1="16.5" x2="21" y2="21" />
        </svg>
        <input
          ref="inputRef"
          v-model="searchInput"
          class="search-input"
          type="search"
          placeholder="Название, D-номер, поэт, исполнитель, текст"
          autocomplete="off"
          spellcheck="false"
          role="combobox"
          aria-label="Поиск по песням"
          aria-autocomplete="list"
          aria-controls="song-search-results"
          :aria-expanded="searching"
          :aria-activedescendant="searching && hits.length ? hitId(activeIdx) : null"
          @keydown="onSearchKey"
          @focus="focused = true"
          @blur="focused = false"
        />
        <kbd v-if="!searchInput && !focused" class="search-kbd" aria-hidden="true">/</kbd>
        <button
          v-if="searchInput"
          class="search-clear"
          type="button"
          aria-label="Очистить поиск"
          @click="clearSearch(); inputRef && inputRef.focus()"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
            <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
          </svg>
        </button>
      </div>
    </div>

    <div ref="bodyRef" class="list-body" @scroll.passive="onBodyScroll">
      <!-- Результаты поиска (вместо оглавления, пока введён запрос) -->
      <div v-if="searching" class="search-results">
        <p class="search-status" role="status" aria-live="polite">{{ statusText }}</p>
        <ul id="song-search-results" class="hits" role="listbox" aria-label="Результаты поиска">
          <li
            v-for="(hit, i) in hits"
            :id="hitId(i)"
            :key="hit.song.number"
            class="hit-item"
            role="option"
            :aria-selected="i === activeIdx"
            :class="{ 'kb-active': i === activeIdx, active: hit.song.number === current, disabled: !hit.song.file }"
          >
            <a
              v-if="hit.song.file"
              class="hit"
              :href="hrefFor(hit.song)"
              tabindex="-1"
              @click.exact.prevent="goToHit(hit)"
            >
              <span class="hit-title" lang="de"><MatchText :text="hit.song.title_de" :range="hit.de" /></span>
              <span class="hit-meta">
                <MatchText :text="`D ${hit.song.d}`" :range="hit.d ? [0, 2 + hit.song.d.length] : null" /><template v-if="hit.song.year"> · {{ hit.song.year }}</template><template v-if="hit.song.title_ru"> · <MatchText :text="hit.song.title_ru" :range="hit.ru" /></template>
              </span>
              <span v-if="hit.line" class="hit-line"><MatchText :text="hit.line.text" :range="hit.line.range" /></span>
            </a>
            <span v-else class="hit">
              <span class="hit-title" lang="de">{{ hit.song.title_de }}</span>
              <span class="hit-meta">страница готовится</span>
            </span>
          </li>
        </ul>
      </div>

      <!-- Оглавление: разделы раскрываются независимо; заголовок раздела липнет при прокрутке -->
      <div v-show="!searching" class="tree">
        <div v-for="group in groups" :key="group.id" class="song-group">
          <button
            v-if="group.title"
            class="group-header"
            type="button"
            :class="{ open: isOpen(group), 'has-active': group.id === currentSectionId }"
            :aria-expanded="isOpen(group)"
            :aria-controls="`section-${group.id}`"
            @click="toggle(group.id)"
          >
            <svg class="chev" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M4.5 2.5L8 6l-3.5 3.5" />
            </svg>
            <span class="group-label">
              <span class="group-name">{{ group.name }}</span><span v-if="group.detail" class="group-detail" :class="group.inline ? 'inline' : 'block'">{{ group.detail }}</span>
            </span>
            <span class="group-count" :aria-label="plural(group.songs.length, 'песня', 'песни', 'песен')">{{ group.songs.length }}</span>
          </button>
          <div class="group-body" :class="{ open: isOpen(group), instant: instant.has(group.id) }">
            <ul :id="`section-${group.id}`" class="group-items">
              <li
                v-for="song in group.songs"
                :key="song.number"
                class="song-item"
                :class="{ active: song.number === current, disabled: !song.file }"
              >
                <a
                  v-if="song.file"
                  class="song-link"
                  :href="hrefFor(song)"
                  :aria-current="song.number === current ? 'page' : null"
                  @click.exact.prevent="$emit('select', song.number)"
                >
                  <span class="song-title" lang="de">{{ song.title_de }}</span>
                  <span v-if="group.dups.has(song.title_de)" class="song-d">D {{ song.d }}</span>
                </a>
                <span v-else class="song-link">
                  <span class="song-title" lang="de">{{ song.title_de }}</span>
                  <span v-if="group.dups.has(song.title_de)" class="song-d">D {{ song.d }}</span>
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.song-list {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  font-family: var(--font-sans);
}

.song-list ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

/* ---------- Заголовок «Песни» и кнопка «Свернуть все» ---------- */
.list-title {
  flex: none;
  position: relative;
  z-index: 4;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 35px 16px 26px 26px;
}

.sidebar-title {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 1.35rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--text);
}

.collapse-all {
  position: relative;
  flex: none;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: 5px;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}

.collapse-all:hover {
  background: color-mix(in srgb, var(--text) 8%, transparent);
  color: var(--text);
}

.collapse-all:active {
  background: color-mix(in srgb, var(--text) 14%, transparent);
}

.collapse-all:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

/* Подсказка: появляется под кнопкой с небольшой задержкой при наведении, сразу — при фокусе с клавиатуры */
.collapse-all::after {
  content: attr(data-tip);
  position: absolute;
  top: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  padding: 3px 8px;
  border-radius: 4px;
  background: var(--text);
  color: var(--bg);
  font-family: var(--font-sans);
  font-size: 0.72rem;
  font-weight: 500;
  line-height: 1.5;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.12s ease;
}

.collapse-all:hover::after {
  opacity: 1;
  transition-delay: 0.4s;
}

.collapse-all:focus-visible::after {
  opacity: 1;
}

/* ---------- Строка поиска (не прокручивается вместе со списком) ---------- */
.list-head {
  flex: none;
  position: relative;
  z-index: 3;
  padding: 0 16px 8px;
  transition: box-shadow 0.15s;
}

.list-head.scrolled {
  box-shadow: 0 1px 0 var(--border);
}

.search-box {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 34px;
  padding: 0 30px 0 32px;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  appearance: none;
  -webkit-appearance: none;
}

.search-input::-webkit-search-cancel-button,
.search-input::-webkit-search-decoration {
  -webkit-appearance: none;
  display: none;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 18%, transparent);
}

.search-input::placeholder {
  color: var(--text-secondary);
  opacity: 0.7;
}

/* Подсказка клавиши «/» — пока поле пустое и не в фокусе */
.search-kbd {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  padding: 0 5px;
  font-family: var(--font-sans);
  font-size: 0.68rem;
  font-weight: 500;
  line-height: 1.5;
  color: var(--text-secondary);
  background: var(--sidebar-bg);
  border: 1px solid var(--border);
  border-radius: 4px;
  pointer-events: none;
}

.search-clear {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
}

.search-clear:hover {
  background: color-mix(in srgb, var(--text) 10%, transparent);
  color: var(--text);
}

/* ---------- Прокручиваемая часть ---------- */
.list-body {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow-y: auto;
  padding: 4px 10px 28px 16px;
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--text) 22%, transparent) transparent;
  scrollbar-gutter: stable;
}

/* ---------- Результаты поиска ---------- */
.search-status {
  padding: 2px 8px 6px;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.hit-item {
  border-radius: 6px;
}

.hit {
  display: block;
  padding: 6px 8px;
  border-radius: 6px;
  color: var(--text);
  text-decoration: none;
}

.hit-item:hover:not(.disabled) > .hit {
  background: color-mix(in srgb, var(--text) 6%, transparent);
}

/* Выбор с клавиатуры (↑/↓) — отдельно от наведения мыши */
.hit-item.kb-active > .hit {
  background: color-mix(in srgb, var(--text) 8%, transparent);
  box-shadow: inset 2px 0 0 var(--accent);
}

.hit-item.active .hit-title {
  color: var(--accent);
}

.hit-item.disabled > .hit {
  opacity: 0.45;
}

.hit-title {
  display: block;
  font-size: 0.8125rem;
  line-height: 1.35;
}

.hit-meta {
  display: block;
  margin-top: 1px;
  font-size: 0.72rem;
  line-height: 1.35;
  color: var(--text-secondary);
}

.hit-line {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  margin-top: 2px;
  font-size: 0.75rem;
  line-height: 1.35;
  font-style: italic;
  color: var(--text-secondary);
}

/* ---------- Оглавление ---------- */
.song-group + .song-group {
  margin-top: 2px;
}

.group-header {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  width: 100%;
  padding: 7px 8px 7px 6px;
  border: none;
  border-radius: 6px;
  background: var(--sidebar-bg);
  cursor: pointer;
  text-align: left;
  font-family: var(--font-sans);
  font-size: 0.875rem;
  line-height: 1.3;
  color: var(--text);
}

/* Подложка под липким заголовком: закрывает верхний отступ списка и углы за скруглением */
.group-header::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: -4px;
  bottom: 0;
  background: var(--sidebar-bg);
  z-index: -1;
}

.group-header:hover {
  background: color-mix(in srgb, var(--text) 7%, var(--sidebar-bg));
}

.group-header:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}

.chev {
  flex: none;
  margin-top: 3px;
  color: var(--text-secondary);
  transition: transform 0.2s ease;
}

.group-header.open .chev {
  transform: rotate(90deg);
}

.group-label {
  flex: 1;
  min-width: 0;
}

.group-name {
  font-weight: 600;
}

.group-detail {
  font-weight: 400;
  color: var(--text-secondary);
}

.group-detail.inline {
  margin-left: 0.4em;
}

.group-detail.block {
  display: block;
  margin-top: 1px;
  font-size: 0.75rem;
}

/* Свёрнутый раздел с текущей песней — виден и так */
.group-header.has-active:not(.open) .group-name {
  color: var(--accent);
}

.group-count {
  flex: none;
  margin-top: 2px;
  font-size: 0.72rem;
  font-weight: 400;
  font-variant-numeric: tabular-nums;
  color: var(--text-secondary);
}

/* Раскрытие с анимацией высоты (grid 0fr → 1fr), без измерений в JS */
.group-body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.22s ease;
}

.group-body.open {
  grid-template-rows: 1fr;
}

.group-items {
  min-height: 0;
  overflow: hidden;
  visibility: hidden;
  transition: visibility 0s linear 0.22s;
  margin-left: 11px;
  padding-left: 5px;
  border-left: 1px solid var(--border);
}

.group-body.open > .group-items {
  visibility: visible;
  transition-delay: 0s;
}

.group-body.instant,
.group-body.instant > .group-items {
  transition: none;
}

.group-items > li:first-child {
  margin-top: 2px;
}

.group-items > li:last-child {
  margin-bottom: 8px;
}

.song-item {
  border-radius: 5px;
}

.song-link {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 4px 8px 4px 9px;
  border-radius: 5px;
  font-size: 0.8125rem;
  line-height: 1.4;
  color: var(--text);
  text-decoration: none;
}

.song-title {
  flex: 1;
  min-width: 0;
}

.song-d {
  flex: none;
  font-size: 0.7rem;
  font-variant-numeric: tabular-nums;
  color: var(--text-secondary);
}

.song-item:hover:not(.disabled) > .song-link {
  background: color-mix(in srgb, var(--text) 7%, transparent);
}

.song-item.active > .song-link {
  background: color-mix(in srgb, var(--accent) 13%, transparent);
  color: var(--accent);
  box-shadow: inset 2px 0 0 var(--accent);
}

.song-item.active:hover > .song-link {
  background: color-mix(in srgb, var(--accent) 20%, transparent);
}

.song-item.active .song-d {
  color: var(--accent);
  opacity: 0.8;
}

a.song-link:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}

.song-item.disabled {
  opacity: 0.4;
}

@media (prefers-reduced-motion: reduce) {
  .group-body,
  .group-items,
  .chev,
  .list-head,
  .collapse-all,
  .collapse-all::after {
    transition: none;
  }
}
</style>
