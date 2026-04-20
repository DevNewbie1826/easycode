import { describe, expect, it } from "bun:test"
import { encodeMessage, MAX_JSONRPC_CONTENT_LENGTH, parseMessages } from "../tools/lsp/jsonrpc"

describe("encodeMessage", () => {
  it("adds a Content-Length header", () => {
    const bytes = encodeMessage({ jsonrpc: "2.0", id: 1, method: "initialize" })
    const text = new TextDecoder().decode(bytes)

    expect(text).toContain("Content-Length:")
    expect(text).toContain("initialize")
  })
})

describe("parseMessages", () => {
  it("parses a complete JSON-RPC payload", () => {
    const bytes = encodeMessage({ jsonrpc: "2.0", id: 1, result: { ok: true } })
    const parsed = parseMessages(bytes)

    expect(parsed.messages).toHaveLength(1)
  })

  it("keeps incomplete frames buffered", () => {
    const bytes = encodeMessage({ jsonrpc: "2.0", id: 1, result: { ok: true } })
    const partial = bytes.subarray(0, bytes.length - 5)
    const parsed = parseMessages(partial)

    expect(parsed.messages).toHaveLength(0)
    expect(parsed.consumed).toBe(0)
  })

  it("rejects frames larger than the configured limit", () => {
    const tooLarge = new TextEncoder().encode(`Content-Length: ${MAX_JSONRPC_CONTENT_LENGTH + 1}\r\n\r\n`)

    expect(() => parseMessages(tooLarge)).toThrow("exceeds max")
  })
})
