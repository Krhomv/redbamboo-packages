import assert from "node:assert/strict"
import test from "node:test"
import type { TranscriptPayloadRef } from "../types.ts"
import { rebuildBlocks } from "./rebuild-blocks.ts"
import { fetchTranscriptPayload } from "./http-transcript-payload.ts"
import { processStreamEvent } from "./process-stream-event.ts"
import { TranscriptAccumulator } from "./transcript-accumulator.ts"

const ref: TranscriptPayloadRef = {
  recordId: 42,
  kind: "tool-output",
  length: 12,
  contentType: "text/plain; charset=utf-8",
  encoding: "utf-8",
  sha256: "abc",
  available: true,
}

const imageRef: TranscriptPayloadRef = {
  recordId: 43,
  kind: "assistant-image",
  length: 68,
  contentType: "image/png",
  encoding: "binary",
  sha256: "def",
  available: true,
}

test("rebuildBlocks preserves a payload reference without inline output", () => {
  const blocks = rebuildBlocks([{
    id: 42,
    role: "assistant",
    eventType: "tool_result",
    content: null,
    toolResult: null,
    payloadRef: ref,
    timestamp: "2026-08-01T12:00:00Z",
  }])

  assert.equal(blocks.length, 1)
  assert.equal(blocks[0]!.parts[0]!.content, "")
  assert.deepEqual(blocks[0]!.parts[0]!.payloadRef, ref)
})

test("live tool-result events preserve the payload reference without inline bytes", () => {
  const result = processStreamEvent([], true, {
    type: "tool_result",
    content: null,
    toolResult: null,
    payloadRef: ref,
  })
  assert.equal(result.messages[0]!.parts[0]!.content, "")
  assert.deepEqual(result.messages[0]!.parts[0]!.payloadRef, ref)
})

test("rebuildBlocks preserves a generated image payload as an image part", () => {
  const blocks = rebuildBlocks([{
    id: 43,
    role: "assistant",
    eventType: "image",
    content: "A smoke-lilac portrait",
    payloadRef: imageRef,
    timestamp: "2026-08-01T12:00:01Z",
  }])

  assert.equal(blocks[0]!.parts[0]!.type, "image")
  assert.equal(blocks[0]!.parts[0]!.content, "A smoke-lilac portrait")
  assert.deepEqual(blocks[0]!.parts[0]!.payloadRef, imageRef)
})

test("live generated-image events preserve their lazy payload reference", () => {
  const result = processStreamEvent([], true, {
    type: "image",
    content: "A smoke-lilac portrait",
    payloadRef: imageRef,
  })

  assert.equal(result.messages[0]!.parts[0]!.type, "image")
  assert.deepEqual(result.messages[0]!.parts[0]!.payloadRef, imageRef)
})

test("multiple generated images preserve transcript sequence order", () => {
  const secondRef = { ...imageRef, recordId: 44, sha256: "ghi" }
  const blocks = rebuildBlocks([
    {
      id: 44, role: "assistant", eventType: "image", content: "second",
      payloadRef: secondRef, messageUid: "turn-images", epoch: "epoch-images", sequence: 2,
      timestamp: "2026-08-01T12:00:02Z",
    },
    {
      id: 43, role: "assistant", eventType: "image", content: "first",
      payloadRef: imageRef, messageUid: "turn-images", epoch: "epoch-images", sequence: 1,
      timestamp: "2026-08-01T12:00:01Z",
    },
  ])

  assert.deepEqual(blocks[0]!.parts.map(part => part.content), ["first", "second"])
})

test("a durable generated image replaces its overlapping live delivery", () => {
  const accumulator = new TranscriptAccumulator()
  accumulator.receiveLive({
    type: "image", content: "portrait", payloadRef: imageRef,
    messageUid: "turn-image", epoch: "epoch-image", sequence: 1,
  })
  accumulator.startSnapshot("image-snapshot")

  const result = accumulator.commitSnapshot("image-snapshot", [{
    id: "turn-image",
    role: "assistant",
    parts: [{ type: "image", content: "portrait", payloadRef: imageRef }],
    timestamp: "2026-08-01T12:00:01Z",
    metadata: { messageUid: "turn-image" },
  }], { epoch: "epoch-image", throughSequence: 1 })

  assert.equal(result.messages[0]!.parts.length, 1)
  assert.equal(result.messages[0]!.parts[0]!.type, "image")
})

test("fetchTranscriptPayload sends an exact byte range and parses Content-Range", async () => {
  const originalFetch = globalThis.fetch
  let sentRange: string | null = null
  globalThis.fetch = async (_input, init) => {
    sentRange = new Headers(init?.headers).get("range")
    return new Response(new Uint8Array([1, 2, 3, 4]), {
      status: 206,
      headers: { "Content-Range": "bytes 4-7/12" },
    })
  }

  try {
    const chunk = await fetchTranscriptPayload("/output", ref, { start: 4, end: 8 }, new AbortController().signal)
    assert.equal(sentRange, "bytes=4-7")
    assert.equal(chunk.start, 4)
    assert.equal(chunk.end, 8)
    assert.equal(chunk.total, 12)
    assert.deepEqual([...chunk.bytes], [1, 2, 3, 4])
  } finally {
    globalThis.fetch = originalFetch
  }
})
