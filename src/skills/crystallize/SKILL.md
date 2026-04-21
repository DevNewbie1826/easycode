---
name: crystallize
description: Use when you need to turn a planning-ready Requirements Brief into a hardened Implementation Plan by explicitly orchestrating three subagents with clear execution permissions: planner, plan-checker, and plan-challenger, then prepare that plan for handoff to materialize.
---

# Crystallize

## Overview

Crystallize is an orchestration skill.

It does not implement code.
It does not run an open-ended clarification loop by default.
Its job is to take a planning-ready input, generate an implementation plan through `planner`, pressure-test that plan through `plan-checker` and `plan-challenger`, and finalize a version strong enough for execution.

Crystallize explicitly coordinates these three subagents:

- `planner`
- `plan-checker`
- `plan-challenger`

Do not collapse these roles into one blended response.

---

## Position in the Skill Chain

Crystallize is the planning gear in this chain:

1. `lucidify` → produces a planning-ready `Requirements Brief`
2. `crystallize` → produces a hardened `Implementation Plan`
3. `using-git-worktrees` → prepares an isolated workspace for execution
4. `materialize` → implements the finalized plan
5. `assay` → performs final review and validation
6. `finishing-a-development-branch` → decides merge / PR / cleanup after PASS

### Responsibility Split

- `lucidify` handles clarification
- `crystallize` handles planning and plan hardening
- `using-git-worktrees` handles execution workspace isolation
- `materialize` handles implementation
- `assay` handles final review and completion judgment

If the request is not planning-ready, do not force planning. Route to `lucidify`.

---

## Subagent Execution Model

Crystallize must use three subagents with distinct permission levels:

### planner
- plan-write enabled
- may read the repository
- may use `explorer` and `librarian`
- may create or update the plan artifact only
- must not modify source code, tests, configs, or runtime files

### plan-checker
- fully read-only
- may use `explorer` and `librarian` for verification
- must not modify any files

### plan-challenger
- fully read-only
- may use `explorer` and `librarian` for risk discovery
- must not modify any files

Only `materialize` may perform real implementation changes.

---

## When to Use

Use this skill when:

- a `Requirements Brief` already exists
- the task is large enough to need planning
- the work spans multiple files, systems, or implementation steps
- the user wants a plan strong enough for implementation
- the result is intended to be handed off to `using-git-worktrees` and `materialize`

Do not use this skill when:

- the task is trivial enough to implement directly
- the user only wants a quick sketch
- the request is still vague, contradictory, unstable, or underspecified
- a validated implementation plan already exists

---

## Input Contract

Crystallize expects one of the following:

1. A planning-ready `Requirements Brief` from `lucidify` (**preferred**)
2. A user request that is already specific enough to plan safely

If a `Requirements Brief` is present, treat it as the source of truth for:

- Goal
- Request Summary
- Scope
- Current State
- Target State
- Constraints
- Success Criteria
- Evidence Summary
- Remaining Unknowns
- Assumptions
- Handoff note

Do not reopen already-clarified questions unless the brief contains:

- a contradiction
- a planning-blocking gap
- required evidence marked incomplete
- success criteria too vague to plan against
- missing current state or target state that blocks sequencing

If planning is blocked at this stage, return:

`Needs lucidify re-entry`

and specify:
- what blocks planning
- what clarification is needed
- why planning should not proceed yet

---

## Planning-Readiness Check

Before dispatching any subagent, verify that the input contains enough information to plan.

Minimum required planning inputs:

- Goal
- Bounded Scope
- Meaningful Constraints
- Current State
- Target State
- Minimal Success Criteria

If these are missing in a way that blocks milestone definition, sequencing, or QA design, stop and route back to `lucidify`.

Documented unknowns are acceptable only if they are bounded and do not prevent planning.

---

## Required Subagents

Crystallize must explicitly use all three subagents:

1. `planner`
2. `plan-checker`
3. `plan-challenger`

Each role has a fixed responsibility:

- `planner` creates and revises the plan
- `plan-checker` verifies execution readiness
- `plan-challenger` exposes implementation risk and tightening opportunities

`plan-checker` is the blocking gate.
`plan-challenger` is the strengthening pressure.
`planner` is the integrating author.

---

## Context Gathering Rules

Before dispatching `planner`, gather enough context to avoid speculative planning.

Possible context sources:
- repository structure
- similar internal patterns
- existing test conventions
- relevant configs
- project docs
- external dependency behavior

Use internal discovery for project-specific questions and external references for third-party behavior.

Do not gather context endlessly.
Gather only enough to produce a grounded plan.

---

## Exploration Agents

### explorer
- alias: Contextual Grep
- use for: local codebase discovery, pattern search, implementation tracing, repository structure, configs, tests, internal docs, and project-specific logic
- fire liberally when the structure is unfamiliar or multiple search angles are needed

### librarian
- alias: Reference Grep
- use for: external docs, OSS, APIs, best practices, migration notes, version differences, and unfamiliar third-party libraries
- use when uncertainty depends on official documentation or external behavior rather than project-specific implementation

### Delegation Rules
- Use `explorer` for internal discovery.
- Use `librarian` for external references.
- Once you fire `explorer` for a search, do not manually perform that same search yourself.
- Use direct tools only for non-overlapping work or when you intentionally skipped delegation.

---

## Workflow

### Phase 0: Intake
Read the input.

If a `Requirements Brief` is present, use it as the planning source of truth.

If no brief is present:
- proceed only if the request is already specific enough to plan safely
- otherwise return `Needs lucidify re-entry`

If the scope contains multiple independent subsystems, prefer separate plans.

---

### Phase 1: Brief Readiness Check
Verify that the input supports planning.

Check whether the following are sufficiently clear:
- Goal
- Scope
- Constraints
- Current State
- Target State
- Success Criteria

If any of these are missing in a planning-blocking way:
- stop
- return `Needs lucidify re-entry`
- identify the exact missing input

---

### Phase 2: Gather Planning Context
Gather only the minimum context required to avoid guessing.

If the brief says evidence is required and not completed, do not proceed unless:
- that evidence is completed, or
- the missing evidence is explicitly accepted as a bounded assumption

---

### Phase 3: Planner Draft
Dispatch `planner` with:
- the `Requirements Brief` or planning-ready request
- gathered context
- planning constraints
- required plan structure

`planner` returns the first `Implementation Plan` draft and may write or update only the plan artifact.

---

### Phase 4: Plan-Checker Review
Dispatch `plan-checker` with:
- the draft `Implementation Plan`
- the original `Requirements Brief` or planning-ready request

`plan-checker` must return:
- `[APPROVED]` or `[REJECTED]`
- short summary
- blocking issues only if rejected

---

### Phase 5: Plan-Challenger Review
Dispatch `plan-challenger` with:
- the draft `Implementation Plan`
- the original `Requirements Brief` or planning-ready request

`plan-challenger` returns:
- overall assessment
- main risks
- tightening suggestions

---

### Phase 6: Planner Revision
If `plan-checker` rejects the plan, or `plan-challenger` surfaces meaningful weaknesses, dispatch `planner` again with:

- the original `Requirements Brief`
- the current draft
- the `plan-checker` result
- the `plan-challenger` result
- instruction to revise into one stronger coherent plan

The revised plan must:
- fix checker blockers
- address major challenger risks
- remain aligned with the brief
- preserve scope discipline
- maintain execution clarity

Only the plan artifact may be changed during this phase.

---

### Phase 7: Re-Validation Loop
Dispatch `plan-checker` again on the revised plan.

Repeat the refinement loop until:
- `plan-checker` returns `[APPROVED]`
- no blocking issues remain
- major challenger risks are addressed or explicitly documented
- the plan is ready for execution

Do not loop forever for perfection.

---

### Phase 8: Finalization
Once the plan is strong enough:
- present the final `Implementation Plan`
- provide the save path
- hand off to `using-git-worktrees` as the next operational step before `materialize`

Crystallize does not create the worktree itself.
Crystallize prepares execution by producing the plan that the next stages will use.

---

## Termination Conditions

Crystallize stops when all of the following are true:

- `plan-checker` returns `[APPROVED]`
- no unresolved blocking issues remain
- major `plan-challenger` risks are addressed or explicitly accepted
- assumptions are either resolved or clearly documented
- the plan is implementation-ready enough for `using-git-worktrees` and `materialize`

The standard is:

**strong enough to execute with confidence**

not infinite refinement.

---

## Required Final Artifact

Crystallize must output an `Implementation Plan`.

### Artifact Chain
- `lucidify` produces a `Requirements Brief`
- `crystallize` produces an `Implementation Plan`
- `using-git-worktrees` prepares the isolated execution workspace
- `materialize` produces implemented changes
- `assay` produces the final review judgment

---

## Recommended Implementation Plan Structure

Use this structure for the finalized plan:

# [Feature Name] Implementation Plan

> **For agentic workers:** REQUIRED EXECUTION CHAIN: `using-git-worktrees` → `materialize` → `assay`. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about the approach]

**Tech Stack:** [Key technologies/libraries]

---

## Scope
- **In scope**: [items]
- **Out of scope**: [items]

## Assumptions
- [explicit assumption 1]
- [explicit assumption 2]

## Source Brief Alignment
- **Goal alignment**: [how the plan maps to the brief]
- **Constraint alignment**: [how constraints are preserved]
- **Success criteria alignment**: [how the plan verifies them]

## Execution Policy
- **Workspace isolation**: use `using-git-worktrees` before implementation begins
- **Task tracking**: use `todo-sync` before work starts, after each completed task, and at true workflow completion
- **Implementation discipline**: `code-builder` defaults to `test-driven-development` when feasible
- **Failure handling**: use `systematic-debugging` before attempting fixes for bugs, failed verification, regressions, or unexpected behavior
- **Completion path**: after `assay` returns PASS, proceed to `finishing-a-development-branch`

## File Structure
- Create: `path/to/file`
- Modify: `path/to/file`
- Test: `path/to/test`

## File Responsibilities
- `path/to/file`: [responsibility]
- `path/to/file`: [responsibility]

### Task 1: [Task name]

**Files:**
- Create: `...`
- Modify: `...`
- Test: `...`

- [ ] Step 1: ...
- [ ] Step 2: ...
- [ ] Step 3: ...

**QA / Verification**
- Tool: `...`
- Steps: `...`
- Expected Result: `...`

### Task 2: [Task name]
...

---

## QA Standard

Every plan produced by Crystallize must include executable QA.

Each task’s QA must contain:
- a specific tool
- concrete steps
- expected results

Bad examples:
- “verify it works”
- “check the page”
- “test the API”

Good examples:
- `pytest tests/auth/test_signup.py -v` returns PASS for duplicate email handling
- `curl -X POST /api/users ...` returns `409` with exact error payload
- Playwright clicks `.submit-button` and confirms redirect to `/dashboard`

QA should validate:
- the primary success path
- at least one meaningful failure or edge path when relevant
- the brief’s success criteria, not just generic feature behavior

---

## Scope Discipline Rules

Crystallize must actively prevent plan inflation.

Always ask:
- what is in scope?
- what is explicitly out of scope?
- what is the smallest useful implementation?
- what adjacent work must not be touched?

The final plan must not quietly expand into a broader rewrite.

---

## Assumption Discipline Rules

If the plan depends on something uncertain, expose it.

Examples:
- assumed API contract
- assumed schema availability
- assumed auth flow
- assumed environment variable
- assumed fixture or seed data
- assumed migration state

Never hide important assumptions inside vague task wording.

If assumptions are too risky to proceed, do not bury that fact.
Either document the risk clearly or route back to `lucidify` if the planning basis is too unstable.

---

## Feedback Integration Rules

When revising:
- `plan-checker` blockers are mandatory fixes
- `plan-challenger` findings are prioritized by implementation risk
- `planner` must integrate feedback into one coherent updated plan
- the revised plan must still align with the source brief

The revised plan should read like one clean document.

---

## Failure Routing

Return `Needs lucidify re-entry` if:

- the brief contains a major contradiction
- scope is not actually bounded
- success criteria are not meaningful enough to plan against
- current state or target state is too vague to sequence work
- required evidence is missing and blocks planning
- assumptions carry too much unresolved planning risk

When returning `Needs lucidify re-entry`, state:
- what is blocking planning
- what clarification is needed
- why planning should not proceed yet

---

## Handoff to Execution

When the plan is finalized, end with:

Plan complete and saved to `/docs/easycode/plans/<filename>.md`.

Next step: use `using-git-worktrees` to prepare the isolated workspace, then start `materialize` with this plan.

Crystallize ends at the point of execution handoff.
It does not prepare the worktree or implement the plan itself.

---

## Anti-Patterns

Do not let Crystallize do any of the following:

- redo Lucidify’s clarification loop by default
- pretend an unclear brief is good enough
- silently compensate for missing requirements by guessing
- write vague “good sounding” plans
- confuse challenger feedback with checker blockers
- reject for non-blocking style issues
- endlessly refine for perfection
- hide risky assumptions
- silently expand scope
- produce QA that cannot actually be executed
- output tasks with no real starting point

---

## Success Criteria

Crystallize succeeds when:
- the input has been converted into a concrete `Implementation Plan`
- the plan is aligned with the source `Requirements Brief`
- the plan has survived `planner → plan-checker → plan-challenger` refinement
- no major execution blockers remain
- the result is strong, narrow, testable, and ready for `using-git-worktrees` and `materialize`
