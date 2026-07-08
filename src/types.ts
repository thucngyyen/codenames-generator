export type CardColor = 'red' | 'blue' | 'neutral' | 'assassin'

export type ViewMode = 'operative' | 'spymaster'

export interface WordPack {
  id: string
  name: string
  words: string[]
}

export interface Cell {
  word: string
  color: CardColor
  revealed: boolean
  custom?: boolean
}

export interface Board {
  seed: string
  firstTeam: 'red' | 'blue'
  cells: Cell[]
}
