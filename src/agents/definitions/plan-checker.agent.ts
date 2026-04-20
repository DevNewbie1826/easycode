import { builtinAgentPermissionPolicy } from "../builtin-policy";
import type { AgentDefinition } from "../types";
import { loadAgentPrompt } from "../prompt-loader";

const planCheckerAgent: AgentDefinition = {
  name: "plan-checker",
  description:
    "Reviews an implementation plan for execution readiness, approving by default unless real blockers would prevent a capable developer from starting and completing the work.",
  prompt: loadAgentPrompt("plan-checker-prompt.md"),
  mode: "subagent",
  defaults: {
    temperature: 0.1,
    permission: builtinAgentPermissionPolicy.planChecker,
  },
};

export default planCheckerAgent;
