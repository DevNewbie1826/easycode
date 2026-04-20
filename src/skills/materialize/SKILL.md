---
name: materialize
description: Use when you have an approved Implementation Plan and need to execute it in an already-prepared isolated worktree, then orchestrate three code-focused subagents—code-builder, code-spec-reviewer, and code-quality-reviewer—with per-task review loops, execution-level verification, and handoff to assay for final review and validation.
---

# Materialize

## Overview

Materialize is an execution orchestration skill.

It does not create the plan.
It does not clarify ambiguity by default.
Its job is to take an approved `Implementation Plan`, execute each task through a disciplined implementation-and-review loop, and complete the work in a verifiable way.

Materialize explicitly coordinates these subagents:

- `code-builder`
- `code-spec-reviewer`
- `code-quality-reviewer`

Do not collapse these roles into one blended response.

---

## Position in the Skill Chain

Materialize is the execution gear in this chain:

1. `lucidify` → produces a planning-ready `Requirements Brief`
2. `crystallize` → produces a hardened `Implementation Plan`
3. `using-git-worktrees` → prepares an isolated worktree for execution
4. `materialize` → executes the finalized plan
5. `assay` → performs final review and validation before the work is considered fully complete
6. `finishing-a-development-branch` → handles integration / cleanup after PASS

### Responsibility Split
- `lucidify` handles clarification
- `crystallize` handles planning and plan hardening
- `using-git-worktrees` handles workspace isolation
- `materialize` handles implementation and execution validation
- `assay` handles final review and completion judgment

If the plan is not implementation-ready, route back to `crystallize`.

---

## Workspace Assumption

Materialize expects that `using-git-worktrees` has already prepared the isolated worktree.

Do not begin implementation in the main working tree by default.
Do not create the worktree as a substitute for the missing prior stage.
If an isolated worktree is not already active, stop and report the blocker clearly.

Materialize executes inside the prepared isolated worktree.
Workspace preparation belongs to `using-git-worktrees`, not to `materialize`.

---

## Input Contract

Materialize expects:
1. an approved `Implementation Plan`
2. optionally, the original `Requirements Brief`
3. an active isolated worktree prepared by `using-git-worktrees`

If both plan and brief are present:
- the `Implementation Plan` is the execution contract
- the `Requirements Brief` is the boundary reference for scope, constraints, and success criteria

Do not reinterpret the task from scratch.
Do not silently expand the plan.
Execute the plan faithfully unless you hit a genuine blocker.

---

## Required Subagents

Materialize must explicitly use all three subagents:

1. `code-builder`
2. `code-spec-reviewer`
3. `code-quality-reviewer`

### Role Split
- `code-builder` performs implementation work
- `code-spec-reviewer` checks task-to-plan compliance
- `code-quality-reviewer` checks implementation quality after spec compliance passes

Only `code-builder` may modify implementation files.

---

## Supporting Workflow Skills

Materialize must integrate the following supporting skills without replacing its own role:

- `todo-sync` — required before work starts, after each completed task, and after all work is finished
- `systematic-debugging` — required before proposing or attempting fixes for bugs, failed tests, regressions, or unexpected behavior discovered during execution
- `test-driven-development` — the default implementation discipline used by `code-builder` when feasible

These supporting skills do not replace `materialize`.
They constrain how `materialize` executes.

---

## Subagent Execution Model

### code-builder
- write-enabled for implementation
- must use `TodoWrite`
- should participate in `todo-sync` expectations when applicable
- must read before writing
- must follow `test-driven-development` when feasible
- must run LSP diagnostics if available
- must run task verification before reporting completion
- each invocation must use a **fresh isolated builder instance**
- do not rely on memory from any previous `code-builder` run

### code-spec-reviewer
- fully read-only
- checks only whether the task matches the plan and acceptance criteria

### code-quality-reviewer
- fully read-only
- checks only implementation quality after spec compliance has passed

---

## Exploration Agents

### explorer
- alias: Contextual Grep
- use for: local codebase discovery, pattern search, implementation tracing, repository structure, configs, tests, internal docs, and project-specific logic
- fire when the current task needs internal discovery

### librarian
- alias: Reference Grep
- use for: external docs, OSS, APIs, best practices, migration notes, version differences, and unfamiliar third-party libraries
- use when execution depends on external behavior rather than project-specific implementation

### Delegation Rules
- Use `explorer` for internal discovery.
- Use `librarian` for external references.
- Once you fire `explorer` for a search, do not manually perform that same search yourself.
- Use direct tools only for non-overlapping work or when you intentionally skipped delegation.

---

## Hard Gates

1. Require an already-prepared isolated worktree from `using-git-worktrees`.
2. Read the full plan before executing.
3. Do not execute tasks blindly if the plan has obvious blockers.
4. Execute tasks in plan order unless the plan clearly allows safe independence.
5. Never skip task verification.
6. Never skip spec review.
7. Never skip code quality review.
8. Never let reviewers modify code.
9. Never let the builder be the only reviewer.
10. Never bypass TodoWrite inside `code-builder`.
11. Always run the execution-level final verification gate before handing off to `assay`.
12. If any bug, failed test, regression, or unexpected behavior is encountered, invoke `systematic-debugging` before proposing or attempting a fix.
13. Use `todo-sync` before execution begins, after each completed task, and after all work is finished.
14. Never reuse the same `code-builder` instance across passes.

---

## Pre-Execution Review

Before executing any task:

1. Read the entire `Implementation Plan`
2. Identify:
   - task order
   - dependencies
   - required files
   - verification steps
   - success criteria
3. Check for obvious blockers:
   - placeholders
   - contradictory task order
   - missing file targets
   - impossible verification commands
   - missing dependencies explicitly required by the plan
   - missing or inactive isolated worktree

If blocking issues are found before execution:
- stop
- report them clearly
- do not start implementation until resolved

---

## Workflow

### Phase 0: Intake
Read the approved `Implementation Plan`.

If available, also read the original `Requirements Brief` for boundary reference.

Confirm that the active workspace is the isolated worktree prepared by `using-git-worktrees`.

### Phase 1: Plan Readiness Check
Before implementation begins, confirm that the plan contains:
- ordered tasks
- concrete task goals
- file targets
- verification steps
- completion signals

If these are missing in a way that blocks execution:
- stop
- report the exact blocker
- return to `crystallize` if the plan must be revised

### Phase 2: Initialize Execution Tracking
Before the first implementation task:
1. invoke `todo-sync` to initialize task state
2. confirm the active task order
3. confirm the current task boundaries
4. dispatch `code-builder` only after tracking is initialized

### Phase 3: Task Execution Loop
For each task, run this exact sequence:

1. `code-builder`
2. `code-spec-reviewer`
3. if spec review fails → dispatch a **new fresh** `code-builder`
4. once spec passes → `code-quality-reviewer`
5. if quality review fails → dispatch a **new fresh** `code-builder`
6. once both pass → run task verification if not already completed
7. invoke `todo-sync` to mark the task complete
8. move to the next task

Do not move to the next task until the current task has passed both review gates.

### Phase 4: Builder Execution
Dispatch `code-builder` with:
- current task text
- task goal
- acceptance criteria
- relevant file targets
- relevant surrounding context
- required verification commands
- relevant constraints from the plan
- relevant boundaries from the brief if needed

If `code-builder` returns:
- `DONE` or `DONE_WITH_CONCERNS` → proceed to spec review
- `NEEDS_CONTEXT` → provide missing context if available, then re-dispatch a **new fresh** `code-builder`
- `BLOCKED` → stop and report the blocker unless it can be resolved directly through missing context

### Phase 5: Spec Review
Dispatch `code-spec-reviewer` with:
- current task from the `Implementation Plan`
- relevant acceptance criteria
- current changed files
- plan context
- original `Requirements Brief` if available

If spec review fails:
- send the failure back to a **new fresh** `code-builder`
- re-run implementation for that same task
- do not proceed to quality review yet

### Phase 6: Code Quality Review
Dispatch `code-quality-reviewer` only after spec review passes.

Provide:
- current task
- changed files
- relevant surrounding code context
- changed or added tests
- diagnostics / verification results if available

If quality review fails:
- return the findings to a **new fresh** `code-builder`
- re-run implementation for the same task
- re-run spec review if the fixes materially affect compliance
- then re-run quality review

### Phase 7: Failure and Debug Routing
If any of the following occurs:
- verification fails
- a regression appears
- a test fails unexpectedly
- runtime behavior contradicts expectations
- the integration result is inconsistent

then:
1. invoke `systematic-debugging`
2. identify the failure mode, reproduction path, likely cause, and confidence level
3. only then return findings to a **new fresh** `code-builder` for a targeted fix
4. re-run the relevant review gates after the fix

Do not jump straight from failure to code changes.

### Phase 8: Task Completion
A task is complete only when:
- `code-builder` reports completion
- `code-spec-reviewer` passes
- `code-quality-reviewer` passes
- task verification has been run
- `todo-sync` recorded the completed task state
- no unresolved blocker remains for that task

Then and only then move to the next task.

### Phase 9: Execution-Level Final Verification Gate
After all tasks are complete, run the execution-level final gate.

This gate must verify:
- the highest-level verification command from the plan
- the relevant full test suite or regression suite
- the final success criteria from the plan
- that no obvious implementation leftovers remain

If the final gate fails:
1. invoke `systematic-debugging`
2. diagnose the likely integration or execution gap
3. apply a targeted fix through a **new fresh** `code-builder`
4. re-run the relevant review gates if the fix changes task behavior
5. re-run the final verification gate

Do not retry indefinitely.
If the final gate fails repeatedly, escalate with:
- what failed
- what was attempted
- what remains uncertain

### Phase 10: Finalize Tracking and Handoff to Assay
When execution work and execution-level verification are complete:
1. invoke `todo-sync` to finalize overall task state
2. hand off to `assay`

Materialize does not make the final completion judgment for the overall work item.
That responsibility belongs to `assay`.

---

## Completion Standard

Materialize is complete when:
- all tasks in the plan are implemented
- every task passed spec review
- every task passed code quality review
- required verification has been run
- execution-level final verification passed
- implementation remains within plan scope
- task state has been synchronized through `todo-sync`
- the result is ready for `assay`
- no major unresolved blocker remains

---

## Failure Routing

Stop and report clearly if:
- the plan is not executable
- no isolated worktree prepared by `using-git-worktrees` is active
- a task is blocked by missing context or broken environment
- required verification cannot be run
- repeated review loops do not converge
- execution-level final verification repeatedly fails
- implementation would require plan changes beyond execution scope

If the blocker is a planning problem, return to `crystallize`.
If the blocker is a clarification problem, return to `lucidify`.

---

## Transition

Materialize ends when implementation work is complete and the result is ready for final review.

The next skill after `materialize` is:

- `assay` — final review and validation before the work is considered fully complete

Materialize is responsible for execution.
Assay is responsible for final completion judgment.

---

## Final Output

When execution is complete, report:
- what tasks were completed
- what files were changed
- what verification ran
- whether the execution-level final verification gate passed
- whether `todo-sync` finalization occurred
- any remaining concerns worth noting

Then conclude with:

Implementation work is complete and ready for final review.

Would you like to run `assay` for final review and validation?

---

## Success Criteria

Materialize succeeds when:
- the approved `Implementation Plan` has been faithfully executed
- each task passed `code-builder → code-spec-reviewer → code-quality-reviewer`
- `test-driven-development` was used by default where feasible
- failures were routed through `systematic-debugging` before fixes
- execution tracking stayed synchronized through `todo-sync`
- execution-level final verification passed
- the result is ready for `assay`
- no major scope drift occurred
