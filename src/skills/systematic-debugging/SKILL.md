---
name: systematic-debugging
description: Use when encountering any bug, test failure, or unexpected behavior, before proposing or attempting fixes
---

# Systematic Debugging

## Overview

Random fixes waste time and create new bugs. Quick patches hide symptoms instead of solving causes.

**Core principle:** Always find the root cause before attempting a fix. Symptom fixes are failure.

**Violating the letter of this process violates the spirit of debugging.**

## The Iron Law

```text
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If Phase 1 is incomplete, you are not ready to propose or implement a fix.

## When to Use

Use this skill for any technical issue:

- Test failures
- Production bugs
- Unexpected behavior
- Performance problems
- Build failures
- Integration failures

**Use this especially when:**
- You are under time pressure
- A "quick fix" feels obvious
- Multiple fixes have already failed
- A previous fix did not work
- You do not fully understand the issue yet

**Do not skip the process because:**
- The issue looks simple
- You are in a hurry
- Someone wants it fixed immediately

Systematic debugging is faster than thrashing.

## The Four Phases

Complete each phase fully before moving to the next.

---

## Phase 1: Root Cause Investigation

**Do not propose fixes yet. Investigate first.**

### 1. Read the Error Carefully

- Read the full error message
- Read the full stack trace
- Note file paths, line numbers, error codes, warnings
- Do not skip past “obvious” details

Errors often tell you exactly where to look.

### 2. Reproduce Reliably

- Can you trigger the issue consistently?
- What exact steps reproduce it?
- Does it happen every time?
- If not, what conditions change?

If you cannot reproduce it reliably, gather more evidence before guessing.

### 3. Check Recent Changes

- What changed recently?
- Review git diff and recent commits
- Check new dependencies, configuration changes, environment differences
- Look for mismatches between working and failing contexts

### 4. Gather Evidence Across Component Boundaries

When a system has multiple layers, do not guess which layer is broken.

Add instrumentation at each boundary:

- Log what enters the component
- Log what exits the component
- Verify config and environment propagation
- Inspect state at each layer

Run once to identify **where** the break occurs. Then investigate that layer specifically.

Example:

```bash
# Layer 1: Workflow
echo "=== Secrets available in workflow: ==="
echo "IDENTITY: ${IDENTITY:+SET}${IDENTITY:-UNSET}"

# Layer 2: Build script
echo "=== Env vars in build script: ==="
env | grep IDENTITY || echo "IDENTITY not in environment"

# Layer 3: Signing script
echo "=== Keychain state: ==="
security list-keychains
security find-identity -v

# Layer 4: Actual signing
codesign --sign "$IDENTITY" --verbose=4 "$APP"
```

### 5. Trace the Data Flow Backward

If the error appears deep in the stack, do not fix it there first.

Trace backward:
- Where did the bad value come from?
- What called this function with that value?
- What called that caller?
- Keep going until you find the original trigger

Use `root-cause-tracing.md` for the full tracing method.

---

## Phase 2: Pattern Analysis

**Understand the pattern before changing the code.**

### 1. Find a Working Example

Look for a similar working implementation in the same codebase.

Ask:
- What works that is structurally similar?
- What does the working path do differently?

### 2. Compare Against the Reference Completely

If you are implementing or repairing a known pattern:

- Read the full reference implementation
- Do not skim
- Do not partially adapt based on memory
- Understand all required parts before copying the pattern

### 3. Identify Every Difference

List all differences between working and broken versions.

Do not dismiss small differences. Small differences often explain the bug.

### 4. Understand Dependencies and Assumptions

Check:
- Required config
- Required environment
- Required sequencing
- Hidden assumptions
- Dependency side effects

---

## Phase 3: Hypothesis and Testing

**Use one hypothesis at a time.**

### 1. Form a Single Hypothesis

State it clearly:

```text
I think X is the root cause because Y.
```

Be precise. Avoid vague theories.

### 2. Test Minimally

Make the smallest possible change or observation to test the hypothesis.

- Change one variable at a time
- Do not combine fixes
- Do not refactor while testing a hypothesis

### 3. Verify the Result

- If the hypothesis is confirmed, proceed to Phase 4
- If it fails, stop and form a new hypothesis
- Do not stack multiple speculative fixes on top of each other

### 4. Admit Uncertainty

If you do not understand something, say so.

- “I do not understand X yet”
- Research more
- Gather more evidence
- Ask for help if needed

Pretending to understand is how debugging turns into guessing.

---

## Phase 4: Implementation

**Now fix the root cause, not the symptom.**

### 1. Create a Failing Reproduction First

Before fixing:
- Create the smallest failing test case possible
- Use an automated test when practical
- Use a one-off reproduction script if no test framework exists

This step is mandatory.

Use `superpowers:test-driven-development` for writing the failing test correctly.

### 2. Implement a Single Fix

- Fix the root cause identified in Phase 1–3
- Make one focused change
- Do not bundle cleanup, refactoring, or “while I’m here” improvements

### 3. Verify the Fix

Confirm:
- The failing test now passes
- Relevant existing tests still pass
- The original issue is actually resolved
- No new warnings or side effects were introduced

### 4. If the Fix Fails

Stop.

- If fewer than 3 fixes have failed, return to Phase 1 with the new evidence
- If 3 or more fixes have failed, stop debugging at the symptom level

### 5. If 3+ Fixes Failed, Question the Architecture

Three failed fixes is a strong signal that the problem may be architectural.

Look for patterns like:
- Each fix reveals a different shared-state issue
- Each fix exposes a new coupling problem elsewhere
- Fixes require widening changes across unrelated areas
- Each fix creates a new symptom in another layer

At that point, ask:
- Is this design fundamentally sound?
- Are we patching around a structural flaw?
- Should we redesign the boundary instead of fixing another symptom?

Do not attempt Fix #4 without an architectural discussion with your human partner.

---

## Specialized Techniques

Use these supporting documents when the situation matches:

### `root-cause-tracing.md`
Use when the bug appears deep in the call chain and the symptom is far from the source.

### `defense-in-depth.md`
Use after identifying the root cause, especially when invalid data can pass through multiple layers. Add validation at each layer so the bug becomes structurally impossible.

### `condition-based-waiting.md`
Use when tests rely on `sleep`, `setTimeout`, or arbitrary delays. Wait for the actual condition instead of guessing timing.

---

## Red Flags — Stop and Return to Phase 1

If you catch yourself thinking any of the following, stop:

- "Quick fix now, investigate later"
- "Just try changing X"
- "Let's change a few things and rerun"
- "I'll skip the test and verify manually"
- "It's probably X"
- "I don't fully understand it, but this might work"
- "The pattern says X, but I'll adapt it differently"
- Proposing solutions before tracing the data flow
- "One more fix attempt" after multiple failed fixes
- Each attempted fix reveals a different problem elsewhere

These are all signs that you are guessing.

If 3 or more fixes have already failed, stop and question the architecture.

---

## Your Human Partner's Signals You're Doing It Wrong

Watch for these signals:

- "Is that not happening?" → You assumed without verifying
- "Will it show us...?" → You should have gathered more evidence
- "Stop guessing" → You proposed fixes without understanding
- "Ultrathink this" → The issue may be structural, not local
- "We're stuck?" → Your debugging method is no longer working

When you hear these, stop and return to Phase 1.

---

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "The issue is simple" | Simple issues still have root causes. |
| "This is an emergency" | Guessing is slower than systematic debugging. |
| "I'll try one thing first" | First guesses create the wrong pattern. |
| "I'll add tests after I fix it" | Untested fixes do not stick. |
| "Multiple fixes save time" | They make learning impossible. |
| "The reference is too long" | Partial understanding creates bugs. |
| "I can already see the problem" | Seeing the symptom is not finding the cause. |
| "One more fix attempt" | Multiple failed fixes signal architecture risk. |

---

## Quick Reference

| Phase | Activities | Success Criteria |
|-------|------------|------------------|
| **1. Root Cause** | Read errors, reproduce, inspect changes, gather evidence, trace backward | You understand what is failing and why |
| **2. Pattern** | Find working examples, compare, inspect dependencies | You know what differs between working and broken |
| **3. Hypothesis** | Form one theory, test minimally, verify | The cause is confirmed or rejected |
| **4. Implementation** | Create failing test, fix once, verify completely | The issue is fixed and tests pass |

---

## When the Process Reveals No Single Root Cause

Sometimes the issue is genuinely environmental, timing-dependent, or external.

If that happens:

1. Document what you investigated
2. Document what you ruled out
3. Add appropriate handling such as retries, timeouts, or clearer error messages
4. Add monitoring or instrumentation for future investigation

But treat “no root cause” as a conclusion you earn, not a shortcut.

Most cases of “no root cause” are incomplete investigation.

---

## Supporting Documents

These documents belong with this skill:

- `root-cause-tracing.md`
- `defense-in-depth.md`
- `condition-based-waiting.md`

## Related Skills

Use this skill before proposing or attempting fixes.

Pairs well with:
- `test-driven-development`
- `assay`

## Final Rule

```text
Investigate first.
Trace to the source.
Prove the cause.
Then fix exactly one thing.
```

Anything else is guessing.
