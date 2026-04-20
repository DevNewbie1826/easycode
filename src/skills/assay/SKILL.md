---
name: assay
description: Use after materialize completes in an isolated worktree to independently verify fresh evidence, review the finished implementation against the plan, and decide PASS/FAIL before merge, PR, or final completion claims.
---

# Assay

## Overview

Assay is the final review and validation skill.

It runs after `materialize` has completed execution in an isolated worktree.
It does not implement code.
It does not continue planning.
Its job is to independently verify that the completed work is actually ready to be treated as complete.

Assay explicitly coordinates these subagents:

- `completion-verifier`
- `final-reviewer`

Do not collapse these roles into one blended response.

---

## Position in the Skill Chain

Assay is the final judgment gear in this chain:

1. `lucidify` → produces a planning-ready `Requirements Brief`
2. `crystallize` → produces a hardened `Implementation Plan`
3. `using-git-worktrees` → prepares the isolated worktree
4. `materialize` → executes the finalized plan in the isolated worktree
5. `assay` → independently verifies and reviews the finished work before completion is claimed
6. `finishing-a-development-branch` → handles merge / PR / cleanup only after PASS

### Responsibility Split
- `lucidify` handles clarification
- `crystallize` handles planning
- `using-git-worktrees` handles workspace isolation
- `materialize` handles implementation
- `assay` handles final evidence-based review and completion judgment
- `finishing-a-development-branch` handles the next operational completion step after PASS

---

## Worktree Assumption

Assay is normally run **in the same isolated worktree** used by `materialize`, before merge, PR creation, or final integration.

Default expectation:
- implementation is complete in the worktree
- the work has not yet been treated as finally complete
- merge / PR / final integration should happen only after Assay passes

Do not require the work to be merged before running Assay.
Assay is a pre-merge final gate by default.

---

## When to Use

Use this skill when:

- `materialize` has finished implementation work
- execution-level verification has already been run
- a final independent completion judgment is needed
- the user is about to claim the work is complete
- a merge / PR / final handoff is being considered

Do not use this skill when:

- implementation is still in progress
- no approved `Implementation Plan` exists
- the work is still being actively changed
- clarification or planning is still unresolved

---

## Input Contract

Assay expects:

1. the approved `Implementation Plan`
2. optionally, the original `Requirements Brief`
3. the current implementation state in the active isolated worktree

Assay should not rely on:
- builder self-reports
- implementation optimism
- stale verification results
- verbal “it should be done” claims

Fresh evidence must be gathered during Assay.

---

## Required Subagents

Assay must explicitly use both subagents:

1. `completion-verifier`
2. `final-reviewer`

### Role Split
- `completion-verifier` proves what the current worktree state actually passes right now
- `final-reviewer` decides whether the work should PASS or FAIL final review

Neither subagent may modify files.

---

## Supporting Failure Policy

If fresh verification or final review surfaces a defect, regression, or unexplained inconsistency:
- Assay does not fix it directly
- Assay records the failure clearly
- the work returns to `materialize`
- any new fix attempt should route through `systematic-debugging` before code changes begin

Assay remains a judgment skill, not a repair skill.

---

## Subagent Descriptions

### completion-verifier
Runs fresh verification evidence for completed implementation work in the active worktree and blocks any completion claim that is not backed by current command output.

### final-reviewer
Independently reviews the completed implementation in the active worktree against the Implementation Plan and Requirements Brief, then issues a final PASS/FAIL completion judgment with a saved review record.

---

## Hard Gates

1. Do not claim completion without fresh verification evidence.
2. Do not trust earlier execution results without re-running the relevant commands now.
3. Do not let Assay modify code.
4. Do not issue conditional passes.
5. Do not skip the saved review record.
6. Do not merge, create a PR, or treat the work as complete before Assay has passed.
7. Do not rely on verbal summaries when the plan and worktree can be inspected directly.
8. Save the final review record in the repository root `docs/easycode/reviews/` path by default unless the user explicitly requests another location.

---

## Core Principle

**Evidence before completion claims.**

Assay exists to stop false completion.

If the work cannot survive fresh verification and independent final review, it is not complete.

---

## Workflow

### Phase 0: Intake
Read the approved `Implementation Plan`.

If available, also read the original `Requirements Brief`.

Confirm that the current worktree is the implementation result to be reviewed.

If implementation is still actively changing, stop and wait for `materialize` to finish.

---

### Phase 1: Completion Verification
Dispatch `completion-verifier` with:
- the plan
- relevant verification commands
- the active worktree state

The verifier must:
- identify the commands that prove the current completion claims
- run them fresh
- inspect exit codes and full output
- report whether the completion claim is supported by evidence

If verification fails or is incomplete, Assay must fail.
Do not proceed as though the work is complete.

---

### Phase 2: Independent Final Review
Dispatch `final-reviewer` with:
- the plan
- the brief if available
- the current worktree state
- the fresh verification evidence

The reviewer must:
- inspect the implementation against the plan
- inspect scope completion
- inspect success criteria coverage
- inspect critical leftovers
- decide PASS or FAIL
- produce a review record suitable for saving

---

### Phase 3: Save Review Record
Save the final review document.

Default save location:

`/docs/easycode/reviews/YYYY-MM-DD-<feature-name>-assay.md`

This review record is an official workflow artifact.
Treat it as part of the repository’s documented execution history.

It is not incidental runtime output.
It is not a disposable temporary log.
It is part of the plan-to-validation artifact chain.

If the user explicitly requests another path, use that path instead.

The review record must include:
- verdict
- plan reference
- verification evidence summary
- file/artifact inspection summary
- residual issues
- final assessment
- required follow-up

---

### Phase 4: Final Judgment
Assay ends with a binary result:

- `PASS`
- `FAIL`

If PASS:
- the work is ready for `finishing-a-development-branch`
- merge / PR / final integration / completion claim may proceed

If FAIL:
- do not treat the work as complete
- report the exact failed areas
- return to `materialize` if implementation fixes are needed
- return to `crystallize` if the issue is actually plan-related
- return to `lucidify` if the issue is really a requirements/clarification problem

---

## Completion Standard

Assay passes only when all of the following are true:

- fresh verification evidence supports the completion claim
- the implementation achieves the plan’s goal
- in-scope work is complete
- out-of-scope boundaries are respected
- critical success criteria are supported
- no major incomplete artifacts remain
- the final review document has been saved

---

## Failure Routing

Return to:
- `materialize` if implementation fixes are needed
- `crystallize` if the plan itself is insufficient or inconsistent
- `lucidify` if the underlying request is still not stable enough for final judgment

When returning to `materialize` for fixes, the failure should be treated as input to `systematic-debugging` before new code changes are attempted.

Do not guess the wrong layer of failure.

---

## Workflow Artifact Note

The assay review record stored under `docs/easycode/reviews/` is part of the repository’s workflow artifact chain.

Together with the implementation plan in `docs/easycode/plans/`, it serves as an auditable record for execution, validation, and branch completion decisions.

---

## Transition

If Assay returns PASS, the next skill is:

- `finishing-a-development-branch`

This next step may handle:
- merge
- PR creation
- branch completion
- cleanup
- final integration routing

Assay itself does not merge or deploy.
It provides the final completion judgment that allows those next steps.

---

## Final Output

When Assay completes, report:
- the final verdict: PASS / FAIL
- where the review document was saved
- what fresh verification evidence was used
- whether the work is ready for the next operational step
- if FAIL, the exact areas requiring return to a previous skill

Conclude with one of:

### PASS
Final review passed. The work is ready for the next completion step.

### FAIL
Final review failed. The work is not ready to be treated as complete.
