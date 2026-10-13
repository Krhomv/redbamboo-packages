import test from "node:test"
import assert from "node:assert/strict"
import type { MessagePart } from "../types.ts"
import { usesSquareEventMarker } from "./event-parts.ts"

const event = (name: string): MessagePart => ({
  type: "tool_use",
  toolName: `event:${name}`,
  content: "",
})

test("delegation is a square action marker while ambient events remain dots", () => {
  assert.equal(usesSquareEventMarker(event("delegation")), true)
  assert.equal(usesSquareEventMarker(event("weather")), false)
})

test("Natural Voice lifecycle events are square action markers", () => {
  assert.equal(usesSquareEventMarker(event("voice-session")), true)
  assert.equal(usesSquareEventMarker(event("presence")), false)
})
