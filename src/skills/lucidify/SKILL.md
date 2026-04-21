---
name: lucidify
description: Use when a user's request is vague, ambiguous, contradictory, unstable, underspecified, or not yet ready for planning. Resolve ambiguity through iterative clarification, using explorer for internal discovery and librarian for external references. Produce a planning-ready requirements brief focused on scope, constraints, and success criteria, then hand off to crystallize.
---

# Lucidify Through Iterative Clarification

Convert an ambiguous request into a planning-ready requirements brief.

## Purpose

Use this skill when the user’s request is not yet clear enough to plan safely.

This skill exists to:
- clarify what the user actually wants
- make scope, constraints, and success criteria explicit
- gather evidence when needed
- organize the result into a requirements brief
- hand off the work to `crystallize`

This skill does not implement.
This skill does not create the implementation plan.
This skill clarifies, structures, and hands off.

---

## Position in the Workflow

Lucidify is the clarification gear in this chain:

1. `lucidify`
2. `crystallize`
3. `using-git-worktrees`
4. `materialize`
5. `assay`
6. `finishing-a-development-branch`

Lucidify owns only planning-readiness.
It ends when the request is clear enough for planning.
It does not decide execution environment, implementation details, or completion operations.

---

## Hard Rules

1. Do not begin implementation.
2. Do not begin detailed implementation planning.
3. Do not hand off until the request is clear enough for planning.
4. Ask exactly one clarification question per message.
5. Every question must reduce ambiguity in a concrete way.
6. Prefer the narrowest useful question, not the broadest possible question.
7. Choose the one question that most reduces planning uncertainty.
8. Use evidence gathering whenever technical uncertainty exists.
9. Delegate internal discovery to `explorer`.
10. Delegate external reference gathering to `librarian`.
11. If both internal and external ambiguity exist, gather both in parallel.
12. Do not manually duplicate a delegated search unless the follow-up work is intentionally non-overlapping.
13. If clarification is not progressing, do not end the loop by default. Change the angle of questioning or gather better evidence, then continue clarifying.
14. Final output must be a planning-ready Requirements Brief.
15. When the brief is ready, always hand off to `crystallize`.

---

## Clarification Targets

Clarify only what is needed for planning:

- goal
- in-scope vs out-of-scope
- constraints
- current state
- target state
- success criteria
- remaining unknowns

The primary objective is to make these three things explicit:
1. scope
2. constraints
3. success criteria

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

## Clarification Process

Repeat this loop until the request is planning-ready:

1. Read the latest user request or answer.
2. Identify the highest-value ambiguity still blocking planning.
3. Select the single next question that would most reduce uncertainty for planning.
4. Prefer a question that narrows scope, constraints, or success criteria over a general exploratory question.
5. Delegate internal exploration to `explorer` if needed.
6. Delegate external exploration to `librarian` if needed.
7. Reconcile the user’s statements with gathered findings.
8. Update:
   - known facts
   - unknowns
   - constraints
   - current understanding of scope
   - current understanding of success criteria
9. Briefly summarize progress in this exact format:

```markdown
Established:
- [confirmed fact or boundary]
- [confirmed fact or boundary]

Open:
- [remaining ambiguity]
- [remaining ambiguity]
```

10. Ask exactly one next clarification question.

### Question Selection Rule
The next question must be the one that most improves planning readiness.

Prioritize in this order:
1. scope boundary
2. constraint
3. success criterion
4. current vs target state
5. goal wording refinement

Avoid:
- broad meta-questions
- repeating the same abstraction level
- asking for background when a narrower planning question is available
- asking multiple smaller questions instead of one decisive question

---

## Stalled Clarification Handling

If clarification is not progressing:
1. do not stop clarification just because the same topic has appeared multiple times
2. identify why progress stalled:
   - the question was too broad
   - the question stayed at the same level of abstraction
   - internal evidence is missing
   - external evidence is missing
   - the user’s goal and wording are still misaligned
3. restate:
   - what is already established
   - what remains open
4. ask a narrower question from a different angle
5. continue the clarification loop

If assumptions are used, they must be clearly labeled and treated as temporary. They are not the default substitute for clarification. Use them only if the user explicitly chooses to proceed on that basis.

---

## Assumptions and Conflicts

If the user’s statements and gathered findings do not align:
1. do not guess
2. surface the mismatch clearly
3. ask the most direct resolving question

Do not present assumptions as confirmed facts.

---

## Handoff Readiness

The request is ready for handoff only when these are sufficiently clear:
- goal
- bounded scope
- meaningful constraints
- current vs target state
- minimal success criteria

In practical terms, handoff is allowed only when `crystallize` can draft milestones and planning structure without needing another clarification round just to understand the task.

Major contradictions must be resolved or explicitly documented.
Major technical uncertainty must be explored or explicitly accepted by the user as an assumption.

Evidence must also be in one of these states:
- gathered and summarized
- explicitly not needed

Handoff is not allowed if evidence is required but not yet completed.
Handoff is blocked if major contradictions remain unresolved.
Handoff is blocked if required evidence is still missing.
Handoff is blocked if scope is still unstable enough that `crystallize` would have to guess.

---

## Output: Requirements Brief

When the request becomes planning-ready, produce this final deliverable.

```markdown
## Requirements Brief: [Short Task Title]

### Goal
[clarified goal]

### Request Summary
[planning-ready rewrite of what the user wants]

### Scope
- **In scope**: [items]
- **Out of scope**: [items]

### Current State
[what exists now]

### Target State
[what should be true after the work is done]

### Constraints
- technical constraints
- product constraints
- dependency constraints
- compatibility or policy constraints

### Success Criteria
- [completion criteria]
- [expected observable outcome]
- [verification target if known]

### Evidence Summary
- **Internal findings (`explorer`)**:
  - [finding]
  - or `not needed`
  - or `not completed yet`
- **External findings (`librarian`)**:
  - [finding]
  - or `not needed`
  - or `not completed yet`
- **User-confirmed facts**:
  - [...]

### Remaining Unknowns
- [acceptable unknowns for planning]
- [items to decide later if needed]

### Assumptions
- [only if explicitly accepted by the user]

### Handoff
- **Next skill**: `crystallize`
- **Handoff note**:
  - [what crystallize should pay attention to]
```

---

## Routing

- If the request is still unclear, continue `lucidify`.
- If the Requirements Brief is planning-ready, hand off to `crystallize`.
- If the user explicitly accepts assumptions, hand off to `crystallize` with those assumptions documented.

Routing depends on planning readiness, not task classification.

---

## Transition

Lucidify ends only when:
- the Requirements Brief is planning-ready, or
- the user explicitly accepts documented assumptions.

When Lucidify ends, the next skill is always `crystallize`.
