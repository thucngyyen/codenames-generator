import { mulberry32 } from './src/prng'

function getSequence(seed: string, count: number): number[] {
  const rng = mulberry32(seed)
  const seq: number[] = []
  for (let i = 0; i < count; i++) seq.push(rng())
  return seq
}

// Test 1: Same seed = same sequence
const seqA = getSequence('hello', 10)
const seqB = getSequence('hello', 10)
if (JSON.stringify(seqA) !== JSON.stringify(seqB)) {
  console.error('Same seed produced different sequences')
  process.exit(1)
}
console.log('Test 1 passed: Same seed = same sequence')

// Test 2: Different seeds = different sequences
const seqC = getSequence('world', 10)
if (JSON.stringify(seqA) === JSON.stringify(seqC)) {
  console.error('Different seeds produced same sequence')
  process.exit(1)
}
console.log('Test 2 passed: Different seeds = different sequences')

// Test 3: "ab" vs "ba" different
const seqAB = getSequence('ab', 10)
const seqBA = getSequence('ba', 10)
if (JSON.stringify(seqAB) === JSON.stringify(seqBA)) {
  console.error('"ab" and "ba" produced same sequence')
  process.exit(1)
}
console.log('Test 3 passed: "ab" vs "ba" different')

// Test 4: Distribution roughly uniform
const rng = mulberry32('uniform-test')
const buckets = new Array(10).fill(0)
for (let i = 0; i < 10000; i++) {
  const n = rng()
  buckets[Math.min(9, Math.floor(n * 10))]++
}
const avg = 10000 / 10
for (let i = 0; i < 10; i++) {
  const dev = Math.abs(buckets[i] - avg) / avg
  if (dev > 0.1) {
    console.error(`Bucket ${i} deviates too much: ${buckets[i]} (expected ~${avg})`)
    process.exit(1)
  }
}
console.log('Test 4 passed: Distribution roughly uniform')
console.log('All PRNG tests passed')
