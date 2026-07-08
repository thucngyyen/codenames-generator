import type { Board, ViewMode } from './types'

let currentBoard: Board | null = null
let viewMode: ViewMode = 'spymaster'
const activePackIds = new Set<string>(['pack1', 'pack2', 'pack3', 'pack4', 'pack5'])
let shareMode: 'local' | 'shared' = 'local'
let passwordRequired = false
let passwordVerified = false
const customWords = new Map<number, string>()

export function getState() {
  return {
    currentBoard,
    viewMode,
    activePackIds: new Set(activePackIds),
    shareMode,
    passwordRequired,
    passwordVerified,
    customWords: new Map(customWords),
  }
}

export function setBoard(board: Board) {
  currentBoard = board
}

export function setViewMode(mode: ViewMode) {
  viewMode = mode
}

export function toggleViewMode() {
  viewMode = viewMode === 'operative' ? 'spymaster' : 'operative'
}

export function togglePack(packId: string) {
  if (activePackIds.has(packId)) {
    activePackIds.delete(packId)
  } else {
    activePackIds.add(packId)
  }
}

export function setActivePacks(packIds: string[]) {
  activePackIds.clear()
  for (const id of packIds) {
    activePackIds.add(id)
  }
}

export function setShareMode(mode: 'local' | 'shared') {
  shareMode = mode
}

export function setPasswordRequired(required: boolean) {
  passwordRequired = required
}

export function setPasswordVerified(verified: boolean) {
  passwordVerified = verified
}

export function setCustomWord(index: number, word: string) {
  customWords.set(index, word.trim())
}

export function removeCustomWord(index: number) {
  customWords.delete(index)
}

export function clearCustomWords() {
  customWords.clear()
}

export function getCustomWords() {
  return new Map(customWords)
}
