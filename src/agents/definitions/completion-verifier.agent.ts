import { builtinAgentPermissionPolicy } from "../builtin-policy";
import type { AgentDefinition } from "../types";
import { loadAgentPrompt } from "../prompt-loader";

const completionVerifierAgent: AgentDefinition = {
  name: "completion-verifier",
  description:
    "Runs fresh verification evidence for completed implementation work in the active worktree and blocks any completion claim that is not backed by current command output.",
  prompt: loadAgentPrompt("completion-verifier-prompt.md"),
  mode: "subagent",
  defaults: {
    temperature: 0.1,
    permission: builtinAgentPermissionPolicy.completionVerifierAgent,
  },
};

export default completionVerifierAgent;
