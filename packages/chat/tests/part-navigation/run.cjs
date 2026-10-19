const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const os = require("node:os")
const { pathToFileURL } = require("node:url")
const { chromium } = require(require.resolve("playwright", { paths: [path.resolve(__dirname, "../../../testing")] }))

// Mounted shared-Chat fixture for previous/next navigation in activity-square
// details. PHOSPHOR_ROOT optionally points at an @phosphor-icons/web package so
// screenshots show the icons the Leaf shell normally provides.
async function main() {
  const packageRoot = path.resolve(__dirname, "../..")
  const scratch = process.env.REDLEAF_SCRATCH_DIR || fs.mkdtempSync(path.join(os.tmpdir(), "chat-part-nav-"))
  const shots = path.join(scratch, "part-navigation")
  fs.mkdirSync(shots, { recursive: true })
  const phosphorRoot = process.env.PHOSPHOR_ROOT && fs.realpathSync(process.env.PHOSPHOR_ROOT)
  const { createServer } = await import(pathToFileURL(require.resolve("vite")))
  const tailwind = (await import(pathToFileURL(require.resolve("@tailwindcss/vite", { paths: [path.resolve(packageRoot, "../ui")] })))).default
  const server = await createServer({ configFile: false, root: __dirname, plugins: [tailwind()],
    cacheDir: path.join(scratch, "part-nav-vite-cache"),
    resolve: { alias: {
      react: path.join(packageRoot, "node_modules/react"), "react-dom": path.join(packageRoot, "node_modules/react-dom"),
    } },
    server: { host: "127.0.0.1", port: 0, fs: { allow: [path.resolve(packageRoot, "../.."), scratch, ...(phosphorRoot ? [phosphorRoot] : [])] } },
  })
  let browser
  const results = []
  try {
    await server.listen()
    const origin = server.resolvedUrls.local[0]
    browser = await chromium.launch({ headless: true })
    for (const [width, height] of [[1440, 900], [390, 844]]) {
      const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 })
      const errors = []
      page.on("pageerror", error => errors.push(error.message))
      await page.goto(origin)
      if (phosphorRoot) {
        for (const weight of ["regular", "bold"]) {
          await page.addStyleTag({ url: `${origin}@fs/${path.join(phosphorRoot, "src", weight, "style.css").replace(/\\/g, "/")}` })
        }
        await page.evaluate(() => document.fonts.ready)
      }
      const dialog = page.locator('[data-slot="dialog-content"]')
      const counter = dialog.getByRole("group", { name: "Activity navigation" })
      const settle = async () => {
        await page.evaluate(() => Promise.all(document.getAnimations()
          .filter(a => Number.isFinite(a.effect?.getComputedTiming().endTime))
          .map(a => a.finished.catch(() => {}))))
      }
      const expectAt = async (title, position) => {
        await dialog.getByRole("heading", { name: title, exact: true }).waitFor()
        await counter.getByText(`${position} / 6`, { exact: true }).waitFor()
      }
      const shot = async name => {
        await settle()
        await page.screenshot({ path: path.join(shots, `${name}-${width}.png`) })
      }
      const navTop = async () => (await counter.boundingBox()).y

      await page.getByRole("button", { name: "Read", exact: true }).click()
      await expectAt("Read", 2)
      await shot("01-read")
      const readHeight = (await dialog.boundingBox()).height
      const readTop = await navTop()

      // A shorter result must not shrink the dialog out from under the arrows.
      await dialog.getByRole("button", { name: "Next activity" }).click()
      await expectAt("Grep", 3)
      await settle()
      assert((await dialog.boundingBox()).height >= readHeight - 1, "stepping holds the dialog height")
      assert(Math.abs((await navTop()) - readTop) <= 1, "arrows stay under the pointer")
      await shot("02-grep-held")

      await page.keyboard.press("ArrowRight")
      await expectAt("Glob", 4)
      // Edit sits after commentary text, in the next frieze of the same turn.
      await page.keyboard.press("ArrowRight")
      await expectAt("Edit", 5)
      await shot("03-edit-after-commentary")

      // Reach the end by pointer: focus then sits on Next as it goes inert.
      await dialog.getByRole("button", { name: "Next activity" }).click()
      await expectAt("Bash", 6)
      assert.equal(await dialog.getByRole("button", { name: "Next activity" }).getAttribute("aria-disabled"), "true", "no wrap at the end")
      assert(await dialog.evaluate(node => node.contains(document.activeElement)), "focus stays in the dialog at the end")
      await page.keyboard.press("ArrowRight")
      await expectAt("Bash", 6)
      await shot("04-last")

      await page.keyboard.press("ArrowLeft")
      await expectAt("Edit", 5)

      await page.keyboard.press("Escape")
      await dialog.waitFor({ state: "detached" })
      await page.getByRole("button", { name: "Thinking", exact: true }).click()
      await expectAt("Thinking", 1)
      assert.equal(await dialog.getByRole("button", { name: "Previous activity" }).getAttribute("aria-disabled"), "true", "no wrap at the start")
      await settle()
      assert((await dialog.boundingBox()).height < readHeight, "reopening releases the held height")
      await shot("05-first-reopened")
      await page.keyboard.press("Escape")
      await dialog.waitFor({ state: "detached" })

      assert.deepEqual(errors, [], `browser exceptions at ${width}px`)
      results.push({ width, passed: true })
      await page.close()
    }
  } finally {
    await browser?.close()
    await server.close()
  }
  fs.writeFileSync(path.join(shots, "results.json"), JSON.stringify(results, null, 2))
  console.log(`${results.length} part navigation viewports passed; screenshots in ${shots}`)
}
main().catch(error => { console.error(error); process.exitCode = 1 })
