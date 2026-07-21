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

  // Default is spymaster, click share directly
  // Click share
  await page.locator('#share-btn').click()
  await page.waitForTimeout(200)

  // Test 1: Share modal is visible
  const modalVisible = await page.locator('.modal-overlay').isVisible()
  console.log(`Share modal visible: ${modalVisible}`)
  if (!modalVisible) throw new Error('Share modal should be visible')

  // Test 2: Password field is visible in spymaster mode
  const passwordFieldVisible = await page.locator('#share-password-field').isVisible()
  console.log(`Password field visible: ${passwordFieldVisible}`)
  if (!passwordFieldVisible) throw new Error('Password field should be visible in spymaster share')

  // Test 3: URL and password are populated
  const urlValue = await page.locator('#share-url').inputValue()
  const passwordValue = await page.locator('#share-password').inputValue()
  console.log(`URL: ${urlValue.substring(0, 50)}...`)
  console.log(`Password: ${passwordValue}`)
  if (!urlValue.includes('#')) throw new Error('URL should contain hash')
  if (!/^\d{4}$/.test(passwordValue)) throw new Error('Password should be 4 digits')

  // Test 4: Copy URL works
  await page.locator('#copy-url-btn').click()
  await page.waitForTimeout(200)

  // Close modal
  await page.locator('#close-modal-btn').click()
  await page.waitForTimeout(200)

  // Test 5: Open URL with password in new tab
  const newPage = await browser.newPage()
  await newPage.goto(urlValue)
  await newPage.waitForTimeout(500)

  // Board should be visible in operative mode, overlay hidden
  const overlayVisible = await newPage.locator('.password-overlay').isVisible()
  console.log(`Password overlay visible on load: ${overlayVisible}`)
  if (overlayVisible) throw new Error('Password overlay should NOT be visible on load')

  const cardsCount = await newPage.locator('.card').count()
  console.log(`Cards visible: ${cardsCount}`)
  if (cardsCount !== 25) throw new Error('Board should be visible')

  // Toggle should be visible
  const toggleVisible = await newPage.locator('.role-panel').isVisible()
  console.log(`Toggle visible: ${toggleVisible}`)
  if (!toggleVisible) throw new Error('Toggle should be visible in spymaster share')

  // Click toggle to trigger password prompt
  await newPage.locator('#view-toggle').click()
  await newPage.waitForTimeout(200)

  const overlayAfterClick = await newPage.locator('.password-overlay').isVisible()
  console.log(`Password overlay after toggle click: ${overlayAfterClick}`)
  if (!overlayAfterClick) throw new Error('Password overlay should be visible after toggle click')

  // Toggle checkbox should be reverted
  const toggleChecked = await newPage.locator('#view-toggle').isChecked()
  console.log(`Toggle checked after click: ${toggleChecked}`)
  if (toggleChecked) throw new Error('Toggle should be unchecked while prompt is shown')

  // Cards should still be beige (operative)
  const hasColors = await newPage.evaluate(() => {
    return Array.from(document.querySelectorAll('.card')).some(c =>
      c.classList.contains('red') || c.classList.contains('blue')
    )
  })
  console.log(`Colors visible before unlock: ${hasColors}`)
  if (hasColors) throw new Error('Colors should not be visible before password')

  // Enter wrong password
  await newPage.locator('#password-input').fill('0000')
  await newPage.locator('#password-submit').click()
  await newPage.waitForTimeout(200)

  const errorText = await newPage.locator('#password-error').textContent()
  console.log(`Error after wrong password: ${errorText}`)
  if (errorText !== 'Incorrect password') throw new Error('Should show incorrect password error')

  // Enter correct password
  await newPage.locator('#password-input').fill(passwordValue)
  await newPage.locator('#password-submit').click()
  await newPage.waitForTimeout(300)

  // Overlay should be hidden
  const overlayHidden = await newPage.locator('.password-overlay').isHidden()
  console.log(`Overlay hidden after correct password: ${overlayHidden}`)
  if (!overlayHidden) throw new Error('Overlay should be hidden after correct password')

  // Colors should now be visible
  const hasColorsAfter = await newPage.evaluate(() => {
    return Array.from(document.querySelectorAll('.card')).some(c =>
      c.classList.contains('red') || c.classList.contains('blue')
    )
  })
  console.log(`Colors visible after unlock: ${hasColorsAfter}`)
  if (!hasColorsAfter) throw new Error('Colors should be visible after correct password')

  // Test 6: Share from operative mode has no password
  await page.locator('#view-toggle').click()
  await page.waitForTimeout(200)
  await page.locator('#share-btn').click()
  await page.waitForTimeout(200)

  const operativePasswordField = await page.locator('#share-password-field').isVisible()
  console.log(`Password field visible in operative share: ${operativePasswordField}`)
  if (operativePasswordField) throw new Error('Password field should NOT be visible in operative share')

  await page.locator('#close-modal-btn').click()

  await browser.close()
  server.close()
  console.log('All password tests passed')
}

main().catch((err) => {
  console.error(err)
  server.close()
  process.exit(1)
})
