import { builtinAgentPermissionPolicy } from "../builtin-policy";
import type { AgentDefinition } from "../types";
import { loadAgentPrompt } from "../prompt-loader";

const debuggerAgent: AgentDefinition = {
  name: "Debugger",
  description:
    "Specialized debugging sub-agent for root-cause analysis, reproducible failure isolation, and minimal-diff fixes for runtime, test, and build errors.",
  prompt: loadAgentPrompt("debugger-prompt.md"),
  mode: "subagent",
  defaults: {
    temperature: 0.1,
    permission: builtinAgentPermissionPolicy.debugger,
  },
};

export default debuggerAgent;
