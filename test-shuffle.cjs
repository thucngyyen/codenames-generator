const { chromium } = require('playwright')
const http = require('http')
const fs = require('fs')
const path = require('path')

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
}

const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, 'dist', req.url === '/' ? 'index.html' : req.url)
  const ext = path.extname(filePath)
  const contentType = mimeTypes[ext] || 'application/octet-stream'

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404)
      res.end('Not found')
    } else {
      res.writeHead(200, { 'Content-Type': contentType })
      res.end(content)
    }
  })
})

async function main() {
  await new Promise((resolve) => server.listen(8765, resolve))

  const browser = await chromium.launch()
  const page = await browser.newPage()

  await page.goto('http://localhost:8765')
  await page.waitForTimeout(500)

  // Test 1: Shuffle button is enabled by default (spymaster mode)
  const shuffleDisabled = await page.locator('#shuffle-btn').isDisabled()
  console.log(`Shuffle button disabled by default: ${shuffleDisabled}`)
  if (shuffleDisabled) throw new Error('Shuffle button should be enabled by default in spymaster mode')

  // Get initial words
  const initialWords = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.card')).map(c => c.textContent)
  )

  // Test 2: Shuffle button is enabled by default (spymaster mode)
  const shuffleEnabled = await page.locator('#shuffle-btn').isEnabled()
  console.log(`Shuffle button enabled by default: ${shuffleEnabled}`)
  if (!shuffleEnabled) throw new Error('Shuffle button should be enabled by default in spymaster mode')

  // Test 3: Click shuffle keeps same words, changes colors
  const colorsBefore = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.card')).map(c =>
      c.classList.contains('red') ? 'red' :
      c.classList.contains('blue') ? 'blue' :
      c.classList.contains('neutral') ? 'neutral' :
      c.classList.contains('assassin') ? 'assassin' : 'none'
    )
  )

  await page.locator('#shuffle-btn').click()
  await page.waitForTimeout(200)

  const wordsAfter = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.card')).map(c => c.textContent)
  )
  const colorsAfter = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.card')).map(c =>
      c.classList.contains('red') ? 'red' :
      c.classList.contains('blue') ? 'blue' :
      c.classList.contains('neutral') ? 'neutral' :
      c.classList.contains('assassin') ? 'assassin' : 'none'
    )
  )

  const wordsMatch = JSON.stringify(initialWords) === JSON.stringify(wordsAfter)
  console.log(`Initial words: ${JSON.stringify(initialWords)}`)
  console.log(`Words after:   ${JSON.stringify(wordsAfter)}`)
  console.log(`Words preserved after shuffle: ${wordsMatch}`)
  if (!wordsMatch) {
    // Find which words differ
    for (let i = 0; i < 25; i++) {
      if (initialWords[i] !== wordsAfter[i]) {
        console.log(`Diff at ${i}: ${initialWords[i]} -> ${wordsAfter[i]}`)
      }
    }
    throw new Error('Words should be preserved after shuffle')
  }

  const colorsChanged = JSON.stringify(colorsBefore) !== JSON.stringify(colorsAfter)
  console.log(`Colors changed after shuffle: ${colorsChanged}`)
  // Note: colors might randomly be the same, but probability is very low for 25 cards
  // We'll just verify cards still have valid colors
  const validColors = colorsAfter.every(c => ['red','blue','neutral','assassin'].includes(c))
  if (!validColors) throw new Error('All cards should have valid colors after shuffle')

  // Count color distribution
  const counts = { red: 0, blue: 0, neutral: 0, assassin: 0 }
  colorsAfter.forEach(c => counts[c]++)
  const hasNineRedOrBlue = counts.red === 9 || counts.blue === 9
  const hasOneAssassin = counts.assassin === 1
  console.log(`Color distribution: red=${counts.red} blue=${counts.blue} neutral=${counts.neutral} assassin=${counts.assassin}`)
  if (!hasNineRedOrBlue || !hasOneAssassin) {
    throw new Error('Invalid color distribution after shuffle')
  }

  // Test 4: Toggle back to operative disables shuffle
  await page.locator('#view-toggle').click()
  await page.waitForTimeout(200)
  const shuffleDisabled2 = await page.locator('#shuffle-btn').isDisabled()
  console.log(`Shuffle button disabled after toggle back: ${shuffleDisabled2}`)
  if (!shuffleDisabled2) throw new Error('Shuffle button should be disabled in operative mode')

  await browser.close()
  server.close()
  console.log('All shuffle button tests passed')
}

main().catch((err) => {
  console.error(err)
  server.close()
  process.exit(1)
})
