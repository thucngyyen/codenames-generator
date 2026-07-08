import { getActiveWords } from './packs'
import { mulberry32 } from './prng'
import type { Board, Cell, CardColor } from './types'

export interface BoardConfig {
  seed: string
  activePackIds: string[]
  firstTeam: 'red' | 'blue' | 'random'
  words?: string[]
  customWords?: Map<number, string>
}

function shuffle<T>(array: T[], rng: () => number): T[] {
  const arr = array.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function generateBoard(config: BoardConfig): Board {
  let shuffledWords: string[]
  if (config.words) {
    shuffledWords = config.words
    if (shuffledWords.length !== 25) {
      throw new Error(`Expected 25 words, got ${shuffledWords.length}`)
    }
  } else {
    const pool = getActiveWords(config.activePackIds)
    if (pool.length < 25) {
      throw new Error(
        `Need at least 25 unique words, but got ${pool.length} from selected packs`
      )
    }
    const rngWords = mulberry32(config.seed + ':words')
    shuffledWords = shuffle(pool, rngWords).slice(0, 25)
  }

  const rngColors = mulberry32(config.seed + ':colors')

  // Apply custom word overrides
  if (config.customWords) {
    for (const [index, word] of config.customWords) {
      if (index >= 0 && index < shuffledWords.length) {
        shuffledWords[index] = word
      }
    }
  }

  // Always consume the first RNG call so color shuffle starts from the same
  // state whether firstTeam is 'random' or pre-determined from a shared URL.
  const randomFirstTeam = rngColors() < 0.5 ? 'red' : 'blue'
  let firstTeam: 'red' | 'blue'
  if (config.firstTeam === 'random') {
    firstTeam = randomFirstTeam
  } else {
    firstTeam = config.firstTeam
  }

  const secondTeam: CardColor = firstTeam === 'red' ? 'blue' : 'red'
  const colors: CardColor[] = [
    ...Array(9).fill(firstTeam),
    ...Array(8).fill(secondTeam),
    ...Array(7).fill('neutral'),
    'assassin',
  ]
  const shuffledColors = shuffle(colors, rngColors)

  const cells: Cell[] = shuffledWords.map((word, i) => ({
    word,
    color: shuffledColors[i],
    revealed: false,
    custom: config.customWords?.has(i) ?? false,
  }))

  return {
    seed: config.seed,
    firstTeam,
    cells,
  }
}
