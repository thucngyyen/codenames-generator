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

  // Test: Footer shows seed and first team
  const footerText = await page.locator('.footer').textContent()
  console.log(`Footer: ${footerText}`)
  
  const hasSeed = footerText.includes('Seed:')
  const hasRedOrBlue = footerText.includes('RED goes first') || footerText.includes('BLUE goes first')
  console.log(`Has seed: ${hasSeed}, Has first team: ${hasRedOrBlue}`)
  
  if (!hasSeed || !hasRedOrBlue) {
    throw new Error('Footer should show seed and first team')
  }

  // Generate new board (already in spymaster mode by default)
  await page.locator('#generate-btn').click()
  await page.waitForTimeout(200)

  const footerAfter = await page.locator('.footer').textContent()
  console.log(`Footer after generate: ${footerAfter}`)
  const stillHasTeam = footerAfter.includes('RED goes first') || footerAfter.includes('BLUE goes first')
  if (!stillHasTeam) {
    throw new Error('First team should still show after generate')
  }

  // Shuffle secret
  await page.locator('#shuffle-btn').click()
  await page.waitForTimeout(200)

  const footerShuffle = await page.locator('.footer').textContent()
  console.log(`Footer after shuffle: ${footerShuffle}`)
  const stillHasTeamAfterShuffle = footerShuffle.includes('RED goes first') || footerShuffle.includes('BLUE goes first')
  if (!stillHasTeamAfterShuffle) {
    throw new Error('First team should still show after shuffle')
  }

  await browser.close()
  server.close()
  console.log('All first-team tests passed')
}

main().catch((err) => {
  console.error(err)
  server.close()
  process.exit(1)
})
