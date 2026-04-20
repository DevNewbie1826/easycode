import { builtinAgentPermissionPolicy } from "../builtin-policy";
import type { AgentDefinition } from "../types";
import { loadAgentPrompt } from "../prompt-loader";

const plannerAgent: AgentDefinition = {
  name: "planner",
  description:
    "Creates and revises concrete implementation plans from a planning-ready request or Requirements Brief, producing a materialize-ready execution plan.",
  prompt: loadAgentPrompt("planner-prompt.md"),
  mode: "subagent",
  defaults: {
    temperature: 0.1,
    permission: builtinAgentPermissionPolicy.planner,
  },
};

export default plannerAgent;
