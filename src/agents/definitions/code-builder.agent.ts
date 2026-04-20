import { builtinAgentPermissionPolicy } from "../builtin-policy";
import type { AgentDefinition } from "../types";
import { loadAgentPrompt } from "../prompt-loader";

const codeBuilderAgent: AgentDefinition = {
  name: "code-builder",
  description:
    "Executes one implementation task from an approved Implementation Plan by making the minimum necessary code changes, using TodoWrite unconditionally, following TDD when feasible, and validating the result with LSP diagnostics and task-specific verification.",
  prompt: loadAgentPrompt("code-builder-prompt.md"),
  mode: "subagent",
  defaults: {
    temperature: 0.1,
    permission: builtinAgentPermissionPolicy.codeBuilderAgent,
  },
};

export default codeBuilderAgent;
