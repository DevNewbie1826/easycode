import type { AgentPermission } from "./types";

export const builtinAgentDisablePolicy: Record<string, boolean> = {
  explore: true,
  build: true,
  plan: true,
  general: false,
};

const denyEditPatchEtc = {
  apply_patch: "deny",
  edit: "deny",
  bash: "deny",
  ast_grep_replace: "deny",
  lsp_rename: "deny",
} as const;

export const builtinAgentPermissionPolicy: Record<
  string,
  AgentPermission | undefined
> = {
  orchestrator: {
    question: "allow",
    apply_patch: "deny",
  },
  explorer: {
    ...denyEditPatchEtc,
    task: "deny",
  },
  librarian: {
    ...denyEditPatchEtc,
    task: "deny",
  },
  planner: {
    edit: "allow",
    task: {
      "*": "deny",
      explorer: "allow",
      librarian: "allow",
    },
  },
  planChecker: {
    ...denyEditPatchEtc,
    task: {
      "*": "deny",
      explorer: "allow",
      librarian: "allow",
    },
  },
  planChallenger: {
    ...denyEditPatchEtc,
    task: {
      "*": "deny",
      explorer: "allow",
      librarian: "allow",
    },
  },
  codeBuilderAgent: {
    edit: "allow",
    apply_patch: "deny",
    todowrite: "allow",
    task: {
      "*": "deny",
      explorer: "allow",
      librarian: "allow",
    },
  },
  codeSpecReviewerAgent: {
    ...denyEditPatchEtc,
    bash: "allow",
    task: {
      "*": "deny",
      explorer: "allow",
      librarian: "allow",
    },
  },
  codeQualityReviewer: {
    ...denyEditPatchEtc,
    task: {
      "*": "deny",
      explorer: "allow",
      librarian: "allow",
    },
  },
  finalReviewerAgent: {
    ...denyEditPatchEtc,
    task: "deny",
  },
  completionVerifierAgent: {
    ...denyEditPatchEtc,
    task: "deny",
  },
};
