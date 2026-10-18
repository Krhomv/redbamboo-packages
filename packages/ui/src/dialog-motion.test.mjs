import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"

const dialogSource = readFileSync(new URL("./components/dialog.tsx", import.meta.url), "utf8")
const tokens = readFileSync(new URL("./tokens.css", import.meta.url), "utf8")

test("dialogs expose composed and snappy motion with composed as the default", () => {
  assert.match(dialogSource, /export type DialogMotion = "composed" \| "snappy"/)
  assert.equal(dialogSource.match(/motion = "composed"/g)?.length, 2)
  assert.equal(dialogSource.match(/data-motion=\{motion\}/g)?.length, 2)
})

test("dialog motion keeps one backdrop treatment and distinct timing profiles", () => {
  assert.match(tokens, /\.rb-dialog-overlay\s*\{[\s\S]*?background-color: rgb\(0 0 0 \/ 10%\);[\s\S]*?backdrop-filter: blur\(4px\);/)
  assert.match(tokens, /\.rb-dialog-overlay\[data-motion="composed"\]\[data-open\][\s\S]*?220ms/)
  assert.match(tokens, /\.rb-dialog-content\[data-motion="composed"\][data-open\][\s\S]*?240ms/)
  assert.match(tokens, /\.rb-dialog-overlay\[data-motion="snappy"\]\[data-open\][\s\S]*?110ms/)
  assert.match(tokens, /\.rb-dialog-content\[data-motion="snappy"\][data-open\][\s\S]*?120ms/)
  assert.match(tokens, /prefers-reduced-motion: reduce[\s\S]*?animation-duration: 1ms/)
})

test("dialog search fields keep keyboard focus visible without a thick halo", () => {
  assert.match(dialogSource, /function DialogSearchField/)
  assert.match(dialogSource, /data-slot="dialog-search-field"/)
  assert.match(dialogSource, /focus-within:border-ring/)
  assert.doesNotMatch(dialogSource, /focus-within:ring-/)
})

test("dialog width keeps a mobile gutter when consumers override max width", () => {
  assert.match(dialogSource, /w-\[calc\(100%-2rem\)\]/)
  assert.match(dialogSource, /sm:max-w-md/)
  assert.doesNotMatch(dialogSource, /w-full max-w-\[calc\(100%-2rem\)\]/)
})

test("dialog frame uses the panel delimiter and a theme-aware floating shadow", () => {
  assert.match(dialogSource, /border border-border bg-popover/)
  assert.match(dialogSource, /shadow-\(--dialog-shadow\)/)
  assert.doesNotMatch(dialogSource, /rb-dialog-content[^"]*ring-1/)
  assert.match(tokens, /:root \{[\s\S]*?--dialog-shadow:[\s\S]*?\}/)
  assert.match(tokens, /:root\.dark \{[\s\S]*?--dialog-shadow:[\s\S]*?\}/)
})
