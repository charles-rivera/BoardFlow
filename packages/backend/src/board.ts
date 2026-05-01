import { Pool, PoolClient } from 'pg'

export interface CardRecord {
  id: string
  lane_id: string
  title: string
  description: string
  position: number
  created_at: string
  updated_at: string
}

export interface LaneRecord {
  id: string
  title: string
  position: number
  created_at: string
}

type DbClient = Pool | PoolClient

export async function getBoard(client: DbClient): Promise<{ lanes: Array<LaneRecord & { cards: CardRecord[] }> }> {
  const { rows: lanes } = await client.query<LaneRecord>(
    'SELECT id, title, position, created_at FROM lanes WHERE deleted_at IS NULL ORDER BY position ASC'
  )
  const { rows: cards } = await client.query<CardRecord>(
    'SELECT id, lane_id, title, description, position, created_at, updated_at FROM cards WHERE deleted_at IS NULL ORDER BY position ASC'
  )

  const cardsByLane = new Map<string, CardRecord[]>()
  for (const card of cards) {
    const laneCards = cardsByLane.get(card.lane_id) ?? []
    laneCards.push(card)
    cardsByLane.set(card.lane_id, laneCards)
  }

  return {
    lanes: lanes.map((lane) => ({
      ...lane,
      cards: cardsByLane.get(lane.id) ?? [],
    })),
  }
}

export async function getLaneById(
  client: DbClient,
  laneId: string
): Promise<(LaneRecord & { cards: CardRecord[] }) | null> {
  const board = await getBoard(client)
  return board.lanes.find((lane) => lane.id === laneId) ?? null
}

export async function getCardById(client: DbClient, cardId: string): Promise<CardRecord | null> {
  const { rows } = await client.query<CardRecord>(
    'SELECT id, lane_id, title, description, position, created_at, updated_at FROM cards WHERE id = $1 AND deleted_at IS NULL',
    [cardId]
  )
  return rows[0] ?? null
}

