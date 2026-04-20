import { builtinAgentPermissionPolicy } from "../builtin-policy";
import type { AgentDefinition } from "../types";
import { loadAgentPrompt } from "../prompt-loader";

const finalReviewerAgent: AgentDefinition = {
  name: "final-reviewer",
  description:
    "Independently reviews the completed implementation in the active worktree against the Implementation Plan and Requirements Brief, then issues a final PASS/FAIL completion judgment with a saved review record.",
  prompt: loadAgentPrompt("final-reviewer-prompt.md"),
  mode: "subagent",
  defaults: {
    temperature: 0.1,
    permission: builtinAgentPermissionPolicy.finalReviewerAgent,
  },
};

export default finalReviewerAgent;
