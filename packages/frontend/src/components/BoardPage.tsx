import { DndContext, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverEvent, DragStartEvent, DragCancelEvent, DragOverlay } from '@dnd-kit/core'
import type { Card, Lane } from '@kanban/shared'
import { useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { useLanes } from '../hooks/useLanes'
import { useMoveCard } from '../hooks/useCards'
import { getCardInsertPosition, moveCardInLanes, type MoveCardInput } from '../lib/cardMove'
import BoardHeader from './BoardHeader'
import LaneList from './LaneList'
import AddLaneButton from './AddLaneButton'
import { CardSurface } from './Card'

interface BoardPageProps { user: { id: string; email: string } }

export default function BoardPage({ user }: BoardPageProps) {
  const qc = useQueryClient()
  const { data: lanes, isLoading } = useLanes()
  const moveCard = useMoveCard()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  const dragSnapshotRef = useRef<Lane[] | null>(null)
  const previewMoveRef = useRef<MoveCardInput | null>(null)
  const dragPointerOffsetYRef = useRef<number | null>(null)
  const [activeDragCard, setActiveDragCard] = useState<Card | null>(null)

  const clearDragState = () => {
    dragSnapshotRef.current = null
    previewMoveRef.current = null
    dragPointerOffsetYRef.current = null
    setActiveDragCard(null)
  }

  const restoreSnapshot = () => {
    if (dragSnapshotRef.current) {
      qc.setQueryData(['lanes'], dragSnapshotRef.current)
    }
    clearDragState()
  }

  const getMoveInput = (
    activeCard: Card | undefined,
    overData: { type?: 'lane' | 'card'; laneId?: string; cardId?: string } | undefined,
    hoverY: number,
    overTop: number,
    overHeight: number,
    currentLanes: Lane[],
  ): MoveCardInput | null => {
    if (!activeCard || !overData?.laneId) return null

    const cardId = activeCard.id
    const targetLaneId = overData.laneId
    const targetLane = currentLanes.find((lane: Lane) => lane.id === targetLaneId)
    if (!targetLane) return null

    const overMidpoint = overTop + (overHeight / 2)
    const insertAfter = hoverY > overMidpoint
    const targetCards = targetLane.cards.filter((card) => card.id !== cardId)

    let targetIndex = targetCards.length
    if (overData.type === 'card' && overData.cardId) {
      const overIndex = targetCards.findIndex((card) => card.id === overData.cardId)
      if (overIndex !== -1) {
        targetIndex = overIndex + (insertAfter ? 1 : 0)
      }
    }

    return {
      id: cardId,
      laneId: targetLaneId,
      position: getCardInsertPosition(targetCards, targetIndex),
      targetIndex,
    }
  }

  const handleDragStart = ({ active, activatorEvent }: DragStartEvent) => {
    const activeCard = active.data.current?.card as Card | undefined
    if (!activeCard || !lanes) return
    setActiveDragCard(activeCard)
    dragSnapshotRef.current = lanes
    const initialRect = active.rect.current.initial
    const clientY =
      activatorEvent instanceof MouseEvent || activatorEvent instanceof PointerEvent
        ? activatorEvent.clientY
        : activatorEvent instanceof TouchEvent
          ? activatorEvent.touches[0]?.clientY ?? activatorEvent.changedTouches[0]?.clientY
          : undefined
    dragPointerOffsetYRef.current =
      initialRect && clientY !== undefined ? clientY - initialRect.top : null
    previewMoveRef.current = {
      id: activeCard.id,
      laneId: activeCard.lane_id,
      position: activeCard.position,
      targetIndex: lanes.find((lane) => lane.id === activeCard.lane_id)?.cards.findIndex((card) => card.id === activeCard.id),
    }
  }

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return
    const currentLanes = qc.getQueryData<Lane[]>(['lanes'])
    if (!currentLanes) return

    if (!dragSnapshotRef.current) {
      dragSnapshotRef.current = currentLanes
    }

    const activeCard = active.data.current?.card as Card | undefined
    const overData = over.data.current as { type?: 'lane' | 'card'; laneId?: string; cardId?: string } | undefined
    const translatedTop = active.rect.current.translated?.top ?? active.rect.current.initial?.top ?? over.rect.top
    const hoverY =
      translatedTop +
      (dragPointerOffsetYRef.current ?? ((active.rect.current.translated?.height ?? active.rect.current.initial?.height ?? over.rect.height) / 2))
    const nextMove = getMoveInput(activeCard, overData, hoverY, over.rect.top, over.rect.height, currentLanes)
    if (!nextMove) return

    const previousMove = previewMoveRef.current
    if (
      previousMove &&
      previousMove.id === nextMove.id &&
      previousMove.laneId === nextMove.laneId &&
      previousMove.targetIndex === nextMove.targetIndex
    ) {
      return
    }

    previewMoveRef.current = nextMove
    qc.setQueryData<Lane[]>(['lanes'], (old) => {
      if (!old) return old
      return moveCardInLanes(old, nextMove)
    })
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) {
      restoreSnapshot()
      return
    }

    const currentLanes = qc.getQueryData<Lane[]>(['lanes'])
    const activeCard = active.data.current?.card as Card | undefined
    const overData = over.data.current as { type?: 'lane' | 'card'; laneId?: string; cardId?: string } | undefined
    const translatedTop = active.rect.current.translated?.top ?? active.rect.current.initial?.top ?? over.rect.top
    const hoverY =
      translatedTop +
      (dragPointerOffsetYRef.current ?? ((active.rect.current.translated?.height ?? active.rect.current.initial?.height ?? over.rect.height) / 2))
    const moveInput =
      previewMoveRef.current ??
      (currentLanes ? getMoveInput(activeCard, overData, hoverY, over.rect.top, over.rect.height, currentLanes) : null)

    if (!moveInput) {
      restoreSnapshot()
      return
    }

    moveCard.mutate({ ...moveInput, skipOptimistic: true }, {
      onSettled: () => {
        clearDragState()
      },
      onError: () => {
        if (dragSnapshotRef.current) {
          qc.setQueryData(['lanes'], dragSnapshotRef.current)
        }
        clearDragState()
      },
    })
  }

  const handleDragCancel = (_event: DragCancelEvent) => {
    restoreSnapshot()
  }

  if (isLoading) return <div className="flex items-center justify-center h-screen text-gray-400">Loading board…</div>

  return (
    <div className="flex flex-col h-screen bg-slate-100">
      <BoardHeader user={user} />
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex-1 overflow-x-auto p-4">
          <div className="flex gap-4 h-full items-start">
            <LaneList lanes={lanes ?? []} />
            <AddLaneButton />
          </div>
        </div>
        <DragOverlay dropAnimation={null}>
          {activeDragCard ? (
            <div className="w-[232px] cursor-grabbing">
              <CardSurface card={activeDragCard} isDragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
