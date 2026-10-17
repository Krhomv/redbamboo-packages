import assert from "node:assert/strict"
import { mkdir } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"
import { createServer } from "vite"

const fixtureDir = path.dirname(fileURLToPath(import.meta.url))
const outputDir = path.join(process.env.REDLEAF_SCRATCH_DIR || process.env.TEMP, "ui-media-overlays")
await mkdir(outputDir, { recursive: true })

const server = await createServer({
  root: fixtureDir,
  configFile: path.join(fixtureDir, "vite.config.ts"),
  server: { host: "127.0.0.1", port: 0 },
  logLevel: "error",
})

let browser
try {
  await server.listen()
  const baseUrl = server.resolvedUrls?.local[0]
  assert.ok(baseUrl, "Vite did not expose a local story URL")
  browser = await chromium.launch({ headless: true })

  const errors = []
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 960 } })
  const page = await desktop.newPage()
  page.on("pageerror", error => errors.push(error.message))
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()) })

  await page.goto(`${baseUrl}?component=sheet&theme=light`, { waitUntil: "networkidle" })
  const sheet = page.locator('[data-slot="sheet"]')
  await sheet.waitFor()
  assert.equal(await sheet.evaluate((node) => node.contains(document.activeElement)), true, "Sheet should receive focus")
  await page.getByTestId("sheet-last-action").focus()
  await page.keyboard.press("Tab")
  await page.waitForFunction(() => document.querySelector('[data-slot="sheet"]')?.contains(document.activeElement))
  await page.keyboard.press("Escape")
  await sheet.waitFor({ state: "hidden" })
  await page.getByRole("button", { name: "Open sheet" }).click()
  await sheet.waitFor()
  await page.locator('[data-slot="sheet-overlay"]').click({ position: { x: 10, y: 10 } })
  await sheet.waitFor({ state: "hidden" })

  await page.goto(`${baseUrl}?component=viewer&theme=dark`, { waitUntil: "networkidle" })
  const viewer = page.locator('[data-slot="media-viewer"]')
  await viewer.waitFor()
  assert.equal(await viewer.evaluate((node) => node.contains(document.activeElement)), true, "MediaViewer should receive focus")
  await page.keyboard.press("ArrowRight")
  await page.getByLabel("Item 2 of 3").waitFor()
  await page.keyboard.press("ArrowRight")
  await page.locator('[data-slot="media-viewer-video"]').waitFor()
  await page.keyboard.press("ArrowLeft")
  await page.locator('[data-slot="media-viewer-image"]').waitFor()
  await page.keyboard.press("i")
  await page.locator('[data-slot="media-viewer-desktop-panel"]').waitFor({ state: "hidden" })
  await page.keyboard.press("i")
  await page.locator('[data-slot="media-viewer-desktop-panel"]').waitFor()
  await page.keyboard.press("Escape")
  await viewer.waitFor({ state: "hidden" })
  assert.deepEqual(errors, [], `browser errors: ${errors.join("\n")}`)
  await desktop.close()

  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
  const phonePage = await phone.newPage()
  phonePage.on("pageerror", error => errors.push(error.message))
  await phonePage.goto(`${baseUrl}?component=viewer&theme=light`, { waitUntil: "networkidle" })
  const phoneViewer = phonePage.locator('[data-slot="media-viewer"]')
  const stage = phonePage.locator('[data-slot="media-viewer-stage"]')
  await phonePage.getByRole("button", { name: "Show details" }).click()
  await phonePage.locator('[data-slot="sheet"]').waitFor()
  await phonePage.waitForFunction(() => {
    const fit = document.querySelector('[data-slot="media-viewer-media-fit"]')
    return fit instanceof HTMLElement && !fit.style.transform.startsWith("translateY(0px)")
  })
  await phonePage.keyboard.press("Escape")
  await phonePage.locator('[data-slot="sheet"]').waitFor({ state: "hidden" })
  assert.equal(await phoneViewer.isVisible(), true, "first Escape should close only the nested Sheet")

  await stage.dispatchEvent("pointerdown", { pointerId: 1, pointerType: "touch", clientX: 320, clientY: 350, isPrimary: true })
  await stage.dispatchEvent("pointerup", { pointerId: 1, pointerType: "touch", clientX: 150, clientY: 350, isPrimary: true })
  await phonePage.getByLabel("Item 2 of 3").waitFor()
  await phonePage.keyboard.press("ArrowLeft")
  await phonePage.getByLabel("Item 1 of 3").waitFor()

  for (let tap = 0; tap < 2; tap += 1) {
    await stage.dispatchEvent("pointerdown", { pointerId: 2 + tap, pointerType: "touch", clientX: 250, clientY: 300, isPrimary: true })
    await stage.dispatchEvent("pointerup", { pointerId: 2 + tap, pointerType: "touch", clientX: 250, clientY: 300, isPrimary: true })
  }
  await phonePage.waitForFunction(() => document.querySelector('[data-slot="media-viewer-stage"]')?.getAttribute("data-zoom-scale") === "2.5")

  for (let tap = 0; tap < 2; tap += 1) {
    await stage.dispatchEvent("pointerdown", { pointerId: 4 + tap, pointerType: "touch", clientX: 250, clientY: 300, isPrimary: true })
    await stage.dispatchEvent("pointerup", { pointerId: 4 + tap, pointerType: "touch", clientX: 250, clientY: 300, isPrimary: true })
  }
  await phonePage.waitForFunction(() => document.querySelector('[data-slot="media-viewer-stage"]')?.getAttribute("data-zoom-scale") === "1")
  await stage.dispatchEvent("pointerdown", { pointerId: 7, pointerType: "touch", clientX: 100, clientY: 300, isPrimary: true })
  await stage.dispatchEvent("pointerdown", { pointerId: 8, pointerType: "touch", clientX: 200, clientY: 300 })
  await stage.dispatchEvent("pointermove", { pointerId: 8, pointerType: "touch", clientX: 300, clientY: 300 })
  await phonePage.waitForFunction(() => Number(document.querySelector('[data-slot="media-viewer-stage"]')?.getAttribute("data-zoom-scale")) > 1)
  await stage.dispatchEvent("pointerup", { pointerId: 8, pointerType: "touch", clientX: 300, clientY: 300 })
  await stage.dispatchEvent("pointerup", { pointerId: 7, pointerType: "touch", clientX: 100, clientY: 300, isPrimary: true })
  await phonePage.keyboard.press("Escape")
  await phoneViewer.waitFor({ state: "hidden" })
  assert.deepEqual(errors, [], `browser errors: ${errors.join("\n")}`)
  await phone.close()

  const captures = [
    { component: "sheet", theme: "light", width: 1440, height: 960 },
    { component: "sheet", theme: "dark", width: 1440, height: 960 },
    { component: "sheet", theme: "light", width: 390, height: 844 },
    { component: "sheet", theme: "dark", width: 390, height: 844 },
    { component: "viewer", theme: "light", width: 1440, height: 960 },
    { component: "viewer", theme: "dark", width: 1440, height: 960 },
    { component: "viewer", theme: "light", width: 390, height: 844, openDetails: true },
    { component: "viewer", theme: "dark", width: 390, height: 844, openDetails: true },
  ]

  for (const capture of captures) {
    const context = await browser.newContext({ viewport: { width: capture.width, height: capture.height }, hasTouch: capture.width < 768, isMobile: capture.width < 768 })
    const capturePage = await context.newPage()
    await capturePage.goto(`${baseUrl}?component=${capture.component}&theme=${capture.theme}`, { waitUntil: "networkidle" })
    if (capture.openDetails) await capturePage.getByRole("button", { name: "Show details" }).click()
    await capturePage.locator(`[data-slot="${capture.component === "viewer" ? "media-viewer" : "sheet"}"]`).waitFor()
    if (capture.component === "viewer") {
      await capturePage.waitForFunction(() => {
        const image = document.querySelector('[data-slot="media-viewer-image"]')
        return image instanceof HTMLImageElement
          && image.complete
          && image.naturalWidth > 0
          && getComputedStyle(image).opacity === "1"
      })
    }
    if (capture.openDetails) {
      await capturePage.waitForFunction(() => {
        const fit = document.querySelector('[data-slot="media-viewer-media-fit"]')
        return fit instanceof HTMLElement && !fit.style.transform.startsWith("translateY(0px)")
      })
    }
    const filename = `${capture.component}-${capture.theme}-${capture.width}x${capture.height}.png`
    await capturePage.screenshot({ path: path.join(outputDir, filename), fullPage: true, animations: "disabled" })
    await context.close()
  }

  console.log(`Component acceptance passed; screenshots: ${outputDir}`)
} finally {
  await browser?.close()
  await server.close()
}
