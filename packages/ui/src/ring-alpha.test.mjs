import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"

const tokens = readFileSync(new URL("./tokens.css", import.meta.url), "utf8")

test("true-alpha ring utilities color the ring, not the outline", () => {
  const ringUtilities = tokens.match(/@utility ring-[a-z0-9-]+-a\d+ \{[^}]*\}/g) ?? []
  assert.ok(ringUtilities.length > 0)
  for (const utility of ringUtilities) assert.match(utility, /\{ --tw-ring-color: /, utility)
})
