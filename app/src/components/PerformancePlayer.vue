<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import data from '../data/performances.json'
import { playback, registerSeek, unregisterSeek, registerControls, unregisterControls, setHighlight } from '../utils/playback.js'
import { syncedVideoIds } from '../utils/timings.js'

const props = defineProps({
  songD: { type: String, required: true }
})

const expanded = ref(false)

// Список исполнений текущей песни (уже отранжирован: первый — главный)
const videos = computed(() => data[props.songD] || [])

const selectedIndex = ref(0)
watch(() => props.songD, () => { selectedIndex.value = 0 })

const videoId = computed(() => {
  const v = videos.value[selectedIndex.value]
  return v ? v.videoId : null
})

// Записи этой песни с пословными таймингами — у них подсвечиваются слова (docs/rules/word-sync.md)
const synced = computed(() => new Set(syncedVideoIds(props.songD)))
const syncedVideo = computed(() => videos.value.find(v => synced.value.has(v.videoId)) || null)
const currentSynced = computed(() => !!videoId.value && synced.value.has(videoId.value))

function selectSynced() {
  const i = videos.value.findIndex(v => synced.value.has(v.videoId))
  if (i >= 0) selectedIndex.value = i
}

// ---- Плеер через YouTube IFrame Player API ------------------------------------
// API нужен, чтобы читать позицию записи (подсветка слова) и перематывать её по клику
// на слово. Если API не загрузился (блокировщик, нет сети) — обычный iframe без подсветки.

const API_SRC = 'https://www.youtube.com/iframe_api'
const HOST = 'https://www.youtube-nocookie.com'
let apiPromise = null

function loadApi() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT)
  if (apiPromise) return apiPromise
  apiPromise = new Promise((resolve, reject) => {
    const fail = (err) => { apiPromise = null; reject(err) }
    const timer = setTimeout(() => fail(new Error('YouTube API: timeout')), 10000)
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(timer)
      if (typeof prev === 'function') prev()
      resolve(window.YT)
    }
    const script = document.createElement('script')
    script.src = API_SRC
    script.async = true
    script.onerror = () => { clearTimeout(timer); fail(new Error('YouTube API: load error')) }
    document.head.appendChild(script)
  })
  return apiPromise
}

const frameRef = ref(null)
const apiFailed = ref(false)
let player = null          // экземпляр YT.Player
let playerReady = false
let loadedVideoId = null   // запись, загруженная в плеер
let mounting = false

const fallbackSrc = computed(() =>
  videoId.value
    ? `${HOST}/embed/${videoId.value}?rel=0&modestbranding=1&autoplay=1&playsinline=1`
    : ''
)

// Опрос позиции. YouTube сообщает время редко (несколько раз в секунду), поэтому между
// сообщениями позиция интерполируется по часам страницы с учётом скорости воспроизведения.
let rafId = 0
let lastRaw = -1
let lastRawAt = 0
let lastEstimate = 0
let rate = 1

function readTime() {
  try { return player.getCurrentTime() || 0 } catch { return Math.max(lastRaw, 0) }
}

function readRate() {
  try { rate = player.getPlaybackRate() || 1 } catch { rate = 1 }
}

function stopPolling() {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = 0
}

function tick() {
  rafId = 0
  if (!player || playback.status !== 'playing') return
  const now = performance.now()
  const raw = readTime()
  if (raw !== lastRaw) {
    lastRaw = raw
    lastRawAt = now
  }
  let est = lastRaw + ((now - lastRawAt) / 1000) * rate
  // Мелкую поправку назад (запоздавшее сообщение плеера) не откатываем — подсветка
  // не дёргается; большой скачок — перемотка, принимаем как есть
  if (est < lastEstimate && lastEstimate - est < 0.5) est = lastEstimate
  lastEstimate = est
  playback.time = est
  rafId = requestAnimationFrame(tick)
}

function startPolling() {
  stopPolling()
  lastRaw = -1
  lastEstimate = readTime()
  rafId = requestAnimationFrame(tick)
}

function onStateChange(e) {
  const S = window.YT.PlayerState
  if (e.data === S.PLAYING) {
    readRate()
    playback.status = 'playing'
    startPolling()
  } else if (e.data === S.PAUSED) {
    stopPolling()
    playback.time = readTime()
    playback.status = 'paused'
  } else if (e.data === S.ENDED) {
    stopPolling()
    playback.status = 'ended'
  } else if (e.data === S.BUFFERING) {
    // Буферизация посреди записи: позиция стоит, статус не меняем (подсветка остаётся)
    stopPolling()
    playback.time = readTime()
  } else {
    // UNSTARTED / CUED — загружена новая запись
    stopPolling()
    playback.time = 0
    playback.status = 'idle'
  }
}

function onReady() {
  playerReady = true
  readRate()
  // Пока плеер создавался, могли выбрать другую запись
  if (videoId.value && videoId.value !== loadedVideoId) loadVideo(videoId.value)
}

function loadVideo(id) {
  loadedVideoId = id
  playback.videoId = id
  playback.time = 0
  playback.status = 'idle'
  if (player && playerReady) {
    try { player.loadVideoById(id) } catch { /* плеер уже разрушен */ }
  }
}

function seek(t) {
  if (!player || !playerReady) return
  try {
    player.seekTo(t, true)
    player.playVideo()
  } catch { /* плеер уже разрушен */ }
}

// Плей/пауза для плавающей кнопки (мобильная раскладка)
const controls = {
  play() { if (player && playerReady) { try { player.playVideo() } catch { /* плеер уже разрушен */ } } },
  pause() { if (player && playerReady) { try { player.pauseVideo() } catch { /* плеер уже разрушен */ } } }
}

async function mountPlayer() {
  if (player || mounting || apiFailed.value) return
  if (!frameRef.value || !videoId.value) return
  mounting = true
  let YT
  try {
    YT = await loadApi()
  } catch {
    mounting = false
    apiFailed.value = true
    return
  }
  mounting = false
  // За время загрузки API панель могли закрыть или сменить песню
  if (player || !expanded.value || !frameRef.value || !videoId.value) return
  const mount = document.createElement('div')
  frameRef.value.appendChild(mount)
  loadedVideoId = videoId.value
  playback.videoId = loadedVideoId
  playback.time = 0
  playback.status = 'idle'
  player = new YT.Player(mount, {
    host: HOST,
    videoId: loadedVideoId,
    playerVars: {
      rel: 0,
      modestbranding: 1,
      autoplay: 1,
      playsinline: 1,
      origin: window.location.origin
    },
    events: {
      onReady,
      onStateChange,
      onPlaybackRateChange: readRate
    }
  })
  registerSeek(seek)
  registerControls(controls)
}

function destroyPlayer() {
  stopPolling()
  unregisterSeek(seek)
  unregisterControls(controls)
  if (player) {
    try { player.destroy() } catch { /* iframe уже удалён */ }
  }
  player = null
  playerReady = false
  loadedVideoId = null
  if (frameRef.value) frameRef.value.innerHTML = ''
  playback.videoId = null
  playback.time = 0
  playback.status = 'idle'
}

// Панель закрыли или записи не стало — разрушить плеер до того, как Vue уберёт его DOM
watch([expanded, videoId], ([exp, id]) => {
  if (!exp || !id) destroyPlayer()
})

// Панель открыта: создать плеер (когда контейнер уже в DOM) или переключить запись
watch([expanded, videoId], ([exp, id]) => {
  if (!exp || !id) return
  if (!player) mountPlayer()
  else if (id !== loadedVideoId) loadVideo(id)
}, { flush: 'post' })

onBeforeUnmount(destroyPlayer)

// Галочка «Подсвечивать слова по ходу исполнения» (общее состояние playback, запоминается в браузере)
const highlightOn = computed({
  get: () => playback.highlight,
  set: (v) => setHighlight(v)
})
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
          v-for="(v, i) in videos"
          :key="v.videoId"
          class="perf-name"
          :class="{ active: i === selectedIndex }"
          @click="selectedIndex = i"
        ><span class="perf-pname">{{ v.name }}</span><span class="perf-meta"><span
            v-if="synced.has(v.videoId)"
            class="perf-sync-mark"
            title="В этой записи есть подсветка слов"
            aria-label="Подсветка слов"
          ><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" aria-hidden="true">
              <line x1="4" y1="5.5" x2="20" y2="5.5" stroke-width="2" opacity="0.45" />
              <line x1="4" y1="12" x2="15" y2="12" stroke-width="3.6" />
              <line x1="4" y1="18.5" x2="18" y2="18.5" stroke-width="2" opacity="0.45" />
            </svg></span><span
            v-if="v.fragment"
            class="perf-frag"
            :title="'Неполная запись: ' + (v.fragment.stanzas || (v.fragment.sung + ' из ' + v.fragment.text + ' слов'))"
          >фрагмент</span><span class="perf-year">{{ v.year }}</span></span></button>
      </div>

      <template v-if="videoId">
        <div v-show="!apiFailed" ref="frameRef" class="perf-frame"></div>
        <div v-if="apiFailed" class="perf-frame">
          <iframe
            :key="videoId"
            :src="fallbackSrc"
            title="Исполнение"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>
        <div v-if="currentSynced && !apiFailed" class="perf-hint">
          <p>Если нажать на слово в тексте, исполнение перейдёт на соответствующее место.</p>
          <label class="perf-check">
            <input type="checkbox" v-model="highlightOn" />
            Подсвечивать слова по ходу исполнения
          </label>
        </div>
        <p v-else-if="syncedVideo && !apiFailed" class="perf-hint">
          Подсветка слов есть в записи <button class="perf-hint-link" @click="selectSynced">{{ syncedVideo.name }}</button>.
        </p>
      </template>
      <p v-else class="perf-none">Для этой песни записи пока не подобраны.</p>
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

.perf-meta {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
}

.perf-sync-mark {
  display: inline-flex;
  color: var(--accent);
}

.perf-name.active .perf-sync-mark {
  color: #fff;
}

.perf-frag {

  font-size: 0.72em;

  letter-spacing: 0.02em;

  padding: 0.05em 0.45em;

  border: 1px solid currentColor;

  border-radius: 0.6em;

  opacity: 0.7;

  margin-right: 0.5em;

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

.perf-frame :deep(iframe) {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}

.perf-hint {
  font-size: 0.8rem;
  line-height: 1.35;
  color: var(--text-secondary);
}

.perf-hint p {
  margin: 0;
}

.perf-check {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 8px;
  cursor: pointer;
  color: var(--text-secondary);
}

.perf-check input {
  cursor: pointer;
  accent-color: var(--text-secondary);
}

.perf-hint-link {
  font: inherit;
  color: var(--accent);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-decoration: underline;
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
