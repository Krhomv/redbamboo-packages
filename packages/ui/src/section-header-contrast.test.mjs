import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"

const settingsSource = readFileSync(new URL("./components/settings.tsx", import.meta.url), "utf8")

const themes = {
  light: { muted: "#656D76", primary: "#1F2328", surfaces: ["#FFFFFF", "#FAFBFC", "#FAFBFC"] },
  dark: { muted: "#A2A3A9", primary: "#D0D1D6", surfaces: ["#363842", "#2E3038", "#262830"] },
  "low-contrast light": { muted: "#686E77", primary: "#4D5259", surfaces: ["#F7F8F9", "#F2F3F5", "#F2F3F5"] },
  "high-contrast dark": { muted: "#C0C1C6", primary: "#F0F1F4", surfaces: ["#232530", "#1A1C22", "#111318"] },
}

function luminance(hex) {
  const channels = hex.match(/[\da-f]{2}/gi).map(value => Number.parseInt(value, 16) / 255)
  const [red, green, blue] = channels.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

function contrast(a, b) {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (lighter + 0.05) / (darker + 0.05)
}

test("SectionHeader stays muted without changing its compact hierarchy", () => {
  assert.match(settingsSource, /text-\[11px\][^"\n]*text-text-muted/)
  assert.doesNotMatch(settingsSource, /data-slot="section-header"[\s\S]{0,160}text-text-primary/)
})

test("SectionHeader clears WCAG AA on every supported panel surface", () => {
  for (const [theme, { muted, primary, surfaces }] of Object.entries(themes)) {
    for (const surface of surfaces) {
      assert.ok(contrast(muted, surface) >= 4.6, `${theme}: ${muted} on ${surface}`)
    }
    assert.ok(contrast(muted, primary) >= 1.5, `${theme}: muted remains distinct from primary`)
  }
})
