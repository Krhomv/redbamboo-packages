import type { MessagePart } from "../types"

/** One rendered run of activity squares, identified by its block id. */
export interface SquareRow {
  id: string
  parts: readonly MessagePart[]
}

/** A square's position: the row it renders in and its index in that row's parts. */
export interface SquareRef {
  rowId: string
  index: number
}

/**
 * Parts that render as activity squares. Text, audio and images render inline;
 * a tool_result is reached through its tool_use square rather than its own.
 */
export function isInspectablePart(part: MessagePart): boolean {
  return part.type !== "text" && part.type !== "audio" && part.type !== "image" && part.type !== "tool_result"
}

/** Every square across `rows`, in timeline order. */
export function squareSequence(rows: readonly SquareRow[]): SquareRef[] {
  const sequence: SquareRef[] = []
  for (const row of rows) {
    row.parts.forEach((part, index) => { if (isInspectablePart(part)) sequence.push({ rowId: row.id, index }) })
  }
  return sequence
}

export function squarePosition(sequence: readonly SquareRef[], square: SquareRef): number {
  return sequence.findIndex(s => s.rowId === square.rowId && s.index === square.index)
}

/**
 * The square one before or after `from`, or undefined at either end.
 * Navigation deliberately stops instead of wrapping.
 */
export function stepSquare(rows: readonly SquareRow[], from: SquareRef, direction: -1 | 1): SquareRef | undefined {
  const sequence = squareSequence(rows)
  const position = squarePosition(sequence, from)
  if (position === -1) return undefined
  return sequence[position + direction]
}
