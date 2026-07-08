import { generateBoard } from './src/generator'

// Test 1: Board has exactly 25 cells
const board = generateBoard({ seed: 'test1', activePackIds: ['pack1', 'pack2', 'pack3', 'pack4', 'pack5'], firstTeam: 'random' })
if (board.cells.length !== 25) {
  console.error('Expected 25 cells, got', board.cells.length)
  process.exit(1)
}
console.log('Test 1 passed: 25 cells')

// Test 2: No duplicate words
const words = board.cells.map(c => c.word)
const uniqueWords = new Set(words)
if (uniqueWords.size !== 25) {
  console.error('Duplicate words found')
  process.exit(1)
}
console.log('Test 2 passed: No duplicate words')

// Test 3: Color distribution 9/8/7/1
const counts = { red: 0, blue: 0, neutral: 0, assassin: 0 }
for (const cell of board.cells) {
  counts[cell.color]++
}
const first = board.firstTeam
const second = first === 'red' ? 'blue' : 'red'
if (counts[first] !== 9 || counts[second] !== 8 || counts.neutral !== 7 || counts.assassin !== 1) {
  console.error('Wrong color distribution:', counts)
  process.exit(1)
}
console.log('Test 3 passed: Color distribution 9/8/7/1')

// Test 4: Same seed + packs = identical board
const boardA = generateBoard({ seed: 'repeat', activePackIds: ['pack1', 'pack2'], firstTeam: 'random' })
const boardB = generateBoard({ seed: 'repeat', activePackIds: ['pack1', 'pack2'], firstTeam: 'random' })
if (JSON.stringify(boardA) !== JSON.stringify(boardB)) {
  console.error('Same seed produced different boards')
  process.exit(1)
}
console.log('Test 4 passed: Deterministic with same seed')

// Test 5: Throws when < 25 words
let threw = false
try {
  generateBoard({ seed: 'toofew', activePackIds: [], firstTeam: 'random' })
} catch (e) {
  threw = true
}
if (!threw) {
  console.error('Should have thrown with empty packs')
  process.exit(1)
}
console.log('Test 5 passed: Throws with < 25 words')

console.log('All generator tests passed')
