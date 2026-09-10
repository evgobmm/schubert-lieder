import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Индекс для поиска по тексту песен: строки всех песен одним модулем, который приложение
// подгружает только при первом поиске по тексту (utils/searchIndex.js). Модуль собирается
// из файлов песен на сборке, поэтому не отстаёт от текстов; сами файлы песен в основной
// бандл больше не входят — SongView грузит песню по требованию (docs/rules/word-sync.md).
const songsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'src/data/songs')
const VIRTUAL_ID = 'virtual:search-text'
const RESOLVED_ID = '\0' + VIRTUAL_ID

function searchTextPlugin() {
  return {
    name: 'search-text',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },
    load(id) {
      if (id !== RESOLVED_ID) return
      const out = {}
      for (const file of fs.readdirSync(songsDir).filter(f => f.endsWith('.json')).sort()) {
        const song = JSON.parse(fs.readFileSync(path.join(songsDir, file), 'utf8'))
        const lines = []
        for (const stanza of song.stanzas || []) {
          for (const de of stanza.lines_de || []) lines.push(de)
          for (const ru of stanza.lines_ru || []) {
            if (ru && ru.segments) lines.push(ru.segments.map(s => s.ru).join(' '))
          }
        }
        out[file] = lines
      }
      return `export default ${JSON.stringify(out)}`
    }
  }
}

export default defineConfig({
  plugins: [vue(), searchTextPlugin()],
  base: '/schubert-lieder/'
})
