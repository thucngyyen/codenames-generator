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

  // --- Test 1: Operative share URL hides toggle ---
  console.log('\n=== Test 1: Operative share hides toggle ===')
  const page1 = await browser.newPage()
  await page1.goto('http://localhost:8765')
  await page1.waitForTimeout(500)

  // Generate and share as operative (toggle off spymaster first)
  await page1.locator('#view-toggle').click()
  await page1.waitForTimeout(200)
  await page1.locator('#share-btn').click()
  await page1.waitForTimeout(200)
  const operativeUrl = await page1.locator('#share-url').inputValue()
  await page1.locator('#close-modal-btn').click()

  const viewer1 = await browser.newPage()
  await viewer1.goto(operativeUrl)
  await viewer1.waitForTimeout(500)

  const toggleVisible1 = await viewer1.locator('.role-panel').isVisible()
  console.log(`Toggle visible in operative share: ${toggleVisible1}`)
  if (toggleVisible1) throw new Error('Toggle should be hidden in operative share')

  // Viewer should NOT be able to see colors
  const hasColors1 = await viewer1.evaluate(() =>
    Array.from(document.querySelectorAll('.card')).some(c =>
      c.classList.contains('red') || c.classList.contains('blue')
    )
  )
  console.log(`Colors visible in operative share: ${hasColors1}`)
  if (hasColors1) throw new Error('Colors should not be visible in operative share')

  // --- Test 2: Spymaster share URL shows toggle, requires password ---
  console.log('\n=== Test 2: Spymaster share requires password ===')
  await page1.locator('#view-toggle').click()
  await page1.waitForTimeout(200)
  await page1.locator('#share-btn').click()
  await page1.waitForTimeout(200)
  const spymasterUrl = await page1.locator('#share-url').inputValue()
  const password = await page1.locator('#share-password').inputValue()
  await page1.locator('#close-modal-btn').click()

  const viewer2 = await browser.newPage()
  await viewer2.goto(spymasterUrl)
  await viewer2.waitForTimeout(500)

  const toggleVisible2 = await viewer2.locator('.role-panel').isVisible()
  console.log(`Toggle visible in spymaster share: ${toggleVisible2}`)
  if (!toggleVisible2) throw new Error('Toggle should be visible in spymaster share')

  // Should start in operative mode
  const hasColors2 = await viewer2.evaluate(() =>
    Array.from(document.querySelectorAll('.card')).some(c =>
      c.classList.contains('red') || c.classList.contains('blue')
    )
  )
  console.log(`Colors visible initially: ${hasColors2}`)
  if (hasColors2) throw new Error('Should start in operative mode')

  // Click toggle, should show password prompt
  await viewer2.locator('#view-toggle').click()
  await viewer2.waitForTimeout(200)

  const overlayVisible = await viewer2.locator('.password-overlay').isVisible()
  console.log(`Password overlay shown: ${overlayVisible}`)
  if (!overlayVisible) throw new Error('Password overlay should be shown')

  // Toggle checkbox should be reverted
  const toggleChecked = await viewer2.locator('#view-toggle').isChecked()
  console.log(`Toggle checked after click: ${toggleChecked}`)
  if (toggleChecked) throw new Error('Toggle should be unchecked while prompt is shown')

  // Enter correct password
  await viewer2.locator('#password-input').fill(password)
  await viewer2.locator('#password-submit').click()
  await viewer2.waitForTimeout(300)

  const overlayHidden = await viewer2.locator('.password-overlay').isHidden()
  console.log(`Overlay hidden after password: ${overlayHidden}`)
  if (!overlayHidden) throw new Error('Overlay should be hidden after correct password')

  const hasColors3 = await viewer2.evaluate(() =>
    Array.from(document.querySelectorAll('.card')).some(c =>
      c.classList.contains('red') || c.classList.contains('blue')
    )
  )
  console.log(`Colors visible after unlock: ${hasColors3}`)
  if (!hasColors3) throw new Error('Colors should be visible after unlock')

  // Now toggle back to operative
  await viewer2.locator('#view-toggle').click()
  await viewer2.waitForTimeout(200)

  const hasColors4 = await viewer2.evaluate(() =>
    Array.from(document.querySelectorAll('.card')).some(c =>
      c.classList.contains('red') || c.classList.contains('blue')
    )
  )
  console.log(`Colors hidden after toggle back: ${!hasColors4}`)
  if (hasColors4) throw new Error('Colors should be hidden after toggling back')

  // Toggle to spymaster again without password prompt
  await viewer2.locator('#view-toggle').click()
  await viewer2.waitForTimeout(200)

  const overlayVisible2 = await viewer2.locator('.password-overlay').isVisible()
  console.log(`Password overlay shown again: ${overlayVisible2}`)
  if (overlayVisible2) throw new Error('Should not prompt again after verification')

  const hasColors5 = await viewer2.evaluate(() =>
    Array.from(document.querySelectorAll('.card')).some(c =>
      c.classList.contains('red') || c.classList.contains('blue')
    )
  )
  console.log(`Colors visible after re-toggle: ${hasColors5}`)
  if (!hasColors5) throw new Error('Colors should be visible')

  // --- Test 3: Local mode toggle works freely ---
  console.log('\n=== Test 3: Local mode toggle works freely ===')
  await page1.locator('#generate-btn').click()
  await page1.waitForTimeout(200)

  const toggleVisible3 = await page1.locator('.role-panel').isVisible()
  console.log(`Toggle visible in local mode: ${toggleVisible3}`)
  if (!toggleVisible3) throw new Error('Toggle should be visible in local mode')

  // Local "New Game" keeps previous view mode; page1 was in spymaster so colors show
  const hasColorsBefore = await page1.evaluate(() =>
    Array.from(document.querySelectorAll('.card')).some(c =>
      c.classList.contains('red') || c.classList.contains('blue')
    )
  )
  console.log(`Colors visible before toggle: ${hasColorsBefore}`)

  await page1.locator('#view-toggle').click()
  await page1.waitForTimeout(200)

  const overlayVisible3 = await page1.locator('.password-overlay').isVisible()
  console.log(`Password overlay in local mode: ${overlayVisible3}`)
  if (overlayVisible3) throw new Error('No password overlay in local mode')

  const hasColors6 = await page1.evaluate(() =>
    Array.from(document.querySelectorAll('.card')).some(c =>
      c.classList.contains('red') || c.classList.contains('blue')
    )
  )
  console.log(`Colors visible after toggle: ${hasColors6}`)
  if (hasColorsBefore && hasColors6) throw new Error('Toggle should switch modes in local mode')

  await browser.close()
  server.close()
  console.log('\nAll viewer mode tests passed')
}

main().catch((err) => {
  console.error(err)
  server.close()
  process.exit(1)
})
