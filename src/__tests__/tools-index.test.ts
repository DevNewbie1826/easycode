import { describe, expect, it } from "bun:test"
import { createTools } from "../tools"

describe("createTools", () => {
  it("returns the full public tool registry", () => {
    const tools = createTools()

    expect(Object.keys(tools).sort()).toEqual([
      "ast_grep_replace",
      "ast_grep_search",
      "current_time",
      "lsp_diagnostics",
      "lsp_find_references",
      "lsp_goto_definition",
      "lsp_prepare_rename",
      "lsp_rename",
      "lsp_symbols",
    ])
  })
})
