---
name: finishing-a-development-branch
description: Use when implementation is complete, tests are passing, and you need to decide how to integrate the work - guides completion of development work by presenting structured options for merge, PR, or cleanup
---

# Finishing a Development Branch

## Overview

Guide completion of development work by presenting clear options and handling the selected workflow.

**Core principle:** Verify tests → Present options → Execute choice → Clean up only when appropriate.

**Announce at start:** "I'm using the finishing-a-development-branch skill to complete this work."

## The Process

### Step 1: Verify Tests

**Before presenting options, verify tests pass:**

```bash
# Run the project's test suite
npm test / cargo test / pytest / go test ./...
```

**If tests fail:**

```text
Tests failing (<N> failures). Must fix before completing:

[Show failures]

Cannot proceed with merge or PR until tests pass.
```

Stop. Do not proceed to Step 2.

**If tests pass:** Continue to Step 2.

### Step 2: Determine Base Branch

Try to detect the base branch automatically:

```bash
git merge-base HEAD main >/dev/null 2>&1 && echo main || \
git merge-base HEAD master >/dev/null 2>&1 && echo master
```

If detection is unclear, ask one concise question:

```text
This branch appears to have split from <candidate-base-branch>. Is that correct?
```

Do not guess if the base branch is ambiguous.

### Step 3: Present Options

Present exactly these 4 options:

```text
Implementation complete. What would you like to do?

1. Merge back to <base-branch> locally
2. Push and create a Pull Request
3. Keep the branch as-is (I'll handle it later)
4. Discard this work

Which option?
```

Do not add extra explanation.

### Step 4: Execute Choice

#### Option 1: Merge Locally

```bash
# Switch to base branch
git checkout <base-branch>

# Update local base branch
git pull

# Merge feature branch
git merge <feature-branch>

# Verify tests on merged result
<test command>

# If tests pass
git branch -d <feature-branch>
```

Then: Cleanup worktree (Step 5)

#### Option 2: Push and Create PR

```bash
# Push branch
git push -u origin <feature-branch>

# Create PR
gh pr create --title "<title>" --body "$(cat <<'EOF'
## Summary
<2-3 bullets of what changed>

## Test Plan
- [ ] <verification steps>
EOF
)"
```

Then: Keep branch and worktree.

Report:

```text
Pull Request created for <feature-branch>. Branch and worktree preserved for follow-up changes.
```

#### Option 3: Keep As-Is

Report:

```text
Keeping branch <feature-branch>. Worktree preserved at <worktree-path>.
```

Do not clean up the worktree.

#### Option 4: Discard

**Require explicit confirmation first:**

```text
This will permanently delete:
- Branch <feature-branch>
- All commits on this branch that are not merged
- Worktree at <worktree-path>

Type 'discard' to confirm.
```

Wait for the exact confirmation: `discard`

If confirmed:

```bash
git checkout <base-branch>
git branch -D <feature-branch>
```

Then: Cleanup worktree (Step 5)

### Step 5: Cleanup Worktree

**Only for Options 1 and 4:**

Check whether the branch is associated with a worktree:

```bash
git worktree list
```

If the worktree exists, remove it:

```bash
git worktree remove <worktree-path>
```

**For Option 2:** Keep the branch and worktree.

**For Option 3:** Keep the branch and worktree.

## Quick Reference

| Option | Merge | Push | Keep Worktree | Cleanup Branch |
|--------|-------|------|---------------|----------------|
| 1. Merge locally | ✓ | - | - | ✓ |
| 2. Create PR | - | ✓ | ✓ | - |
| 3. Keep as-is | - | - | ✓ | - |
| 4. Discard | - | - | - | ✓ (force) |

## Common Mistakes

### Skipping test verification

- **Problem:** Broken code gets merged or pushed into a PR
- **Fix:** Always verify tests before offering options

### Open-ended completion questions

- **Problem:** "What should I do next?" creates ambiguity
- **Fix:** Present exactly 4 structured options

### Cleaning up after PR creation

- **Problem:** The branch and worktree are often still needed for PR follow-up commits
- **Fix:** Keep branch and worktree for Option 2

### No confirmation for discard

- **Problem:** Work can be deleted accidentally
- **Fix:** Require typed `discard` confirmation

### Guessing the base branch

- **Problem:** Merge or cleanup may happen against the wrong target
- **Fix:** Detect automatically when possible, otherwise ask one concise question

## Red Flags

**Never:**
- Proceed with failing tests
- Merge without verifying tests on the merged result
- Delete work without explicit confirmation
- Force-push without explicit request
- Clean up branch or worktree after PR creation unless explicitly requested

**Always:**
- Verify tests before offering options
- Present exactly 4 options
- Require typed confirmation for Option 4
- Clean up worktree only for Options 1 and 4
- Preserve branch and worktree for Options 2 and 3

## Integration

**Use after:**
- implementation is complete and tests are passing

**Pairs with:**
- using-git-worktrees
