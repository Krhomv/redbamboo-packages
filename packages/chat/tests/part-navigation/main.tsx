import React from "react"
import { createRoot } from "react-dom/client"
import { ChatPanel } from "../../src/components/chat-panel"
import type { MessageBlock, MessagePart } from "../../src/types"
import "./fixture.css"

const stamp = "2026-10-19T07:10:00Z"

const tool = (toolName: string, input: Record<string, unknown>, result: string): MessagePart[] => [
  { type: "tool_use", toolName, toolInput: JSON.stringify(input), content: "" },
  { type: "tool_result", content: result },
]

const readOutput = [
  "565\tfunction PartFrieze({ parts, allParts, isLive }: {",
  "566\t  parts: MessagePart[]",
  "567\t  allParts: MessagePart[]",
  "568\t  isLive?: boolean",
  "569\t}) {",
  "570\t  const [selected, setSelected] = useState<Selection | null>(null)",
  "571\t  const retainedSelection = useRef<typeof selected>(null)",
  "572\t  if (selected) retainedSelection.current = selected",
  "573\t  const modalSelection = selected ?? retainedSelection.current",
  "574\t",
  "575\t  const handleClick = (part: MessagePart) => {",
  "576\t    setSelected({ part, index: allParts.indexOf(part) })",
  "577\t  }",
  "578\t",
  "579\t  return (",
  "580\t    <>",
  "581\t      <div className=\"flex flex-wrap items-center gap-[3px] py-1.5 px-0.5\">",
  "582\t        {parts.filter(p => p.type !== \"tool_result\").map((part, i) => (",
  "583\t          <button key={i} onClick={() => handleClick(part)} />",
  "584\t        ))}",
  "585\t      </div>",
  "586\t      <PartModal part={modalSelection?.part} open={!!selected} />",
  "587\t    </>",
  "588\t  )",
  "589\t}",
].join("\n")

const messages: MessageBlock[] = [
  { id: "user", role: "user", timestamp: stamp, parts: [{ type: "text", content: "When looking at tool squares modals, it'd be great to have arrows to move to the next or previous one." }] },
  { id: "assistant", role: "assistant", timestamp: stamp, parts: [
    { type: "thinking", messageId: "t1", thinkingState: "completed", content: "The modal lives in `PartFrieze`. Navigation should walk **every square in the turn**, including the ones after commentary, and stop at both ends rather than wrapping." },
    ...tool("Read", { file_path: "T:/Projects/redbamboo-packages/packages/chat/src/components/chat-message.tsx", offset: 565, limit: 25 }, readOutput),
    ...tool("Grep", { pattern: "PartModal", path: "T:/Projects/redbamboo-packages/packages/chat/src" }, "packages/chat/src/components/chat-message.tsx:622\npackages/chat/src/components/chat-message.tsx:651"),
    ...tool("Glob", { pattern: "**/dialog.tsx", path: "T:/Projects/redbamboo-packages/packages/ui/src" }, "T:/Projects/redbamboo-packages/packages/ui/src/components/dialog.tsx"),
    { type: "text", phase: "commentary", content: "Found the modal. Wiring the arrows into its header now." },
    ...tool("Edit", { file_path: "T:/Projects/redbamboo-packages/packages/chat/src/components/chat-message.tsx", old_string: "  const handleClick = (part: MessagePart) => {\n    setSelected({ part, index: allParts.indexOf(part) })\n  }", new_string: "  const handleClick = (part: MessagePart) => {\n    setMinHeight(0)\n    select(allParts.indexOf(part))\n  }" }, "The file chat-message.tsx has been updated successfully."),
    ...tool("Bash", { command: "npx tsc --noEmit && pnpm test", description: "Typecheck and run chat tests" }, "# tests 244\n# pass 244\n# fail 0"),
    { type: "text", content: "Done. Arrows are in the header, and left/right on the keyboard step through every square in the turn." },
  ] },
]

function App() {
  return <div style={{ width: "100%", height: "100vh" }}>
    <ChatPanel messages={messages} isStreaming={false} sessionId="part-navigation" persistQueue={false}
      resolveFileLink={() => () => {}} />
  </div>
}

createRoot(document.getElementById("root")!).render(<App />)
