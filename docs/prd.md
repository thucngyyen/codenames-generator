# Codenames Board + Secret Generator — PRD

## Overview
A mobile-first PWA that generates Codenames boards and secret keys. Strict offline: all 500 words bundled at build time. No network needed after first load.

## Core Requirements

| Feature | Detail |
|---------|--------|
| **Board Size** | 5×5 only |
| **Words** | 5 built-in packs, 100 words each. No custom packs. No DB. |
| **Secret Key** | Standard Codenames distribution (9/8/7/1) |
| **Randomizer** | Seeded PRNG. No duplicate words within a single board. |
| **PWA** | Offline-first, iOS + Android compatible |
| **Persistence** | None. Ephemeral boards. |

## Tech Stack

- **Framework:** Vanilla TypeScript
- **Build Tool:** Vite + `vite-plugin-pwa`
- **Styling:** Plain CSS
- **PRNG:** Mulberry32 (seeded, deterministic, zero dependencies)
- **Hashing:** Native `btoa` / `atob` for URL share encoding

## File Structure

```
codenames-generator/
├── index.html
├── manifest.json
├── vite.config.ts
├── src/
│   ├── main.ts          # Entry point, mount + init
│   ├── generator.ts      # Seeded PRNG + board builder
│   ├── url.ts            # Hash encode/decode for sharing
│   ├── ui.ts             # DOM updates, event listeners
│   ├── state.ts          # Current board + view mode
│   ├── types.ts          # Shared interfaces
│   ├── packs/
│   │   ├── index.ts      # Pack registry, merge + dedupe
│   │   ├── pack1.ts      # Pack A — 100 words
│   │   ├── pack2.ts      # Pack B — 100 words
│   │   ├── pack3.ts      # Pack C — 100 words
│   │   ├── pack4.ts      # Pack D — 100 words
│   │   └── pack5.ts      # Pack E — 100 words
│   └── sw.ts             # Service worker (or vite-plugin-pwa generates)
└── styles.css            # Mobile-first grid + toggle
```

## Data Model

```typescript
// types.ts

type CardColor = 'red' | 'blue' | 'neutral' | 'assassin';

interface WordPack {
  id: string;
  name: string;
  words: string[]; // length = 100
}

interface Cell {
  word: string;
  color: CardColor;
}

interface Board {
  seed: string;
  firstTeam: 'red' | 'blue';
  cells: Cell[]; // length = 25
}

type ViewMode = 'operative' | 'spymaster';
```

## Generator Engine (generator.ts)

### Mulberry32 Seeded PRNG
```typescript
function mulberry32(seed: string): () => number {
  // Improved seed mixing: order-sensitive, avoids collisions like "ab" vs "ba"
  let n = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    n = Math.imul(n ^ seed.charCodeAt(i), 16777619);
  }
  return function() {
    n |= 0;
    n = (n + 0x6D2B79F5) | 0;
    let t = Math.imul(n ^ (n >>> 15), 1 | n);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) | 0;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

**Note:** Seed init uses order-sensitive FNV-1a-style mixing instead of an additive sum. This prevents collisions where strings like `"ab"` and `"ba"` would previously produce identical state, and improves entropy distribution.

### Board Generation Flow
1. **Gather pool**: Merge words from all active pack modules → deduplicate
2. **Init PRNGs**: Create two independent PRNG instances from the master seed
   - `rngWords = mulberry32(seed + ':words')`
   - `rngColors = mulberry32(seed + ':colors')`
3. **Shuffle pool**: Fisher-Yates with `rngWords`
4. **Pick 25**: First 25 unique words from shuffled pool
5. **Build secret**: Create 25-slot color array
   - `firstTeam`: 9 cards (red or blue)
   - `secondTeam`: 8 cards (other color)
   - `neutral`: 7 cards
   - `assassin`: 1 card
6. **Shuffle colors**: Fisher-Yates with `rngColors`
7. **Return**: `Board` object with seed, firstTeam, and 25 `Cell` objects

### Duplicate Prevention
- Deduplication happens at pool-merge time (case-insensitive; normalize to lowercase for comparison, keep first-cased form)
- If total unique words across active packs < 25, generation fails with clear error

### Color Distribution (5×5)
| Count | Role |
|-------|------|
| 9 | First team (starts first) |
| 8 | Second team |
| 7 | Neutral |
| 1 | Assassin |

## URL Sharing (url.ts)

### Encoding
Format: `seed|packIdsCommaSeparated|firstTeam|viewMode`

Example: `abc123|pack1,pack3|red|operative`

Process:
1. Build pipe-delimited string
2. `btoa(encodeURIComponent(str)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')` → base64url-safe string
3. Set as `window.location.hash`

### Decoding
On load / hashchange:
1. Read `window.location.hash`
2. Restore base64 padding if needed, replace `-`→`+` and `_`→`/`, then `decodeURIComponent(atob(hash))`
3. Split by `|`
4. Restore packs, regenerate board with seed, set view mode

## UI Architecture (ui.ts)

### Layout
- Header: Title + Generate button + Share button
- Controls row: Pack checkboxes (5) + view toggle
- Board: CSS Grid, 5 columns, gap
- Footer: Seed display (read-only)

### View Toggle
- **Operative**: All cards beige/cream. Words visible.
- **Spymaster**: Colored overlay on each card (red/blue/neutral/assassin).

### Card Visuals
| Color | Operative | Spymaster |
|-------|-----------|-----------|
| Red | beige | red |
| Blue | beige | blue |
| Neutral | beige | tan |
| Assassin | beige | dark gray / black |

### Interaction
- **Generate**: Resets board with new random seed. Respects active packs.
- **Share**: Copies current URL (with hash) to clipboard. Shows toast.
- **Pack checkbox**: Changing selection triggers immediate regenerate.
- **View toggle**: Switches display mode instantly. No regenerate.

## PWA / Offline Strategy

### Build-Time Bundling
- All 5 pack modules imported and bundled by Vite
- No external data fetches at runtime

### Service Worker
- Use `vite-plugin-pwa` with `injectManifest` or `generateSW`
- Precache strategy: `CacheFirst` for app shell
- Caches: `index.html`, `*.js`, `*.css`, `manifest.json`, icons

### Manifest Requirements (iOS + Android)
```json
{
  "name": "Codenames Generator",
  "short_name": "Codenames",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#ffffff",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Required Meta Tags
- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`
- `<meta name="theme-color" content="#ffffff">`

### iOS Specific
- `<meta name="apple-mobile-web-app-capable" content="yes">`
- `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`
- Touch icon link tags in `<head>`

### Android Specific
- Maskable icon format for adaptive icons
- `theme_color` matches status bar

## State Management (state.ts)

Simple module-level state, no library:

```typescript
let currentBoard: Board | null = null;
let viewMode: ViewMode = 'operative';
let activePackIds: Set<string> = new Set(['pack1', 'pack2', 'pack3', 'pack4', 'pack5']);

export function getState() { /* ... */ }
export function setBoard(board: Board) { /* ... */ }
export function toggleViewMode() { /* ... */ }
export function togglePack(id: string) { /* ... */ }
```

## Responsive Design

### Breakpoints
- Mobile (primary): < 600px
- Tablet/desktop: ≥ 600px

### Grid Behavior
```css
.board {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}

.card {
  aspect-ratio: 3 / 2;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(10px, 3.5vw, 16px);
  padding: 4px;
  text-align: center;
  border-radius: 4px;
  overflow-wrap: break-word;
}
```

### Touch Targets
- Buttons: minimum 44×44px
- Checkboxes: minimum 44×44px tap area
- Toggle switch: 48px height

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Active packs have < 25 unique words | Show error: "Select more packs" |
| Clipboard API unavailable | Fallback: select URL text, prompt manual copy |
| Invalid URL hash | Silent ignore, generate new random board |
| No packs selected | Disable generate button, show hint |

## Non-Goals (Out of Scope)

- Playable game (clues, turn management, scoring)
- Custom word packs / user word editing
- Board history / persistence
- Multiplayer / network sync
- Image export / screenshot generation
- Animations beyond CSS transitions
- Dark mode toggle
- Sound effects

## Development Checklist

- [ ] Set up Vite project with TypeScript
- [ ] Configure `vite-plugin-pwa`
- [ ] Create 5 pack modules with 100 words each
- [ ] Implement Mulberry32 + Fisher-Yates shuffle
- [ ] Build board generation with deduplication
- [ ] Create URL hash encode/decode
- [ ] Implement responsive 5×5 grid CSS
- [ ] Add view toggle (operative / spymaster)
- [ ] Add pack selection checkboxes
- [ ] Wire Generate + Share buttons
- [ ] Add iOS/Android meta tags + manifest
- [ ] Test offline by disabling network
- [ ] Test on mobile viewport sizes
- [ ] Verify no duplicate words in generated boards
- [ ] Verify URL share reproduces identical board
