import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"

const source = readFileSync(new URL("./command-palette.tsx", import.meta.url), "utf8")

test("the command palette uses the shared dialog search field", () => {
  assert.match(source, /DialogSearchField/)
  assert.match(source, /<DialogSearchField>/)
  assert.doesNotMatch(source, /focus-within:ring-/)
})
