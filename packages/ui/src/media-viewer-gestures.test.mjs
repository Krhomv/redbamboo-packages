import assert from "node:assert/strict"
import { test } from "node:test"

import {
  MEDIA_VIEWER_NO_ZOOM,
  getMediaViewerDoubleTapZoom,
  getMediaViewerPinchZoom,
  getMediaViewerSwipeDirection,
} from "./components/media-viewer-gestures.ts"

test("horizontal swipes navigate only when the unzoomed gesture is decisive", () => {
  assert.equal(getMediaViewerSwipeDirection(-80, 8, 1), 1)
  assert.equal(getMediaViewerSwipeDirection(80, 8, 1), -1)
  assert.equal(getMediaViewerSwipeDirection(-40, 0, 1), 0)
  assert.equal(getMediaViewerSwipeDirection(-80, 70, 1), 0)
  assert.equal(getMediaViewerSwipeDirection(-80, 0, 2), 0)
})

test("pinch zoom clamps scale and follows the moving midpoint", () => {
  assert.deepEqual(getMediaViewerPinchZoom({
    startZoom: MEDIA_VIEWER_NO_ZOOM,
    startDistance: 100,
    currentDistance: 250,
    startMidpoint: { x: 50, y: 60 },
    currentMidpoint: { x: 65, y: 40 },
  }), { scale: 2.5, x: 15, y: -20 })

  assert.equal(getMediaViewerPinchZoom({
    startZoom: { scale: 3, x: 0, y: 0 },
    startDistance: 100,
    currentDistance: 300,
    startMidpoint: { x: 0, y: 0 },
    currentMidpoint: { x: 0, y: 0 },
  }).scale, 4)
})

test("double tap zooms around the tap and a second double tap resets", () => {
  const zoomed = getMediaViewerDoubleTapZoom(
    MEDIA_VIEWER_NO_ZOOM,
    { x: 75, y: 25 },
    { left: 0, top: 0, width: 100, height: 100 },
  )
  assert.deepEqual(zoomed, { scale: 2.5, x: -37.5, y: 37.5 })
  assert.equal(getMediaViewerDoubleTapZoom(zoomed, { x: 0, y: 0 }, { left: 0, top: 0, width: 1, height: 1 }), MEDIA_VIEWER_NO_ZOOM)
})
