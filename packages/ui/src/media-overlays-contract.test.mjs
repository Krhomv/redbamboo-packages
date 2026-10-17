import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"

const sheet = readFileSync(new URL("./components/sheet.tsx", import.meta.url), "utf8")
const viewer = readFileSync(new URL("./components/media-viewer.tsx", import.meta.url), "utf8")
const tokens = readFileSync(new URL("./tokens.css", import.meta.url), "utf8")

test("Sheet delegates focus trap, Escape, and scrim dismissal to a modal dialog layer", () => {
  assert.match(sheet, /modal = true/)
  assert.match(sheet, /modal=\{modal\}/)
  assert.match(sheet, /disablePointerDismissal=\{!closeOnOutsidePress\}/)
  assert.match(sheet, /\{modal \? <DialogPrimitive\.Backdrop/)
  assert.match(sheet, /data-slot="sheet"/)
  assert.match(sheet, /container=\{environment\.portalContainer\}/)
  assert.match(sheet, /ResizeObserverCtor/)
  assert.match(sheet, /env\(safe-area-inset-bottom\)/)
  assert.match(sheet, /size="icon-sm"[\s\S]*?size-11[\s\S]*?ph-caret-down/)
})

test("MediaViewer exposes keyboard, responsive slots, and both media types", () => {
  assert.match(viewer, /event\.key === "ArrowLeft"/)
  assert.match(viewer, /event\.key === "ArrowRight"/)
  assert.match(viewer, /event\.key\.toLowerCase\(\) === "i"/)
  assert.match(viewer, /data-slot="media-viewer-video"/)
  assert.match(viewer, /data-slot="media-viewer-image"/)
  assert.match(viewer, /data-slot="media-viewer-placeholder"/)
  assert.match(viewer, /const \[stageSize, setStage\] = useElementSize<HTMLDivElement>\(\)/)
  assert.match(viewer, /ref=\{setStage\}/)
  assert.match(viewer, /observerRef\.current\?\.disconnect\(\)/)
  assert.match(viewer, /desktopPanel/)
  assert.match(viewer, /mobileDetails/)
  assert.match(viewer, /mobileActions/)
  assert.match(viewer, /<Sheet/)
  assert.match(viewer, /zoom: MediaViewerZoom/)
  assert.match(viewer, /resetZoom: \(\) => void/)
  assert.match(viewer, /resetZoomOnSheetOpen = true/)
  assert.match(viewer, /modal=\{false\}/)
  assert.match(viewer, /closeOnOutsidePress=\{false\}/)
  assert.match(viewer, /initialFocus=\{closeButtonRef\}/)
  assert.match(viewer, /data-slot="media-viewer-stage"[\s\S]*?bg-black\/95 text-white/)
  assert.match(viewer, /data-slot="media-viewer-action-row"[\s\S]*?bg-popover[\s\S]*?text-popover-foreground/)
  assert.match(viewer, /data-slot="media-viewer-desktop-panel"[\s\S]*?bg-surface-elevated text-contrast/)
})

test("sheet choreography uses composed timing and honors reduced motion", () => {
  assert.match(tokens, /\.rb-sheet\[data-side="bottom"\]\[data-motion="composed"\]\[data-open\][\s\S]*?240ms/)
  assert.match(tokens, /\.rb-media-viewer-fit[\s\S]*?220ms cubic-bezier\(0\.16, 1, 0\.3, 1\)/)
  assert.match(tokens, /prefers-reduced-motion: reduce[\s\S]*?\.rb-sheet\[data-side="bottom"\]\[data-motion\]\[data-open\][\s\S]*?animation-duration: 0s/)
  assert.match(tokens, /prefers-reduced-motion: reduce[\s\S]*?\.rb-media-viewer-fit\[data-sheet-state\][\s\S]*?transition-duration: 0s/)
  assert.match(tokens, /prefers-reduced-motion: reduce[\s\S]*?\.rb-media-viewer-media\[data-gesture-active\][\s\S]*?transition-duration: 0s/)
  assert.doesNotMatch(viewer, /transition: gesture\.current/, "zoom transition must live in tokens.css so reduced motion can disable it")
})
