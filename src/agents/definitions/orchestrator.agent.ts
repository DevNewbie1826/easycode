import { builtinAgentPermissionPolicy } from "../builtin-policy";
import type { AgentDefinition } from "../types";
import { loadAgentPrompt } from "../prompt-loader";

const orchestratorAgent: AgentDefinition = {
  name: "orchestrator",
  description:
    "Primary coordination agent for decomposing user requests, dispatching specialist agents, sequencing dependent work, parallelizing independent work, and synthesizing results.",
  prompt: loadAgentPrompt("orchestrator-prompt.md"),
  mode: "primary",
  defaults: {
    color: "#6A5CFF",
    permission: builtinAgentPermissionPolicy.orchestrator,
  },
};

export default orchestratorAgent;
