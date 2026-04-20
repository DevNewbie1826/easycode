import { builtinAgentPermissionPolicy } from "../builtin-policy";
import type { AgentDefinition } from "../types";
import { loadAgentPrompt } from "../prompt-loader";

const planChallengerAgent: AgentDefinition = {
  name: "plan-challenger",
  description:
    "Stress-tests an implementation plan to uncover hidden assumptions, sequencing risk, scope creep, and weak verification, then proposes concrete tightening changes.",
  prompt: loadAgentPrompt("plan-challenger-prompt.md"),
  mode: "subagent",
  defaults: {
    temperature: 0.1,
    permission: builtinAgentPermissionPolicy.planChallenger,
  },
};

export default planChallengerAgent;
