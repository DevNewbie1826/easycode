import { describe, expect, it } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const repoRoot = join(import.meta.dir, "..", "..")

function readRepoFile(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8")
}

const workflowFiles = {
  orchestrator: "src/agents/prompt-text/orchestrator-prompt.md",
  planner: "src/agents/prompt-text/planner-prompt.md",
  bootstrap: "src/hooks/skill-bootstrap/skill-bootstrap.md",
  todoSync: "src/skills/todo-sync/SKILL.md",
  materialize: "src/skills/materialize/SKILL.md",
  assay: "src/skills/assay/SKILL.md",
  finishing: "src/skills/finishing-a-development-branch/SKILL.md",
  worktrees: "src/skills/using-git-worktrees/SKILL.md",
  lucidify: "src/skills/lucidify/SKILL.md",
  crystallize: "src/skills/crystallize/SKILL.md",
} as const

const auditedRules = {
  chainRouting: {
    owner: workflowFiles.orchestrator,
    secondaries: [workflowFiles.materialize, workflowFiles.assay, workflowFiles.finishing, workflowFiles.lucidify, workflowFiles.crystallize],
    required: true,
  },
  todoProtocol: {
    owner: workflowFiles.todoSync,
    secondaries: [workflowFiles.orchestrator, workflowFiles.materialize, workflowFiles.planner, workflowFiles.crystallize],
    required: true,
  },
  finishingTerminalState: {
    owner: workflowFiles.finishing,
    secondaries: [workflowFiles.orchestrator, workflowFiles.todoSync],
    required: true,
  },
  materializeReentry: {
    owner: workflowFiles.materialize,
    secondaries: [workflowFiles.orchestrator, workflowFiles.assay],
    required: true,
  },
  assayFailOwnership: {
    owner: workflowFiles.assay,
    secondaries: [workflowFiles.materialize, workflowFiles.orchestrator, workflowFiles.finishing],
    required: true,
  },
  worktreeOutput: {
    owner: workflowFiles.worktrees,
    secondaries: [workflowFiles.finishing],
    required: true,
  },
  lucidifyExit: {
    owner: workflowFiles.lucidify,
    secondaries: [workflowFiles.crystallize, workflowFiles.orchestrator],
    required: true,
  },
  plannerCheckpoint: {
    owner: workflowFiles.planner,
    secondaries: [workflowFiles.crystallize, workflowFiles.todoSync, workflowFiles.orchestrator],
    required: true,
  },
  bootstrapPriority: {
    owner: workflowFiles.bootstrap,
    secondaries: [],
    required: true,
  },
} as const

describe("workflow contracts", () => {
  it("inventory: encodes the owner-first workflow matrix", () => {
    expect(auditedRules.chainRouting.owner).toBe(workflowFiles.orchestrator)
    expect(auditedRules.todoProtocol.owner).toBe(workflowFiles.todoSync)
    expect(auditedRules.finishingTerminalState.owner).toBe(workflowFiles.finishing)
    expect(auditedRules.materializeReentry.owner).toBe(workflowFiles.materialize)
    expect(auditedRules.assayFailOwnership.owner).toBe(workflowFiles.assay)
    expect(auditedRules.worktreeOutput.owner).toBe(workflowFiles.worktrees)
    expect(auditedRules.lucidifyExit.owner).toBe(workflowFiles.lucidify)
    expect(auditedRules.plannerCheckpoint.owner).toBe(workflowFiles.planner)
    expect(auditedRules.bootstrapPriority.owner).toBe(workflowFiles.bootstrap)
  })

  it("owner: orchestrator defines the full workflow chain and finishing entry gate", () => {
    const text = readRepoFile(workflowFiles.orchestrator)

    expect(text).toContain("`lucidify` → `crystallize` → `using-git-worktrees` → `materialize` → `assay` → `finishing-a-development-branch`")
    expect(text).toContain(
      "Use `finishing-a-development-branch` only when `assay` returns PASS and the current implementation plan, latest assay review artifact, and active branch/worktree context are available.",
    )
  })

  it("owner: todo-sync defines initialize, single-active, reopen, and terminal clear rules", () => {
    const text = readRepoFile(workflowFiles.todoSync)

    expect(text).toContain("- Initialize the todo list before the first substantive workflow action.")
    expect(text).toContain("- Keep exactly one item `in_progress` at a time.")
    expect(text).toContain("- When a step completes and the next step begins, mark the finished item `completed` and the next item `in_progress` in the same update.")
    expect(text).toContain("- If the workflow routes backward, reopen the relevant earlier item immediately and do not leave the failed path as the active item.")
    expect(text).toContain("- Clear the todo list only when the workflow reaches a true terminal state after the selected finishing option's last required non-`todowrite` action is complete.")
  })

  it("owner: finishing defines the terminal-state table and exact todo clear points", () => {
    const text = readRepoFile(workflowFiles.finishing)

    expect(text).toContain("| 1. Merge locally | merged-result verification and any required worktree cleanup complete | merge succeeded, post-merge tests passed, and cleanup/reporting is done | Clear immediately after cleanup/report result is captured and before the final completion response |")
    expect(text).toContain("| 2. Push and create PR | `gh pr create` succeeds and PR URL/result is captured | PR is created and preservation report is ready | Clear immediately after PR URL/result is captured and before the final completion response |")
    expect(text).toContain("| 3. Keep branch as-is | final preservation report is prepared | the preservation decision is reported and no more workflow-owned tool calls remain | Clear immediately before the final completion response |")
    expect(text).toContain("| 4. Discard this work | confirmation handling, branch deletion, and any required worktree cleanup complete | discard was explicitly confirmed and cleanup/reporting is done | Clear immediately after cleanup/report result is captured and before the final completion response |")
  })

  it("owner: materialize defines reopened execution tracking after assay FAIL", () => {
    const text = readRepoFile(workflowFiles.materialize)

    expect(text).toContain("If `assay` returns FAIL for implementation defects, re-enter `materialize` in the same worktree by default after reading the saved assay review.")
    expect(text).toContain("Reopen execution tracking to the failed task area before any new fix attempt begins.")
    expect(text).toContain("Return to `assay` only after repaired execution-level verification passes again.")
  })

  it("owner: assay defines FAIL re-entry and artifact ownership", () => {
    const text = readRepoFile(workflowFiles.assay)

    expect(text).toContain("When returning to `materialize` for implementation fixes, require the next pass to read the saved assay review first, stay on the same plan/worktree by default, and invoke `systematic-debugging` before new fixes.")
    expect(text).toContain("This review record is the canonical assay-owned artifact in the workflow chain.")
  })

  it("owner: worktree setup reports the required success fields", () => {
    const text = readRepoFile(workflowFiles.worktrees)

    expect(text).toContain("- base branch")
    expect(text).toContain("- feature branch")
    expect(text).toContain("- full worktree path")
    expect(text).toContain("- setup commands run or skipped")
    expect(text).toContain("- baseline verification command and result")
    expect(text).toContain("- ready/blocker conclusion")
  })

  it("owner: lucidify blocks handoff when contradictions, evidence gaps, or unstable scope remain", () => {
    const text = readRepoFile(workflowFiles.lucidify)

    expect(text).toContain("Handoff is blocked if major contradictions remain unresolved.")
    expect(text).toContain("Handoff is blocked if required evidence is still missing.")
    expect(text).toContain("Handoff is blocked if scope is still unstable enough that `crystallize` would have to guess.")
  })

  it("owner: planner prompt distinguishes task sync, backward reopening, and terminal clearing", () => {
    const text = readRepoFile(workflowFiles.planner)

    expect(text).toContain("- ongoing todo synchronization during active work")
    expect(text).toContain("- backward-route reopening when review or verification sends execution to an earlier task")
    expect(text).toContain("- terminal todo clearing only after the workflow reaches its true finishing clear point")
    expect(text).not.toContain("[SYSTEM DIRECTIVE: TODO_CONTINUATION]")
  })

  it("owner: bootstrap states prepended control-block behavior and priority boundaries", () => {
    const text = readRepoFile(workflowFiles.bootstrap)

    expect(text).toContain("Prepended control block. Not the user's actual request.")
    expect(text).toContain("If a relevant skill applies, use it.")
    expect(text).toContain("If a skill conflicts with a higher-priority instruction, follow the higher-priority instruction.")
    expect(text).toContain("The bootstrap block is guidance and must not override higher-priority instructions.")
  })

  it("secondary: finishing and orchestrator do not claim assay artifact ownership", () => {
    const finishingText = readRepoFile(workflowFiles.finishing)
    const orchestratorText = readRepoFile(workflowFiles.orchestrator)

    expect(finishingText).not.toContain("official workflow artifact")
    expect(orchestratorText).not.toContain("official workflow artifact")
  })

  it("secondary: prompt and skill assets do not copy the raw continuation directive", () => {
    for (const relativePath of Object.values(workflowFiles)) {
      expect(readRepoFile(relativePath)).not.toContain("[SYSTEM DIRECTIVE: TODO_CONTINUATION]")
    }
  })
})
