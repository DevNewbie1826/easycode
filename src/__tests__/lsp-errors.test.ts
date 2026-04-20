import { describe, expect, it } from "bun:test"
import { LspError, formatLspError, isLspError } from "../tools/lsp/errors"

describe("LspError", () => {
  it("creates serverNotFound errors", () => {
    const err = LspError.serverNotFound("typescript", "npm install -g typescript-language-server")

    expect(err.code).toBe("SERVER_NOT_FOUND")
    expect(err.message).toContain("typescript")
  })

  it("creates timeout errors", () => {
    const err = LspError.requestTimeout("textDocument/definition", 30000)

    expect(err.code).toBe("REQUEST_TIMEOUT")
    expect(formatLspError(err)).toContain("Retry")
  })

  it("supports instanceof guards", () => {
    expect(isLspError(LspError.notSupported("rename"))).toBe(true)
    expect(isLspError(new Error("plain"))).toBe(false)
  })
})
