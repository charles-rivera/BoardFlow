export interface User {
  id: string
  email: string
  created_at: string
}

export interface Card {
  id: string
  lane_id: string
  user_id: string
  title: string
  description: string
  position: number
  created_at: string
  updated_at: string
}

export interface Lane {
  id: string
  user_id: string
  title: string
  position: number
  created_at: string
  cards: Card[]
}
