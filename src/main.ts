import '../styles.css'
import { generateBoard } from './generator'
import { decodeBoard } from './url'
import {
  getState,
  setBoard,
  setViewMode,
  toggleViewMode,
  togglePack,
  setActivePacks,
  setShareMode,
  setPasswordRequired,
  setPasswordVerified,
  setCustomWord,
  clearCustomWords,
} from './state'
import {
  initUI,
  renderBoard,
  renderControls,
  renderFooter,
  handleShare,
  showPasswordPrompt,
  showToast,
  generatePassword,
  getGenerateBtn,
  getShuffleBtn,
  setShuffleDisabled,
  getShareBtn,
  getClearCustomBtn,
  getViewToggle,
  getPackCheckboxes,
  setClearCustomVisible,
} from './ui'

function randomSeed(): string {
  const arr = new Uint8Array(8)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr)
  } else {
    for (let i = 0; i < 8; i++) {
      arr[i] = Math.floor(Math.random() * 256)
    }
  }
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function regenerateAndRender(seed: string, firstTeam: 'red' | 'blue' | 'random' = 'random') {
  const state = getState()
  const packIds = [...state.activePackIds]
  const board = generateBoard({
    seed,
    activePackIds: packIds,
    firstTeam,
    customWords: state.customWords,
  })
  setBoard(board)
  fullRender()
}

function regenerateColorsOnly() {
  const state = getState()
  if (!state.currentBoard) return
  const words = state.currentBoard.cells.map((c) => c.word)
  const seed = randomSeed()
  const board = generateBoard({
    seed,
    activePackIds: [...state.activePackIds],
    firstTeam: 'random',
    words,
    customWords: state.customWords,
  })
  setBoard(board)
  renderBoard(board, state.viewMode, handleEditWord, handleStartEdit)
  renderFooter(board.seed, board.firstTeam)
}

function fullRender() {
  const state = getState()
  if (state.currentBoard) {
    renderBoard(state.currentBoard, state.viewMode, handleEditWord, handleStartEdit)
    renderFooter(state.currentBoard.seed, state.currentBoard.firstTeam)
  }
  const showToggle = true
  renderControls(state.activePackIds, state.viewMode, showToggle)
  setClearCustomVisible(state.customWords.size > 0)
}

function applyViewToggle() {
  toggleViewMode()
  fullRender()
  setShuffleDisabled(getState().viewMode === 'operative')
}

function promptForSpymaster() {
  const state = getState()
  if (!state.currentBoard) return

  const expectedPassword = generatePassword(state.currentBoard.seed)

  showPasswordPrompt(expectedPassword, () => {
    setPasswordVerified(true)
    setViewMode('spymaster')
    fullRender()
    setShuffleDisabled(false)
  })
}

function handleEditWord(index: number, word: string): boolean {
  const state = getState()
  if (!state.currentBoard) return false

  // Check for duplicates across all cells (case-insensitive)
  const lower = word.toLowerCase()
  for (let i = 0; i < 25; i++) {
    if (i !== index && state.currentBoard.cells[i].word.toLowerCase() === lower) {
      showToast('Word already on board')
      return false
    }
  }

  setCustomWord(index, word)

  // Re-generate board with new custom word to keep colors correct
  const words = state.currentBoard.cells.map((c, i) =>
    i === index ? word : c.word
  )
  const board = generateBoard({
    seed: state.currentBoard.seed,
    activePackIds: [...state.activePackIds],
    firstTeam: state.currentBoard.firstTeam,
    words,
    customWords: getState().customWords,
  })
  setBoard(board)
  renderBoard(board, state.viewMode, handleEditWord, handleStartEdit)
  setClearCustomVisible(getState().customWords.size > 0)
  return true
}

function handleStartEdit(_index: number) {
  // No-op — used to track if needed later
}

function loadFromHash(hash: string) {
  const decoded = decodeBoard(hash)
  if (!decoded) return false

  setActivePacks(decoded.activePackIds)
  setShareMode('shared')

  if (decoded.customWords) {
    clearCustomWords()
    for (const [idx, word] of decoded.customWords) {
      setCustomWord(idx, word)
    }
  }

  regenerateAndRender(decoded.seed, decoded.firstTeam)

  if (decoded.password) {
    // Spymaster share with password in URL
    setPasswordRequired(true)
    setPasswordVerified(false)
    setViewMode('operative')
    setShuffleDisabled(true)
    fullRender()
  } else if (decoded.viewMode === 'spymaster') {
    // Spymaster share without password in URL (QR code)
    setPasswordRequired(true)
    setPasswordVerified(false)
    setViewMode('operative')
    setShuffleDisabled(true)
    fullRender()
  } else {
    // Operative share: board only, no secret access
    setPasswordRequired(false)
    setPasswordVerified(false)
    setViewMode(decoded.viewMode)
    setShuffleDisabled(true)
    fullRender()
  }
  return true
}

function init() {
  initUI()
  fullRender()
  setShuffleDisabled(getState().viewMode === 'operative')

  // Generate button
  const generateBtn = getGenerateBtn()
  if (generateBtn) {
    generateBtn.addEventListener('click', () => {
      setShareMode('local')
      setPasswordRequired(false)
      setPasswordVerified(false)
      clearCustomWords()
      const seed = randomSeed()
      regenerateAndRender(seed)
    })
  }

  // Clear custom words button
  const clearCustomBtn = getClearCustomBtn()
  if (clearCustomBtn) {
    clearCustomBtn.addEventListener('click', () => {
      clearCustomWords()
      const state = getState()
      if (state.currentBoard) {
        const seed = state.currentBoard.seed
        regenerateAndRender(seed, state.currentBoard.firstTeam)
      }
    })
  }

  // Share button
  const shareBtn = getShareBtn()
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      const state = getState()
      if (state.currentBoard) {
        handleShare(state.currentBoard, state.viewMode, state.activePackIds, state.customWords)
      }
    })
  }

  // Shuffle button
  const shuffleBtn = getShuffleBtn()
  if (shuffleBtn) {
    shuffleBtn.addEventListener('click', () => {
      regenerateColorsOnly()
    })
  }

  // View toggle
  const viewToggle = getViewToggle()
  if (viewToggle) {
    viewToggle.addEventListener('change', () => {
      const state = getState()
      if (state.shareMode === 'shared' && state.passwordRequired && !state.passwordVerified) {
        // Revert the checkbox visually since we're showing a prompt
        viewToggle.checked = false
        promptForSpymaster()
        return
      }
      applyViewToggle()
    })
  }

  // Pack checkboxes
  const packCbs = getPackCheckboxes()
  packCbs.forEach((cb, packId) => {
    cb.addEventListener('change', () => {
      togglePack(packId)
      clearCustomWords()
      const state = getState()
      const currentSeed = state.currentBoard?.seed ?? randomSeed()
      regenerateAndRender(currentSeed)
    })
  })

  // Hash change
  window.addEventListener('hashchange', () => {
    const hash = location.hash.slice(1)
    if (!hash) return
    loadFromHash(hash)
  })

  // Initial load
  const initialHash = location.hash.slice(1)
  if (initialHash) {
    if (loadFromHash(initialHash)) return
  }

  // No valid hash: generate new random board
  const seed = randomSeed()
  regenerateAndRender(seed)
}

document.addEventListener('DOMContentLoaded', init)
