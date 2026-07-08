import type { Board, ViewMode } from './types'

export function encodeBoard(
  board: Board,
  viewMode: ViewMode,
  activePackIds: string[],
  password?: string,
  customWords?: Map<number, string>
): string {
  const parts = [
    board.seed,
    activePackIds.join(','),
    board.firstTeam,
    viewMode,
  ]
  if (viewMode === 'spymaster' && password) {
    parts.push(password)
  }
  if (customWords && customWords.size > 0) {
    const cwPairs = Array.from(customWords.entries())
      .map(([i, w]) => `${i}:${w}`)
      .join(',')
    parts.push(cwPairs)
  }
  const raw = parts.join('|')
  const base64 = btoa(encodeURIComponent(raw))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return base64
}

export function decodeBoard(
  hash: string
): { seed: string; activePackIds: string[]; firstTeam: 'red' | 'blue'; viewMode: ViewMode; password?: string; customWords?: Map<number, string> } | null {
  try {
    let padded = hash.replace(/-/g, '+').replace(/_/g, '/')
    while (padded.length % 4 !== 0) {
      padded += '='
    }
    const raw = decodeURIComponent(atob(padded))
    const parts = raw.split('|')
    if (parts.length < 4) return null

    const [seed, packIdsStr, firstTeam, viewMode, passwordOrCustom, maybeCustom] = parts
    if (firstTeam !== 'red' && firstTeam !== 'blue') return null
    if (viewMode !== 'operative' && viewMode !== 'spymaster') return null

    let password: string | undefined
    let customWords: Map<number, string> | undefined

    if (parts.length >= 5) {
      // If viewMode is spymaster and we have 5+ parts, part 5 could be password or custom words
      if (viewMode === 'spymaster') {
        password = passwordOrCustom
        if (parts.length >= 6) {
          customWords = parseCustomWords(maybeCustom)
        }
      } else {
        // operative mode: part 5 is custom words
        customWords = parseCustomWords(passwordOrCustom)
      }
    }

    return {
      seed,
      activePackIds: packIdsStr.split(',').filter(Boolean),
      firstTeam,
      viewMode: viewMode as ViewMode,
      password,
      customWords,
    }
  } catch {
    return null
  }
}

function parseCustomWords(str: string): Map<number, string> | undefined {
  if (!str || !str.includes(':')) return undefined
  const map = new Map<number, string>()
  for (const pair of str.split(',')) {
    const colonIdx = pair.indexOf(':')
    if (colonIdx === -1) continue
    const idx = parseInt(pair.slice(0, colonIdx), 10)
    const word = pair.slice(colonIdx + 1)
    if (!isNaN(idx) && word) {
      map.set(idx, word)
    }
  }
  return map.size > 0 ? map : undefined
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Fallback
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  const success = document.execCommand('copy')
  document.body.removeChild(textarea)
  return success
}
