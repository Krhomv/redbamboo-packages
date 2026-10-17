import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "../utils"
import { useUiEnvironment } from "../ui-environment"
import { Button } from "./button"
import { Sheet } from "./sheet"
import {
  MEDIA_VIEWER_NO_ZOOM,
  getMediaViewerDoubleTapZoom,
  getMediaViewerPinchZoom,
  getMediaViewerSwipeDirection,
  mediaViewerDistance,
  type MediaViewerPoint,
  type MediaViewerZoom,
} from "./media-viewer-gestures"

const NARROW_QUERY = "(max-width: 767px)"
const TAP_SLOP = 10
const DOUBLE_TAP_MS = 300

export interface MediaViewerItem {
  id?: string | number
  src: string
  type?: "image" | "video"
  alt?: string
  width?: number
  height?: number
  posterSrc?: string
  placeholderSrc?: string
}

export interface MediaViewerContext<T extends MediaViewerItem = MediaViewerItem> {
  item: T
  index: number
  itemCount: number
  detailsOpen: boolean
  setDetailsOpen: (open: boolean) => void
  goPrevious: () => void
  goNext: () => void
  close: () => void
}

export type MediaViewerSlot<T extends MediaViewerItem = MediaViewerItem> =
  | React.ReactNode
  | ((context: MediaViewerContext<T>) => React.ReactNode)

export interface MediaViewerProps<T extends MediaViewerItem = MediaViewerItem> {
  items: readonly T[]
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
  desktopPanel?: MediaViewerSlot<T>
  mobileDetails?: MediaViewerSlot<T>
  mobileActions?: MediaViewerSlot<T>
  detailsOpen?: boolean
  defaultDetailsOpen?: boolean
  onDetailsOpenChange?: (open: boolean) => void
  ariaLabel?: string
  closeLabel?: string
  previousLabel?: string
  nextLabel?: string
  detailsLabel?: string
  autoPlayVideo?: boolean
  className?: string
  stageClassName?: string
}

interface GestureState {
  pointers: Map<number, MediaViewerPoint>
  startPoint: MediaViewerPoint
  startZoom: MediaViewerZoom
  pinchDistance: number
  pinchMidpoint: MediaViewerPoint
  pinched: boolean
  moved: boolean
  lastTapAt: number
}

function useNarrowViewport() {
  const environment = useUiEnvironment()
  const [narrow, setNarrow] = React.useState(() => environment.window.matchMedia(NARROW_QUERY).matches)

  React.useEffect(() => {
    const query = environment.window.matchMedia(NARROW_QUERY)
    const update = () => setNarrow(query.matches)
    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [environment.window])

  return narrow
}

function useElementSize(ref: React.RefObject<HTMLElement | null>) {
  const environment = useUiEnvironment()
  const [size, setSize] = React.useState({ width: 1, height: 1 })

  React.useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const report = () => {
      const bounds = element.getBoundingClientRect()
      setSize({ width: Math.max(1, bounds.width), height: Math.max(1, bounds.height) })
    }
    report()
    const ResizeObserverCtor = (environment.window as Window & typeof globalThis).ResizeObserver
    if (!ResizeObserverCtor) return
    const observer = new ResizeObserverCtor(report)
    observer.observe(element)
    return () => observer.disconnect()
  }, [environment.window, ref])

  return size
}

function containedHeight(mediaWidth: number, mediaHeight: number, boxWidth: number, boxHeight: number) {
  return mediaHeight * Math.min(boxWidth / mediaWidth, boxHeight / mediaHeight)
}

function renderSlot<T extends MediaViewerItem>(
  slot: MediaViewerSlot<T> | undefined,
  context: MediaViewerContext<T>,
) {
  return typeof slot === "function" ? slot(context) : slot
}

/** A modal, multi-item image/video viewer with responsive detail and action slots. */
export function MediaViewer<T extends MediaViewerItem>({
  items,
  index,
  onIndexChange,
  onClose,
  desktopPanel,
  mobileDetails,
  mobileActions,
  detailsOpen: controlledDetailsOpen,
  defaultDetailsOpen,
  onDetailsOpenChange,
  ariaLabel = "Media viewer",
  closeLabel = "Close viewer",
  previousLabel = "Previous item",
  nextLabel = "Next item",
  detailsLabel = "Details",
  autoPlayVideo = true,
  className,
  stageClassName,
}: MediaViewerProps<T>) {
  const environment = useUiEnvironment()
  const narrow = useNarrowViewport()
  const [internalDetailsOpen, setInternalDetailsOpen] = React.useState(
    () => defaultDetailsOpen ?? !environment.window.matchMedia(NARROW_QUERY).matches,
  )
  const detailsOpen = controlledDetailsOpen ?? internalDetailsOpen
  const setDetailsOpen = React.useCallback((open: boolean) => {
    if (controlledDetailsOpen === undefined) setInternalDetailsOpen(open)
    onDetailsOpenChange?.(open)
  }, [controlledDetailsOpen, onDetailsOpenChange])
  const item = items[index]
  const [zoom, setZoom] = React.useState<MediaViewerZoom>(MEDIA_VIEWER_NO_ZOOM)
  const [intrinsicSize, setIntrinsicSize] = React.useState<{ width: number; height: number } | null>(null)
  const [originalLoaded, setOriginalLoaded] = React.useState(false)
  const [sheetHeight, setSheetHeight] = React.useState(0)
  const viewerRef = React.useRef<HTMLDivElement>(null)
  const closeButtonRef = React.useRef<HTMLButtonElement>(null)
  const stageRef = React.useRef<HTMLDivElement>(null)
  const stageSize = useElementSize(stageRef)
  const gesture = React.useRef<GestureState>({
    pointers: new Map(),
    startPoint: { x: 0, y: 0 },
    startZoom: MEDIA_VIEWER_NO_ZOOM,
    pinchDistance: 0,
    pinchMidpoint: { x: 0, y: 0 },
    pinched: false,
    moved: false,
    lastTapAt: 0,
  })

  React.useEffect(() => {
    setZoom(MEDIA_VIEWER_NO_ZOOM)
    setIntrinsicSize(null)
    setOriginalLoaded(false)
    gesture.current.pointers.clear()
    gesture.current.lastTapAt = 0
  }, [index, item?.src])

  const goPrevious = React.useCallback(() => {
    if (index > 0) onIndexChange(index - 1)
  }, [index, onIndexChange])
  const goNext = React.useCallback(() => {
    if (index < items.length - 1) onIndexChange(index + 1)
  }, [index, items.length, onIndexChange])

  const context = React.useMemo<MediaViewerContext<T> | null>(() => item ? ({
    item,
    index,
    itemCount: items.length,
    detailsOpen,
    setDetailsOpen,
    goPrevious,
    goNext,
    close: onClose,
  }) : null, [detailsOpen, goNext, goPrevious, index, item, items.length, onClose, setDetailsOpen])

  const onKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    if (target.matches("input, textarea, select, [contenteditable='true']")) return
    if (event.altKey || event.ctrlKey || event.metaKey) return
    if (event.key === "ArrowLeft") {
      event.preventDefault()
      goPrevious()
    } else if (event.key === "ArrowRight") {
      event.preventDefault()
      goNext()
    } else if (event.key.toLowerCase() === "i") {
      event.preventDefault()
      setDetailsOpen(!detailsOpen)
    }
  }, [detailsOpen, goNext, goPrevious, setDetailsOpen])

  const onPointerDown = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse") return
    const state = gesture.current
    try { event.currentTarget.setPointerCapture(event.pointerId) } catch { /* synthetic pointers cannot be captured */ }
    state.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (state.pointers.size === 1) {
      state.startPoint = { x: event.clientX, y: event.clientY }
      state.startZoom = zoom
      state.pinched = false
      state.moved = false
    } else if (state.pointers.size === 2) {
      const [a, b] = [...state.pointers.values()]
      state.pinchDistance = mediaViewerDistance(a, b)
      state.pinchMidpoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      state.startZoom = zoom
      state.pinched = true
    }
  }, [zoom])

  const onPointerMove = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const state = gesture.current
    if (!state.pointers.has(event.pointerId)) return
    state.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (state.pointers.size >= 2) {
      const [a, b] = [...state.pointers.values()]
      setZoom(getMediaViewerPinchZoom({
        startZoom: state.startZoom,
        startDistance: state.pinchDistance,
        currentDistance: mediaViewerDistance(a, b),
        startMidpoint: state.pinchMidpoint,
        currentMidpoint: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      }))
      return
    }
    const deltaX = event.clientX - state.startPoint.x
    const deltaY = event.clientY - state.startPoint.y
    if (Math.abs(deltaX) > TAP_SLOP || Math.abs(deltaY) > TAP_SLOP) state.moved = true
    if (state.startZoom.scale > 1 && !state.pinched) {
      setZoom({ ...state.startZoom, x: state.startZoom.x + deltaX, y: state.startZoom.y + deltaY })
    }
  }, [])

  const onPointerUp = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const state = gesture.current
    if (!state.pointers.has(event.pointerId)) return
    state.pointers.delete(event.pointerId)
    if (state.pointers.size > 0) return

    const deltaX = event.clientX - state.startPoint.x
    const deltaY = event.clientY - state.startPoint.y
    const direction = state.pinched ? 0 : getMediaViewerSwipeDirection(deltaX, deltaY, state.startZoom.scale)
    if (direction === -1) {
      goPrevious()
      return
    }
    if (direction === 1) {
      goNext()
      return
    }
    if (state.pinched || state.moved) return

    if (event.timeStamp - state.lastTapAt < DOUBLE_TAP_MS) {
      state.lastTapAt = 0
      const bounds = event.currentTarget.getBoundingClientRect()
      setZoom(current => getMediaViewerDoubleTapZoom(
        current,
        { x: event.clientX, y: event.clientY },
        bounds,
      ))
      return
    }
    state.lastTapAt = event.timeStamp
    if (narrow && detailsOpen) setDetailsOpen(false)
  }, [detailsOpen, goNext, goPrevious, narrow, setDetailsOpen])

  const onPointerCancel = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    gesture.current.pointers.delete(event.pointerId)
  }, [])

  if (!item || !context) return null

  const mediaWidth = item.width ?? intrinsicSize?.width ?? stageSize.width
  const mediaHeight = item.height ?? intrinsicSize?.height ?? stageSize.height
  const mobileSheetOpen = narrow && detailsOpen && Boolean(mobileDetails)
  const activeSheetHeight = mobileSheetOpen ? sheetHeight : 0
  const fullMediaHeight = containedHeight(mediaWidth, mediaHeight, stageSize.width, stageSize.height)
  const availableHeight = Math.max(1, stageSize.height - activeSheetHeight)
  const fittedMediaHeight = containedHeight(mediaWidth, mediaHeight, stageSize.width, availableHeight)
  const sheetFitScale = narrow && fullMediaHeight > 0 ? Math.min(1, fittedMediaHeight / fullMediaHeight) : 1
  const stageOffsetY = narrow ? -activeSheetHeight / 2 : 0
  const sheetState = mobileSheetOpen ? "open" : "closed"
  const zoomed = zoom.scale > 1

  return (
    <DialogPrimitive.Root open modal onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogPrimitive.Portal container={environment.portalContainer}>
        <DialogPrimitive.Backdrop
          data-slot="media-viewer-overlay"
          data-motion="composed"
          className="rb-media-viewer-overlay fixed inset-0 z-[59] bg-black/80"
        />
        <DialogPrimitive.Popup
          ref={viewerRef}
          data-slot="media-viewer"
          data-motion="composed"
          aria-label={ariaLabel}
          initialFocus={closeButtonRef}
          className={cn("rb-media-viewer fixed inset-0 z-[60] flex bg-background text-foreground outline-none", narrow && "flex-col", className)}
          onKeyDown={onKeyDown}
        >
          <div
            ref={stageRef}
            data-slot="media-viewer-stage"
            data-zoom-scale={zoom.scale}
            className={cn("relative flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden bg-black/95 text-white", stageClassName)}
            style={item.type === "video" ? undefined : { touchAction: "none" }}
            onPointerDown={item.type === "video" ? undefined : onPointerDown}
            onPointerMove={item.type === "video" ? undefined : onPointerMove}
            onPointerUp={item.type === "video" ? undefined : onPointerUp}
            onPointerCancel={item.type === "video" ? undefined : onPointerCancel}
          >
            <Button
              ref={closeButtonRef}
              variant="ghost"
              size={narrow ? "icon-lg" : "icon"}
              className="absolute right-3 top-3 z-[65] rounded-full bg-black/40 text-xl text-white/70 hover:bg-black/50 hover:text-white"
              onClick={onClose}
              aria-label={closeLabel}
            >
              <i className="ph-bold ph-x" aria-hidden="true" />
            </Button>

            <div
              data-slot="media-viewer-media-fit"
              data-sheet-state={sheetState}
              className="rb-media-viewer-fit pointer-events-none absolute inset-0 flex items-center justify-center"
              style={{ transform: `translateY(${stageOffsetY}px) scale(${sheetFitScale})` }}
            >
              {item.type === "video" ? (
                <video
                  key={String(item.id ?? item.src)}
                  data-slot="media-viewer-video"
                  src={item.src}
                  aria-label={item.alt}
                  poster={item.posterSrc ?? item.placeholderSrc}
                  controls
                  autoPlay={autoPlayVideo}
                  preload="metadata"
                  className="pointer-events-auto max-h-[90svh] max-w-full object-contain"
                  onLoadedMetadata={(event) => setIntrinsicSize({
                    width: event.currentTarget.videoWidth,
                    height: event.currentTarget.videoHeight,
                  })}
                />
              ) : (
                <span className="pointer-events-auto grid h-full w-full place-items-center">
                  {item.placeholderSrc ? (
                    <img
                      data-slot="media-viewer-placeholder"
                      src={item.placeholderSrc}
                      alt=""
                      aria-hidden="true"
                      width={item.width}
                      height={item.height}
                      draggable={false}
                      className={cn(
                        "col-start-1 row-start-1 max-h-[90svh] max-w-full select-none object-contain transition-opacity duration-150",
                        originalLoaded ? "opacity-0" : "opacity-100",
                      )}
                    />
                  ) : null}
                  <img
                    key={String(item.id ?? item.src)}
                    data-slot="media-viewer-image"
                    src={item.src}
                    alt={item.alt ?? ""}
                    width={item.width}
                    height={item.height}
                    draggable={false}
                    className={cn(
                      "col-start-1 row-start-1 max-h-[90svh] max-w-full select-none object-contain transition-opacity duration-150",
                      item.placeholderSrc && !originalLoaded ? "opacity-0" : "opacity-100",
                    )}
                    style={{
                      transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`,
                      transition: gesture.current.pointers.size ? "none" : "transform 150ms ease-out, opacity 150ms ease-out",
                    }}
                    onLoad={(event) => {
                      setIntrinsicSize({
                        width: event.currentTarget.naturalWidth,
                        height: event.currentTarget.naturalHeight,
                      })
                      setOriginalLoaded(true)
                    }}
                  />
                </span>
              )}
            </div>

            <div
              data-slot="media-viewer-controls"
              data-sheet-state={sheetState}
              className="rb-media-viewer-controls pointer-events-none absolute inset-0"
              style={{ transform: `translateY(${stageOffsetY}px)` }}
            >
              {index > 0 && !zoomed ? (
                <Button
                  variant="ghost"
                  size="icon-lg"
                  className="pointer-events-auto absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 text-xl text-white/70 hover:bg-black/50 hover:text-white"
                  onClick={goPrevious}
                  onPointerDown={(event) => event.stopPropagation()}
                  aria-label={previousLabel}
                >
                  <i className="ph-bold ph-caret-left" aria-hidden="true" />
                </Button>
              ) : null}
              {index < items.length - 1 && !zoomed ? (
                <Button
                  variant="ghost"
                  size="icon-lg"
                  className="pointer-events-auto absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 text-xl text-white/70 hover:bg-black/50 hover:text-white"
                  onClick={goNext}
                  onPointerDown={(event) => event.stopPropagation()}
                  aria-label={nextLabel}
                >
                  <i className="ph-bold ph-caret-right" aria-hidden="true" />
                </Button>
              ) : null}
            </div>

            <div
              data-slot="media-viewer-position"
              aria-label={`Item ${index + 1} of ${items.length}`}
              className="absolute left-3 top-3 z-10 rounded-full bg-black/40 px-3 py-1.5 text-xs tabular-nums text-white/70 backdrop-blur-sm"
            >
              {index + 1} / {items.length}
            </div>

            <div
              data-slot="media-viewer-action-row"
              data-sheet-state={sheetState}
              className={cn(
                "absolute bottom-[calc(env(safe-area-inset-bottom)+0.5rem)] left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-overlay-10 bg-popover px-2 py-2 text-popover-foreground shadow-lg backdrop-blur-sm",
                !narrow && "bottom-4",
              )}
              style={{ opacity: mobileSheetOpen ? 0 : 1, pointerEvents: mobileSheetOpen ? "none" : "auto" }}
              onPointerDown={(event) => event.stopPropagation()}
            >
              {narrow ? renderSlot(mobileActions, context) : (
                <span className="px-1 text-sm tabular-nums text-text-muted">{index + 1} / {items.length}</span>
              )}
              {(narrow ? mobileDetails : desktopPanel) ? (
                <Button
                  variant="ghost"
                  size={narrow ? "sm" : "icon-sm"}
                  className="text-text-muted hover:bg-overlay-10 hover:text-contrast"
                  onClick={() => setDetailsOpen(!detailsOpen)}
                  aria-label={detailsOpen ? `Hide ${detailsLabel.toLowerCase()}` : `Show ${detailsLabel.toLowerCase()}`}
                  aria-expanded={detailsOpen}
                >
                  <i className="ph-bold ph-info" aria-hidden="true" />
                  {narrow ? detailsLabel : null}
                </Button>
              ) : null}
            </div>
          </div>

          {!narrow && detailsOpen && desktopPanel ? (
            <aside data-slot="media-viewer-desktop-panel" className="w-80 shrink-0 overflow-y-auto border-l border-overlay-10 bg-surface-elevated text-contrast">
              {renderSlot(desktopPanel, context)}
            </aside>
          ) : null}

          {narrow && mobileDetails ? (
            <Sheet
              open={mobileSheetOpen}
              onOpenChange={setDetailsOpen}
              aria-label={detailsLabel}
              onHeightChange={setSheetHeight}
              className="max-h-[60svh]"
            >
              {renderSlot(mobileDetails, context)}
            </Sheet>
          ) : null}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
