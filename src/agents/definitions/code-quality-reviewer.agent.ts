import { builtinAgentPermissionPolicy } from "../builtin-policy";
import type { AgentDefinition } from "../types";
import { loadAgentPrompt } from "../prompt-loader";

const codeQualityReviewerAgent: AgentDefinition = {
  name: "code-quality-reviewer",
  description:
    "Reviews one completed implementation task in full read-only mode for code quality, maintainability, and implementation hygiene after spec compliance has already passed.",
  prompt: loadAgentPrompt("code-quality-reviewer-prompt.md"),
  mode: "subagent",
  defaults: {
    temperature: 0.1,
    permission: builtinAgentPermissionPolicy.codeQualityReviewer,
  },
};

export default codeQualityReviewerAgent;
