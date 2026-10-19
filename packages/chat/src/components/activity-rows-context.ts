import { createContext } from "react"
import type { SquareRow } from "../lib/part-navigation"

/**
 * Every activity row the panel currently renders, so a square's detail can step
 * past commentary into neighbouring rows. It is a stable getter rather than a
 * value: streaming re-renders the panel constantly, and a changing context value
 * would re-render every memoized message with it.
 */
export const ActivityRowsContext = createContext<(() => readonly SquareRow[]) | null>(null)
