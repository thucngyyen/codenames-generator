import { pack1 } from './pack1'
import { pack2 } from './pack2'
import { pack3 } from './pack3'
import { pack4 } from './pack4'
import { pack5 } from './pack5'
import { familyFriendlyPack } from './family-friendly'
import type { WordPack } from '../types'

export const allPacks: WordPack[] = [familyFriendlyPack, pack1, pack2, pack3, pack4, pack5]

export function getActiveWords(packIds: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const pack of allPacks) {
    if (!packIds.includes(pack.id)) continue
    for (const word of pack.words) {
      const lower = word.toLowerCase()
      if (!seen.has(lower)) {
        seen.add(lower)
        result.push(word)
      }
    }
  }

  return result
}
