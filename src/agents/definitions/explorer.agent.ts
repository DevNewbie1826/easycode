import { builtinAgentPermissionPolicy } from "../builtin-policy"
import type { AgentDefinition } from "../types"
import { loadAgentPrompt } from "../prompt-loader"

const explorerAgent: AgentDefinition = {
  name: "explorer",
  description:
    "Context-aware codebase search for answering “Where is X?”, “Which file contains Y?”, and “Find the code that does Z,” with parallel broad search and adjustable thoroughness from quick to very thorough.",
  prompt: loadAgentPrompt("explorer-prompt.md"),
  mode: "subagent",
  defaults: {
    temperature: 0.1,
    permission: builtinAgentPermissionPolicy.explorer,
  },
}

export default explorerAgent
