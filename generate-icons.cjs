const { Jimp } = require('jimp')
const path = require('path')

async function createIcon(size, filename, isMaskable = false) {
  const image = new Jimp({ width: size, height: size, color: '#ffffff' })
  
  // Red/blue diagonal split
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const color = x + y < size ? 0xe74c3cff : 0x3498dbff
      image.setPixelColor(color, x, y)
    }
  }
  
  // Add a white border/circle effect for maskable to look better
  if (isMaskable) {
    const border = Math.floor(size * 0.1)
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (x < border || x >= size - border || y < border || y >= size - border) {
          image.setPixelColor(0xffffffff, x, y)
        }
      }
    }
  }
  
  await image.write(path.join(__dirname, 'public', filename))
  console.log(`Created ${filename}`)
}

async function main() {
  await createIcon(192, 'icon-192x192.png')
  await createIcon(512, 'icon-512x512.png')
  await createIcon(192, 'maskable-icon-192x192.png', true)
  await createIcon(180, 'apple-touch-icon.png')
}

main().catch(console.error)
