export function mulberry32(seed: string): () => number {
  // FNV-1a-style seed mixing
  let n = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    n = Math.imul(n ^ seed.charCodeAt(i), 16777619)
  }

  return function () {
    n |= 0
    n = (n + 0x6d2b79f5) | 0
    let t = n
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
