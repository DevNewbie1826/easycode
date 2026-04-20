import { builtinAgentPermissionPolicy } from "../builtin-policy"
import type { AgentDefinition } from "../types"
import { loadAgentPrompt } from "../prompt-loader"

const librarianAgent: AgentDefinition = {
  name: "librarian",
  description:
    "Evidence-first open-source codebase investigation agent for remote repository analysis, official documentation lookup, library internals, implementation tracing, and GitHub-permalink-backed answers.",
  prompt: loadAgentPrompt("librarian-prompt.md"),
  mode: "subagent",
  defaults: {
    temperature: 0.1,
    permission: builtinAgentPermissionPolicy.librarian,
  },
}

export default librarianAgent
