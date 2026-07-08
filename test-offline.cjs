const { chromium } = require('playwright')
const http = require('http')
const fs = require('fs')
const path = require('path')

// Simple static file server
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
  console.log('Server running on http://localhost:8765')

  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  const errors = []
  page.on('pageerror', (err) => {
    console.error('Page error:', err.message)
    errors.push(err.message)
  })
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error('Console error:', msg.text())
      errors.push(msg.text())
    }
  })

  // Load page
  await page.goto('http://localhost:8765')
  await page.waitForTimeout(1000)

  // Check board renders
  const cards = await page.locator('.card').count()
  console.log(`Cards found: ${cards}`)
  if (cards !== 25) {
    throw new Error(`Expected 25 cards, got ${cards}`)
  }

  // Check seed displayed
  const seedText = await page.locator('.footer').textContent()
  console.log(`Seed: ${seedText}`)
  if (!seedText || !seedText.includes('Seed:')) {
    throw new Error('Seed not displayed')
  }

  // Check service worker registration
  const swRegistered = await page.evaluate(() => {
    return navigator.serviceWorker?.controller !== null || navigator.serviceWorker?.ready !== undefined
  })
  console.log(`Service Worker registered: ${swRegistered}`)

  // Colors should be visible by default (spymaster mode)
  const hasColors = await page.evaluate(() => {
    const cards = document.querySelectorAll('.card')
    return Array.from(cards).some(c => c.classList.contains('red') || c.classList.contains('blue'))
  })
  console.log(`Spymaster colors visible by default: ${hasColors}`)
  if (!hasColors) {
    throw new Error('Spymaster colors should be visible by default')
  }

  // Toggle to operative mode
  await page.locator('#view-toggle').click()
  await page.waitForTimeout(200)

  const noColors = await page.evaluate(() => {
    const cards = document.querySelectorAll('.card')
    return !Array.from(cards).some(c => c.classList.contains('red') || c.classList.contains('blue'))
  })
  console.log(`Operative mode hides colors: ${noColors}`)
  if (!noColors) {
    throw new Error('Operative mode should hide colors')
  }

  // Toggle back to spymaster
  await page.locator('#view-toggle').click()
  await page.waitForTimeout(200)

  const colorsBack = await page.evaluate(() => {
    const cards = document.querySelectorAll('.card')
    return Array.from(cards).some(c => c.classList.contains('red') || c.classList.contains('blue'))
  })
  console.log(`Spymaster colors restored: ${colorsBack}`)
  if (!colorsBack) {
    throw new Error('Spymaster colors should be restored')
  }

  // Generate new board
  await page.locator('#generate-btn').click()
  await page.waitForTimeout(200)

  const cardsAfter = await page.locator('.card').count()
  if (cardsAfter !== 25) {
    throw new Error(`Expected 25 cards after generate, got ${cardsAfter}`)
  }

  // Check for console errors
  if (errors.length > 0) {
    throw new Error(`Console errors found: ${errors.join(', ')}`)
  }

  // Test offline by blocking network
  await context.setOffline(true)
  console.log('Network disabled')

  // Refresh page offline
  await page.reload()
  await page.waitForTimeout(1000)

  const cardsOffline = await page.locator('.card').count()
  console.log(`Cards offline: ${cardsOffline}`)
  if (cardsOffline !== 25) {
    throw new Error(`Expected 25 cards offline, got ${cardsOffline}`)
  }

  // Toggle offline
  await page.locator('#view-toggle').click()
  await page.waitForTimeout(200)

  // Generate offline
  await page.locator('#generate-btn').click()
  await page.waitForTimeout(200)

  const cardsOfflineGen = await page.locator('.card').count()
  console.log(`Cards after offline generate: ${cardsOfflineGen}`)
  if (cardsOfflineGen !== 25) {
    throw new Error(`Expected 25 cards after offline generate, got ${cardsOfflineGen}`)
  }

  // Check no new console errors
  if (errors.length > 0) {
    throw new Error(`Console errors found: ${errors.join(', ')}`)
  }

  await browser.close()
  server.close()
  console.log('All offline tests passed')
}

main().catch((err) => {
  console.error(err)
  server.close()
  process.exit(1)
})
