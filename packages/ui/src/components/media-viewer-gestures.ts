export interface MediaViewerZoom {
  scale: number
  x: number
  y: number
}

export interface MediaViewerPoint {
  x: number
  y: number
}

export const MEDIA_VIEWER_NO_ZOOM: MediaViewerZoom = { scale: 1, x: 0, y: 0 }
export const MEDIA_VIEWER_MAX_ZOOM = 4
export const MEDIA_VIEWER_DOUBLE_TAP_ZOOM = 2.5
export const MEDIA_VIEWER_SWIPE_DISTANCE = 60

export function mediaViewerDistance(a: MediaViewerPoint, b: MediaViewerPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function getMediaViewerSwipeDirection(
  deltaX: number,
  deltaY: number,
  scale: number,
): -1 | 0 | 1 {
  if (
    scale !== 1
    || Math.abs(deltaX) <= MEDIA_VIEWER_SWIPE_DISTANCE
    || Math.abs(deltaX) <= Math.abs(deltaY) * 1.5
  ) return 0
  return deltaX < 0 ? 1 : -1
}

export function getMediaViewerPinchZoom({
  startZoom,
  startDistance,
  currentDistance,
  startMidpoint,
  currentMidpoint,
}: {
  startZoom: MediaViewerZoom
  startDistance: number
  currentDistance: number
  startMidpoint: MediaViewerPoint
  currentMidpoint: MediaViewerPoint
}): MediaViewerZoom {
  const ratio = startDistance > 0 ? currentDistance / startDistance : 1
  const scale = Math.min(MEDIA_VIEWER_MAX_ZOOM, Math.max(1, startZoom.scale * ratio))
  if (scale === 1) return MEDIA_VIEWER_NO_ZOOM
  return {
    scale,
    x: startZoom.x + currentMidpoint.x - startMidpoint.x,
    y: startZoom.y + currentMidpoint.y - startMidpoint.y,
  }
}

export function getMediaViewerDoubleTapZoom(
  current: MediaViewerZoom,
  tap: MediaViewerPoint,
  bounds: { left: number; top: number; width: number; height: number },
): MediaViewerZoom {
  if (current.scale > 1) return MEDIA_VIEWER_NO_ZOOM
  const offsetX = tap.x - (bounds.left + bounds.width / 2)
  const offsetY = tap.y - (bounds.top + bounds.height / 2)
  return {
    scale: MEDIA_VIEWER_DOUBLE_TAP_ZOOM,
    x: -offsetX * (MEDIA_VIEWER_DOUBLE_TAP_ZOOM - 1),
    y: -offsetY * (MEDIA_VIEWER_DOUBLE_TAP_ZOOM - 1),
  }
}
