# Local Git History Reset to Single Root Commit Implementation Plan

> **For agentic workers:** REQUIRED IMPLEMENTATION SKILL: Use `materialize` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current local Git history in `/Users/mirage/go/src/easycode` with one new root commit built from the current working tree, without touching any remote.

**Architecture:** Keep all temporary safety artifacts inside the repo under a dedicated excluded directory, archive the current working tree there, and move the original `.git` there before reinitializing Git. Stage the live file tree from disk while explicitly excluding the safety directory, verify that the new repo contains exactly one root commit, and keep rollback possible until final cleanup removes the in-repo safety directory.

**Tech Stack:** Git CLI, zsh, `tar`, `find`, `diff`

---

## Scope

- Delete prior local commit history by replacing the active `.git` directory.
- Preserve the current working tree as the source for the new first commit.
- Include current tracked changes, untracked files, deletions, and ignored files in the new commit.
- Keep all temporary safety artifacts inside the repo working directory only.
- Ensure safety artifacts do not appear in the new first commit.
- Verify that the result is one clean local root commit.
- Provide rollback instructions until final cleanup completes.

## Out of Scope

- Any `fetch`, `pull`, `push`, `clone`, or other remote operations.
- Preserving old refs, remotes, tags, hooks, or reflog inside the new `.git`.
- Manual content edits to the working tree during the reset.
- Any source-code or config changes unrelated to the history reset.

## Assumptions

- The current filesystem state under `/Users/mirage/go/src/easycode` is exactly what should become the new first commit.
- No submodules are present.
- Enough free disk space exists inside the repo for a compressed tree backup plus the archived original `.git`.
- `git config user.name` and `git config user.email` are available before the old `.git` is moved.
- Git preserving file content exactly is sufficient; empty directories cannot be represented in commits.

## Source Brief Alignment

- **Local repo only** → all safety artifacts live under `.history-reset-safety/` inside the repo.
- **Delete all prior local commit history** → Task 2 replaces `.git` and Task 3 deletes the archived original `.git` after verification.
- **Single first commit from current working tree including uncommitted changes** → Task 2 force-stages the current on-disk tree outside the safety directory and commits it.
- **Do not touch remote** → no remote commands are used; verification confirms the new repo has no remotes.
- **Avoid losing working tree contents** → Task 1 creates an in-repo tar backup before moving `.git`, and rollback remains possible until cleanup.
- **Prove single local root commit** → Task 3 verifies clean status, commit count `1`, and `HEAD` as the only root commit.

## File Structure

- Create: `/Users/mirage/go/src/easycode/.history-reset-safety/`
- Create: `/Users/mirage/go/src/easycode/.history-reset-safety/reset.env`
- Create: `/Users/mirage/go/src/easycode/.history-reset-safety/working-tree.tgz`
- Create: `/Users/mirage/go/src/easycode/.history-reset-safety/original.git/`
- Replace: `/Users/mirage/go/src/easycode/.git/`

## File Responsibilities

- `.history-reset-safety/reset.env` — persists branch and author identity for repeatable execution.
- `.history-reset-safety/working-tree.tgz` — backup of the pre-reset working tree, excluding `.git` and `.history-reset-safety`.
- `.history-reset-safety/original.git/` — archived original local Git metadata for rollback until final cleanup.
- `.git/` — fresh local Git metadata containing only the new root commit.

## Boundaries

- Do not edit repo files while executing this plan.
- Do not stage `.history-reset-safety/`; exclude it locally in `.git/info/exclude` before staging.
- If verification fails before final cleanup, stop and restore `.git` from `.history-reset-safety/original.git`.

## Task Breakdown

### Task 1: Create in-repo safety artifacts before destructive changes

**Files:**
- Create: `.history-reset-safety/`
- Create: `.history-reset-safety/reset.env`
- Create: `.history-reset-safety/working-tree.tgz`
- Create: `.history-reset-safety/original.git/`

- [ ] **Step 1: Persist execution variables and author identity**

Run:
```bash
mkdir -p .history-reset-safety && STAMP="$(date +%Y%m%d-%H%M%S)" && CURRENT_BRANCH="$(git symbolic-ref --quiet --short HEAD || printf 'main')" && AUTHOR_NAME="$(git config user.name)" && AUTHOR_EMAIL="$(git config user.email)" && test -n "$AUTHOR_NAME" && test -n "$AUTHOR_EMAIL" && printf 'export STAMP=%q\nexport CURRENT_BRANCH=%q\nexport AUTHOR_NAME=%q\nexport AUTHOR_EMAIL=%q\n' "$STAMP" "$CURRENT_BRANCH" "$AUTHOR_NAME" "$AUTHOR_EMAIL" > .history-reset-safety/reset.env
```

Expected: `.history-reset-safety/reset.env` exists and contains branch plus author identity.

- [ ] **Step 2: Archive the current working tree inside the repo**

Run:
```bash
tar -czf .history-reset-safety/working-tree.tgz --exclude='./.git' --exclude='./.history-reset-safety' .
```

Expected: `.history-reset-safety/working-tree.tgz` exists and contains the current working tree snapshot.

- [ ] **Step 3: Move the original `.git` into the in-repo safety directory**

Run:
```bash
mv .git .history-reset-safety/original.git
```

Expected: the active repo no longer has `.git/`, and the original metadata is preserved at `.history-reset-safety/original.git/`.

- [ ] **Step 4: Verify safety artifacts before reinitializing Git**

Run:
```bash
test -f .history-reset-safety/working-tree.tgz && test -d .history-reset-safety/original.git
```

Expected: both the tree archive and archived original `.git` exist.

**QA / Verification**
- Tool: `zsh`, `tar`, `test`
- Steps: run Task 1 Steps 1-4 in order.
- Expected Result: `.history-reset-safety/` contains `reset.env`, `working-tree.tgz`, and `original.git/` before any new `.git` is created.

### Task 2: Reinitialize Git locally and create the new first commit without staging safety artifacts

**Files:**
- Replace: `.git/`
- Reference: repo working tree excluding `.history-reset-safety/`
- Modify: `.git/info/exclude`

- [ ] **Step 1: Initialize a fresh repo and restore local author identity**

Run:
```bash
source .history-reset-safety/reset.env && git init -b "$CURRENT_BRANCH" && git config user.name "$AUTHOR_NAME" && git config user.email "$AUTHOR_EMAIL"
```

Expected: a new `.git/` exists, the branch name is restored, and commit identity is configured.

- [ ] **Step 2: Exclude the in-repo safety directory from the new repo**

Run:
```bash
printf '/.history-reset-safety/\n' >> .git/info/exclude
```

Expected: `git status --short --ignored` will treat `.history-reset-safety/` as ignored local-only content.

- [ ] **Step 3: Stage the exact current file tree except `.history-reset-safety/`**

Run:
```bash
find . -mindepth 1 \( -path './.git' -o -path './.git/*' -o -path './.history-reset-safety' -o -path './.history-reset-safety/*' \) -prune -o -print0 | xargs -0 git add -f --
```

Expected: all current repo paths except `.git` and `.history-reset-safety` are staged, including ignored files.

- [ ] **Step 4: Review the staged set before committing**

Run:
```bash
git status --short --branch --ignored
```

Expected: intended content is staged, and `.history-reset-safety/` appears only as ignored, not staged.

- [ ] **Step 5: Create the single new root commit**

Run:
```bash
git commit -m "Initial commit"
```

Expected: commit succeeds and becomes the new `HEAD`.

**QA / Verification**
- Tool: `git`, `find`, `xargs`
- Steps: run Task 2 Steps 1-5 in order.
- Expected Result: the new repo is initialized locally, `.history-reset-safety/` is excluded, and the first commit is created from the live working tree only.

### Task 3: Verify the result, define rollback, and remove the in-repo safety directory

**Files:**
- Reference: `.history-reset-safety/working-tree.tgz`
- Reference: `.history-reset-safety/original.git/`
- Delete: `.history-reset-safety/`

- [ ] **Step 1: Compare the current working tree to the archived backup**

Run:
```bash
rm -rf .history-reset-safety/compare && mkdir -p .history-reset-safety/compare && tar -xzf .history-reset-safety/working-tree.tgz -C .history-reset-safety/compare && diff -qr --exclude '.history-reset-safety' --exclude '.git' . .history-reset-safety/compare
```

Expected: `diff` prints no differences.

- [ ] **Step 2: Verify the repo is clean and has exactly one root commit**

Run:
```bash
git status --short --branch --ignored && test "$(git rev-list --count HEAD)" = "1" && test "$(git rev-parse HEAD)" = "$(git rev-list --max-parents=0 HEAD)"
```

Expected: status is clean aside from ignored `.history-reset-safety/`, commit count is `1`, and `HEAD` is the sole root commit.

- [ ] **Step 3: Verify visible history, remote-free state, and absence of safety artifacts from the commit**

Run:
```bash
git log --oneline --decorate --graph --all && git remote -v && ! git ls-tree -r --name-only HEAD | grep -F '.history-reset-safety/'
```

Expected: the log shows one commit, `git remote -v` prints nothing, and the commit tree contains no `.history-reset-safety/` paths.

- [ ] **Step 4: Roll back if any verification above fails before cleanup**

Run:
```bash
rm -rf .git && mv .history-reset-safety/original.git .git && tar -xzf .history-reset-safety/working-tree.tgz -C . && git status --short --branch
```

Expected: the original local Git metadata and pre-reset working tree are restored.

- [ ] **Step 5: If Steps 1-3 pass, delete the in-repo safety directory and confirm final clean state**

Run:
```bash
rm -rf .history-reset-safety && git status --short --branch
```

Expected: `.history-reset-safety/` is removed, and the repo remains clean.

**QA / Verification**
- Tool: `git`, `tar`, `diff`, `grep`
- Steps: run Task 3 Steps 1-3; run Step 4 only on failure, otherwise run Step 5.
- Expected Result: success path proves one clean root commit with no safety artifacts committed; failure path restores the original repo locally.

## QA / Verification

- Run `git rev-list --count HEAD`. Expected: `1`.
- Run `test "$(git rev-parse HEAD)" = "$(git rev-list --max-parents=0 HEAD)"`. Expected: exit status `0`.
- Run `git log --oneline --decorate --graph --all`. Expected: exactly one visible commit.
- Run `git remote -v`. Expected: no output.
- Run `git ls-tree -r --name-only HEAD | grep -F '.history-reset-safety/'`. Expected: no output.
- Run `git status --short --branch` after final cleanup. Expected: clean working tree.
- If verification fails before cleanup, run `rm -rf .git && mv .history-reset-safety/original.git .git && tar -xzf .history-reset-safety/working-tree.tgz -C . && git status --short --branch`. Expected: original local history and working tree are restored.

## Save Path

- `/docs/easycode/plans/2026-04-20-local-history-reset-single-root-commit.md`

Plan complete and saved to `/docs/easycode/plans/2026-04-20-local-history-reset-single-root-commit.md`.

Would you like to start implementation with `materialize` based on this plan?
