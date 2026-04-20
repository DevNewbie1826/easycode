import { builtinAgentPermissionPolicy } from "../builtin-policy";
import type { AgentDefinition } from "../types";
import { loadAgentPrompt } from "../prompt-loader";

const codeSpecReviewerAgent: AgentDefinition = {
  name: "code-spec-reviewer",
  description:
    "Reviews one implemented task against the Implementation Plan and Requirements Brief in full read-only mode, checking only spec compliance, scope alignment, and acceptance criteria before code quality review begins.",
  prompt: loadAgentPrompt("code-spec-reviewer-prompt.md"),
  mode: "subagent",
  defaults: {
    temperature: 0.1,
    permission: builtinAgentPermissionPolicy.codeSpecReviewerAgent,
  },
};

export default codeSpecReviewerAgent;
