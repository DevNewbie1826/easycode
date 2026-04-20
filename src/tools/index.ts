import type { ToolDefinition } from "@opencode-ai/plugin"
import { ast_grep_replace, ast_grep_search } from "./ast"
import { current_time } from "./current-time"
import {
  lsp_diagnostics,
  lsp_find_references,
  lsp_goto_definition,
  lsp_prepare_rename,
  lsp_rename,
  lsp_symbols,
} from "./lsp"

export function createTools(): Record<string, ToolDefinition> {
  return {
    ast_grep_search,
    ast_grep_replace,
    current_time,
    lsp_goto_definition,
    lsp_find_references,
    lsp_symbols,
    lsp_diagnostics,
    lsp_prepare_rename,
    lsp_rename,
  }
}
