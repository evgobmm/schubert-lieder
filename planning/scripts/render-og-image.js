// Рендер карточки-превью og-card.html в app/public/og-image.png (1200×630) headless-браузером.
// Playwright в проекте не установлен: ставится в scratchpad (npm i playwright@1.62.1, браузеры уже в ~/.cache/ms-playwright)
// и подключается через NODE_PATH:  NODE_PATH=<scratchpad>/node_modules node planning/scripts/render-og-image.js
// Локальной сборки не требует; после коммита картинку раздаёт GitHub Pages как /schubert-lieder/og-image.png.
const path = require('path')
const { chromium } = require('playwright')
const card = 'file://' + path.resolve(__dirname, 'og-card.html')
const out = path.resolve(__dirname, '../../app/public/og-image.png')
;(async () => {
  const browser = await chromium.launch({ args: ['--disable-dev-shm-usage', '--disable-gpu'] })
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
  await page.goto(card, { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  const ok = await page.evaluate(() => ["700 20px 'Playfair Display'", "400 20px 'Source Serif 4'", "400 20px 'Inter'"].map(f => document.fonts.check(f)))
  if (ok.some(v => !v)) console.error('внимание: не все шрифты загрузились', ok)
  await page.waitForTimeout(300)
  await page.screenshot({ path: out, type: 'png' })
  await browser.close()
  console.log('written', out)
})()
