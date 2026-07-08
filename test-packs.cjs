const fs = require('fs')
const path = require('path')

function extractWords(content) {
  const match = content.match(/words:\s*(\[[\s\S]*?\])/)
  if (!match) throw new Error('No words array found')
  return eval(match[1])
}

const packsDir = path.join(__dirname, 'src', 'packs')
const packs = []
for (let i = 1; i <= 5; i++) {
  const content = fs.readFileSync(path.join(packsDir, `pack${i}.ts`), 'utf8')
  const words = extractWords(content)
  packs.push(words)
}

// Check each pack has 100 words
packs.forEach((pack, i) => {
  if (pack.length !== 100) {
    console.error(`Pack ${i + 1} has ${pack.length} words`)
    process.exit(1)
  }
})

// Check no duplicates within or across packs
const allLower = []
for (const pack of packs) {
  for (const word of pack) {
    allLower.push(word.toLowerCase())
  }
}
const unique = new Set(allLower)
if (unique.size !== 500) {
  console.error(`Found ${allLower.length - unique.size} duplicates across packs`)
  process.exit(1)
}

// Check getActiveWords from index.ts
const indexContent = fs.readFileSync(path.join(packsDir, 'index.ts'), 'utf8')
// We can't easily eval the TS, but we can verify the function exists
if (!indexContent.includes('export function getActiveWords')) {
  console.error('getActiveWords not found in index.ts')
  process.exit(1)
}

console.log('All pack validations passed:')
console.log('- Each pack has exactly 100 words')
console.log('- No duplicates within or across packs')
console.log('- getActiveWords function exists')
