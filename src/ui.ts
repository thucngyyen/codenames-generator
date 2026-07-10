import type { Board, ViewMode } from './types'
import { allPacks } from './packs'
import { encodeBoard, copyToClipboard } from './url'
import QRCode from 'qrcode'
import posthog from './posthog'

const app = document.getElementById('app')!

let boardEl: HTMLDivElement | null = null
let toastEl: HTMLDivElement | null = null
let footerEl: HTMLDivElement | null = null
let controlsEl: HTMLDivElement | null = null
let headerEl: HTMLDivElement | null = null
let generateBtn: HTMLButtonElement | null = null
let shareBtn: HTMLButtonElement | null = null
let viewToggle: HTMLInputElement | null = null
let shuffleBtn: HTMLButtonElement | null = null
let clearCustomBtn: HTMLButtonElement | null = null
let packCheckboxes: Map<string, HTMLInputElement> = new Map()
let passwordOverlay: HTMLDivElement | null = null
let shareModal: HTMLDivElement | null = null

export type OnEditWord = (index: number, word: string) => boolean
export type OnStartEdit = (index: number) => void

export function generatePassword(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i)
    hash |= 0
  }
  return (Math.abs(hash) % 9000 + 1000).toString()
}

export function initUI() {
  // Header
  headerEl = document.createElement('div')
  headerEl.className = 'header'
  headerEl.innerHTML = `
    <h1>Codenames Generator</h1>
    <div class="header-actions">
      <button id="generate-btn" class="btn">New Game</button>
      <button id="shuffle-btn" class="btn btn-shuffle" disabled>Shuffle Secret</button>
      <button id="clear-custom-btn" class="btn btn-secondary" style="display:none">Clear Custom</button>
      <button id="share-btn" class="btn btn-share">Share</button>
    </div>
  `
  app.appendChild(headerEl)

  generateBtn = headerEl.querySelector('#generate-btn')!
  shuffleBtn = headerEl.querySelector('#shuffle-btn')!
  clearCustomBtn = headerEl.querySelector('#clear-custom-btn')!
  shareBtn = headerEl.querySelector('#share-btn')!

  // Controls dashboard
  controlsEl = document.createElement('div')
  controlsEl.className = 'control-dashboard'

  // Pack panel
  const packPanel = document.createElement('div')
  packPanel.className = 'pack-panel'
  packPanel.innerHTML = `<div class="pack-panel-title">Card Pack Selection</div>`

  const packGrid = document.createElement('div')
  packGrid.className = 'pack-grid'

  for (let i = 0; i < allPacks.length; i++) {
    const pack = allPacks[i]
    const badge = document.createElement('label')
    badge.className = 'pack-badge'
    const cb = document.createElement('input')
    cb.type = 'checkbox'
    cb.id = `pack-${i + 1}`
    cb.value = pack.id
    cb.checked = true
    const iconWrap = document.createElement('span')
    iconWrap.className = 'pack-icon'
    const nameWrap = document.createElement('span')
    nameWrap.className = 'pack-name'
    nameWrap.textContent = pack.name
    badge.appendChild(cb)
    badge.appendChild(iconWrap)
    badge.appendChild(nameWrap)
    packGrid.appendChild(badge)
    packCheckboxes.set(pack.id, cb)
  }

  packPanel.appendChild(packGrid)
  controlsEl.appendChild(packPanel)

  // Role panel (vertical toggle)
  const rolePanel = document.createElement('div')
  rolePanel.className = 'role-panel'
  viewToggle = document.createElement('input')
  viewToggle.type = 'checkbox'
  viewToggle.id = 'view-toggle'
  rolePanel.innerHTML = `
    <div class="role-label-top">Agent</div>
    <div class="role-track-wrap">
      <div class="role-track"></div>
      <div class="role-knob"></div>
    </div>
    <div class="role-label-bottom">Spymaster</div>
  `
  // Insert the real checkbox into the track so it drives state
  const trackWrap = rolePanel.querySelector('.role-track-wrap')!
  trackWrap.insertBefore(viewToggle, trackWrap.firstChild)
  controlsEl.appendChild(rolePanel)

  app.appendChild(controlsEl)

  // Board
  boardEl = document.createElement('div')
  boardEl.className = 'board'
  app.appendChild(boardEl)

  // Footer
  footerEl = document.createElement('div')
  footerEl.className = 'footer'
  app.appendChild(footerEl)

  // Toast
  toastEl = document.createElement('div')
  toastEl.className = 'toast'
  document.body.appendChild(toastEl)

  // Password overlay
  passwordOverlay = document.createElement('div')
  passwordOverlay.className = 'password-overlay'
  passwordOverlay.style.display = 'none'
  passwordOverlay.innerHTML = `
    <div class="password-box">
      <h3>Enter Password</h3>
      <p>This board is password-protected.</p>
      <input type="text" id="password-input" placeholder="4-digit code" maxlength="10" autocomplete="off" />
      <button id="password-submit" class="btn">Unlock</button>
      <button id="password-cancel" class="btn btn-secondary">Cancel</button>
      <p id="password-error" class="password-error"></p>
    </div>
  `
  app.appendChild(passwordOverlay)

  // Share modal
  shareModal = document.createElement('div')
  shareModal.className = 'modal-overlay'
  shareModal.style.display = 'none'
  shareModal.innerHTML = `
    <div class="modal-box">
      <h3>Share Board</h3>
      <div class="qr-field">
        <canvas id="qr-code"></canvas>
      </div>
      <div class="modal-field">
        <label>URL</label>
        <input type="text" id="share-url" readonly />
        <button id="copy-url-btn" class="btn">Copy URL</button>
      </div>
      <div class="modal-field" id="share-password-field" style="display:none">
        <label>Password</label>
        <input type="text" id="share-password" readonly />
        <button id="copy-password-btn" class="btn">Copy Password</button>
      </div>
      <button id="close-modal-btn" class="btn btn-secondary">Close</button>
    </div>
  `
  app.appendChild(shareModal)
}

export function renderBoard(
  board: Board,
  viewMode: ViewMode,
  onEditWord?: OnEditWord,
  onStartEdit?: OnStartEdit
) {
  if (!boardEl) return

  if (boardEl.children.length !== 25) {
    boardEl.innerHTML = ''
    for (let i = 0; i < 25; i++) {
      const card = document.createElement('div')
      card.className = 'card'
      card.dataset.index = String(i)
      boardEl.appendChild(card)
    }
  }

  for (let i = 0; i < 25; i++) {
    const cell = board.cells[i]
    const card = boardEl.children[i] as HTMLDivElement

    // Only reset content if not currently editing this card
    const input = card.querySelector('input')
    if (!input) {
      card.textContent = cell.word
    }

    card.className = 'card'
    if (cell.custom) {
      card.classList.add('custom')
    }
    if (viewMode === 'spymaster') {
      card.classList.add(cell.color)
      // Add team label for red/blue cards
      if (cell.color === 'red' || cell.color === 'blue' || cell.color === 'assassin') {
        const label = document.createElement('span')
        label.className = 'team-label'
        if (cell.color === 'red') label.textContent = 'Red Team'
        else if (cell.color === 'blue') label.textContent = 'Blue Team'
        else if (cell.color === 'assassin') label.textContent = 'Assassin'
        card.appendChild(label)
      }
    }

    // Wire click-to-edit
    card.onclick = () => {
      if (input) return // already editing
      startInlineEdit(card, i, cell.word, onEditWord, onStartEdit)
    }
  }
}

function startInlineEdit(
  card: HTMLDivElement,
  index: number,
  currentWord: string,
  onEditWord?: OnEditWord,
  onStartEdit?: OnStartEdit
) {
  if (!onEditWord) return

  onStartEdit?.(index)

  card.innerHTML = ''
  card.classList.add('editing')

  const input = document.createElement('input')
  input.type = 'text'
  input.value = currentWord
  input.className = 'card-input'

  const save = () => {
    const newWord = input.value.trim()
    if (!newWord) {
      card.textContent = currentWord
      card.classList.remove('editing')
      return
    }
    if (newWord.toLowerCase() === currentWord.toLowerCase()) {
      card.textContent = currentWord
      card.classList.remove('editing')
      return
    }
    const ok = onEditWord(index, newWord)
    if (!ok) {
      // Duplicate — keep editing
      input.select()
      input.focus()
      return
    }
    card.textContent = newWord
    card.classList.remove('editing')
    card.classList.add('custom')
  }

  const cancel = () => {
    card.textContent = currentWord
    card.classList.remove('editing')
    posthog.capture('word_edit_cancelled')
  }

  input.onkeydown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      save()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancel()
    }
  }

  input.onblur = () => {
    // Small delay to allow click events to process
    setTimeout(() => {
      if (card.contains(input)) {
        save()
      }
    }, 150)
  }

  card.appendChild(input)
  input.focus()
  input.select()
}

export function renderControls(activePackIds: Set<string>, currentViewMode: ViewMode, showToggle: boolean) {
  packCheckboxes.forEach((cb, packId) => {
    cb.checked = activePackIds.has(packId)
  })
  if (viewToggle) {
    viewToggle.checked = currentViewMode === 'spymaster'
  }
  // Update role label active states
  const rolePanel = document.querySelector('.role-panel')
  if (rolePanel) {
    const topLabel = rolePanel.querySelector('.role-label-top')
    const bottomLabel = rolePanel.querySelector('.role-label-bottom')
    if (topLabel) {
      topLabel.classList.toggle('active', currentViewMode === 'operative')
    }
    if (bottomLabel) {
      bottomLabel.classList.toggle('active', currentViewMode === 'spymaster')
    }
  }
  setViewToggleVisible(showToggle)
}

export function setViewToggleVisible(visible: boolean) {
  const panel = document.querySelector('.role-panel') as HTMLElement | null
  if (panel) {
    panel.style.display = visible ? 'flex' : 'none'
  }
}

export function setClearCustomVisible(visible: boolean) {
  if (clearCustomBtn) {
    clearCustomBtn.style.display = visible ? 'inline-block' : 'none'
  }
}

export function renderFooter(seed: string, firstTeam: 'red' | 'blue') {
  if (footerEl) {
    const teamClass = `team-${firstTeam}`
    footerEl.innerHTML = `<div class="seed-badge">Seed: ${seed} | <span class="first-team ${teamClass}">${firstTeam.toUpperCase()} goes first</span></div>`
  }
}

export function showToast(message: string) {
  if (!toastEl) return
  toastEl.textContent = message
  toastEl.classList.add('show')
  setTimeout(() => {
    toastEl!.classList.remove('show')
  }, 2000)
}

export function showPasswordPrompt(
  expectedPassword: string,
  onSuccess: () => void,
  onCancel?: () => void
) {
  if (!passwordOverlay) return
  passwordOverlay.style.display = 'flex'
  const input = passwordOverlay.querySelector<HTMLInputElement>('#password-input')!
  const submit = passwordOverlay.querySelector<HTMLButtonElement>('#password-submit')!
  const cancel = passwordOverlay.querySelector<HTMLButtonElement>('#password-cancel')!
  const error = passwordOverlay.querySelector<HTMLParagraphElement>('#password-error')!

  input.value = ''
  error.textContent = ''
  input.focus()

  const cleanup = () => {
    passwordOverlay!.style.display = 'none'
  }

  const check = () => {
    if (input.value === expectedPassword) {
      cleanup()
      onSuccess()
    } else {
      error.textContent = 'Incorrect password'
      posthog.capture('spymaster_unlock_failed')
      input.value = ''
      input.focus()
    }
  }

  const doCancel = () => {
    cleanup()
    onCancel?.()
  }

  submit.onclick = check
  cancel.onclick = doCancel

  // Click outside the box dismisses the prompt
  passwordOverlay.onclick = (e) => {
    if (e.target === passwordOverlay) {
      doCancel()
    }
  }

  input.onkeydown = (e) => {
    if (e.key === 'Enter') check()
    else if (e.key === 'Escape') doCancel()
  }
}

export function hidePasswordPrompt() {
  if (passwordOverlay) {
    passwordOverlay.style.display = 'none'
  }
}

export function showShareModal(url: string, password?: string, qrUrl?: string) {
  if (!shareModal) return
  shareModal.style.display = 'flex'
  const urlInput = shareModal.querySelector<HTMLInputElement>('#share-url')!
  const passwordField = shareModal.querySelector<HTMLDivElement>('#share-password-field')!
  const passwordInput = shareModal.querySelector<HTMLInputElement>('#share-password')!
  const copyUrlBtn = shareModal.querySelector<HTMLButtonElement>('#copy-url-btn')!
  const copyPasswordBtn = shareModal.querySelector<HTMLButtonElement>('#copy-password-btn')!
  const closeBtn = shareModal.querySelector<HTMLButtonElement>('#close-modal-btn')!
  const qrCanvas = shareModal.querySelector<HTMLCanvasElement>('#qr-code')!

  urlInput.value = url

  if (password) {
    passwordField.style.display = 'block'
    passwordInput.value = password
  } else {
    passwordField.style.display = 'none'
    passwordInput.value = ''
  }

  // Generate QR code with URL that does not contain the password
  const qrData = qrUrl || url
  QRCode.toCanvas(qrCanvas, qrData, { width: 200, margin: 2 }, (err) => {
    if (err) {
      console.error('QR code generation failed:', err)
      qrCanvas.style.display = 'none'
    } else {
      qrCanvas.style.display = 'block'
    }
  })

  copyUrlBtn.onclick = async () => {
    const ok = await copyToClipboard(urlInput.value)
    showToast(ok ? 'URL copied!' : 'Failed to copy URL')
    posthog.capture('share_url_copied', { success: ok })
  }

  copyPasswordBtn.onclick = async () => {
    const ok = await copyToClipboard(passwordInput.value)
    showToast(ok ? 'Password copied!' : 'Failed to copy password')
    posthog.capture('share_password_copied', { success: ok })
  }

  closeBtn.onclick = () => {
    shareModal!.style.display = 'none'
    posthog.capture('share_modal_closed')
  }
}

export async function handleShare(
  board: Board,
  viewMode: ViewMode,
  activePackIds: Set<string>,
  customWords?: Map<number, string>
) {
  let password: string | undefined
  if (viewMode === 'spymaster') {
    password = generatePassword(board.seed)
  }
  const hash = encodeBoard(board, viewMode, [...activePackIds], password, customWords)
  const url = `${location.origin}${location.pathname}#${hash}`
  // QR code: same URL structure, just no password embedded
  const hashNoPassword = encodeBoard(board, viewMode, [...activePackIds], undefined, customWords)
  const qrUrl = `${location.origin}${location.pathname}#${hashNoPassword}`
  showShareModal(url, password, qrUrl)
}

export function getShuffleBtn() {
  return shuffleBtn
}

export function setShuffleDisabled(disabled: boolean) {
  if (shuffleBtn) {
    shuffleBtn.disabled = disabled
  }
}

export function getGenerateBtn() {
  return generateBtn
}

export function getShareBtn() {
  return shareBtn
}

export function getClearCustomBtn() {
  return clearCustomBtn
}

export function getViewToggle() {
  return viewToggle
}

export function getPackCheckboxes() {
  return packCheckboxes
}
