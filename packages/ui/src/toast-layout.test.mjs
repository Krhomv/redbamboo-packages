import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"

const toastSource = readFileSync(new URL("./components/toast.tsx", import.meta.url), "utf8")

test("toaster keeps equal mobile gutters and a bounded desktop width", () => {
  assert.match(toastSource, /fixed bottom-4 left-4 right-4/)
  assert.match(toastSource, /sm:left-auto sm:max-w-sm/)
  assert.doesNotMatch(toastSource, /right-4 z-\[100\] flex flex-col gap-2 max-w-sm/)
})
