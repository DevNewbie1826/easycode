---
name: using-git-worktrees
description: Use when starting feature work that needs isolation from current workspace or before executing implementation plans - creates isolated git worktrees with project-local directory selection and safety verification
---

# Using Git Worktrees

## Overview

Git worktrees create isolated workspaces sharing the same repository, allowing work on multiple branches simultaneously without switching.

**Core principle:** Always use a project-local `.worktrees/` directory with safety verification before creation.

**Announce at start:** "I'm using the using-git-worktrees skill to set up an isolated workspace."

## Directory Selection Process

Follow this rule every time:

### 1. Use `.worktrees/`

Always use:

```bash
.worktrees/
```

This is the only supported worktree directory.

### 2. Never ask, never branch

- Do not ask the user where to create worktrees.
- Do not use `worktrees/` as an alternative.
- Do not use any global worktree location.
- Do not apply repository preferences that point elsewhere.

**Why:** A single standard location makes agent behavior predictable, keeps cleanup simple, and removes unnecessary decisions.

## Safety Verification

### For `.worktrees/`

**MUST verify `.worktrees/` is ignored before creating a worktree:**

```bash
git check-ignore -q .worktrees
```

### If `.worktrees/` is NOT ignored

Per Jesse's rule "Fix broken things immediately":

1. Add `.worktrees/` to `.gitignore`
2. Commit the change
3. Proceed with worktree creation

Example:

```bash
printf "\n.worktrees/\n" >> .gitignore
git add .gitignore
git commit -m "chore: ignore local git worktrees"
```

**Why critical:** Prevents accidentally tracking worktree contents or polluting repository status.

## Creation Steps

### 1. Detect Project Root

```bash
root=$(git rev-parse --show-toplevel)
```

### 2. Ensure `.worktrees/` exists

```bash
mkdir -p "$root/.worktrees"
```

### 3. Create Worktree

```bash
path="$root/.worktrees/$BRANCH_NAME"
git worktree add "$path" -b "$BRANCH_NAME"
cd "$path"
```

### 4. Run Project Setup

Auto-detect and run appropriate setup:

```bash
# Node.js
if [ -f package.json ]; then npm install; fi

# Rust
if [ -f Cargo.toml ]; then cargo build; fi

# Python
if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
if [ -f pyproject.toml ]; then poetry install; fi

# Go
if [ -f go.mod ]; then go mod download; fi
```

### 5. Verify Clean Baseline

Run tests to ensure worktree starts clean:

```bash
# Examples - use project-appropriate command
npm test
cargo test
pytest
go test ./...
```

**If tests fail:** Report failures, ask whether to proceed or investigate.

**If tests pass:** Report ready.

### 6. Report Location

```text
Worktree ready at <full-path>
Tests passing (<N> tests, 0 failures)
Ready to implement <feature-name>
```

## Quick Reference

| Situation | Action |
|-----------|--------|
| `.worktrees/` exists | Use it |
| `.worktrees/` does not exist | Create it |
| `.worktrees/` not ignored | Add to `.gitignore` + commit immediately |
| Tests fail during baseline | Report failures + ask |
| No package.json/Cargo.toml | Skip dependency install |

## Common Mistakes

### Asking where to create the worktree

- **Problem:** Introduces unnecessary decisions and inconsistent behavior
- **Fix:** Always use `.worktrees/`

### Supporting multiple directory names

- **Problem:** Creates drift between repositories and weakens automation
- **Fix:** Standardize on `.worktrees/` only

### Skipping ignore verification

- **Problem:** Worktree contents get tracked and pollute git status
- **Fix:** Always run `git check-ignore -q .worktrees` before creation

### Proceeding with failing tests

- **Problem:** Can't distinguish new bugs from pre-existing issues
- **Fix:** Report failures and get explicit permission to proceed

### Hardcoding setup commands

- **Problem:** Breaks on projects using different tools
- **Fix:** Auto-detect from project files

## Example Workflow

```text
You: I'm using the using-git-worktrees skill to set up an isolated workspace.

[Verify .worktrees/ is ignored]
[If needed, add .worktrees/ to .gitignore and commit]
[Create worktree: git worktree add .worktrees/auth -b feature/auth]
[Run npm install]
[Run npm test - 47 passing]

Worktree ready at /Users/jesse/myproject/.worktrees/auth
Tests passing (47 tests, 0 failures)
Ready to implement auth feature
```

## Red Flags

**Never:**
- Create a worktree outside `.worktrees/`
- Ask the user to choose a worktree location
- Use a global worktree directory
- Skip ignore verification
- Skip baseline test verification
- Proceed with failing tests without asking

**Always:**
- Use `.worktrees/`
- Verify `.worktrees/` is ignored
- Fix `.gitignore` immediately if needed
- Auto-detect and run project setup
- Verify a clean test baseline

## Integration

**Use before:**
- implementation work that should be isolated from the current workspace

**Pairs with:**
- finishing-a-development-branch
