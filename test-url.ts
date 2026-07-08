import { encodeBoard, decodeBoard, copyToClipboard } from './src/url'
import { generateBoard } from './src/generator'
import type { ViewMode } from './src/types'

// Test 1: Encode then decode produces identical values
const board = generateBoard({
  seed: 'test-url',
  activePackIds: ['pack1', 'pack2'],
  firstTeam: 'red',
})
const viewMode: ViewMode = 'spymaster'
const encoded = encodeBoard(board, viewMode, ['pack1', 'pack2'])
const decoded = decodeBoard(encoded)
if (!decoded) {
  console.error('Decode failed')
  process.exit(1)
}
if (
  decoded.seed !== board.seed ||
  decoded.firstTeam !== board.firstTeam ||
  decoded.viewMode !== viewMode ||
  decoded.activePackIds.join(',') !== 'pack1,pack2'
) {
  console.error('Decode mismatch:', decoded)
  process.exit(1)
}
console.log('Test 1 passed: Encode/decode roundtrip')

// Test 2: Decoded hash regenerates identical board
const board2 = generateBoard({
  seed: decoded.seed,
  activePackIds: decoded.activePackIds,
  firstTeam: decoded.firstTeam,
})
if (JSON.stringify(board) !== JSON.stringify(board2)) {
  console.error('Board regeneration mismatch')
  process.exit(1)
}
console.log('Test 2 passed: Decoded hash regenerates identical board')

// Test 3: Invalid hash silently returns null
const bad = decodeBoard('not-valid!!!')
if (bad !== null) {
  console.error('Invalid hash should return null')
  process.exit(1)
}
console.log('Test 3 passed: Invalid hash returns null')

// Test 4: Clipboard fallback (can't fully test in Node, but function exists)
if (typeof copyToClipboard !== 'function') {
  console.error('copyToClipboard not exported')
  process.exit(1)
}
console.log('Test 4 passed: copyToClipboard exported')

console.log('All URL tests passed')
