import { describe, expect, it } from "bun:test"
import {
  lsp_diagnostics,
  lsp_find_references,
  lsp_goto_definition,
  lsp_prepare_rename,
  lsp_rename,
  lsp_symbols,
} from "../tools/lsp"

describe("LSP tool definitions", () => {
  it("exposes all public LSP tools", () => {
    expect(lsp_goto_definition).toBeDefined()
    expect(lsp_find_references).toBeDefined()
    expect(lsp_symbols).toBeDefined()
    expect(lsp_diagnostics).toBeDefined()
    expect(lsp_prepare_rename).toBeDefined()
    expect(lsp_rename).toBeDefined()
  })

  it("validates position inputs", async () => {
    const result = String(
      await (lsp_goto_definition.execute as any)({
        filePath: "missing.ts",
        line: 0,
        character: 0,
      }),
    )

    expect(result).toContain("line must be an integer >= 1")
  })
})
