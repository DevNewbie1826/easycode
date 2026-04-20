# Global easycode.json Fallback Support Implementation Plan

> **For agentic workers:** REQUIRED IMPLEMENTATION SKILL: Use `materialize` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a global `~/.config/opencode/easycode.json` fallback to easycode config loading while preserving the existing worktree-first, project-second local precedence.

**Architecture:** Keep the change centered in `src/easycode-config.ts` by introducing one explicit internal-only seam for tests: an optional `globalConfigPath` override passed through config loading, with production default path construction handled in the same module via `join(homedir(), ".config", "opencode", "easycode.json")`. Verify both the injected-path branch and one no-override runtime branch that proves the default global path is actually checked, then keep `src/config-handler.ts` minimal by only threading that internal seam through `CreateConfigHandlerOptions` for tests while preserving the existing ordered local source list so worktree/project precedence stays unchanged and the global file remains lowest priority.

**Tech Stack:** TypeScript, Bun test, Node `fs`/`os`/`path` utilities

---

## Scope

- Add recognition of `~/.config/opencode/easycode.json` as a fallback config source.
- Preserve current local precedence across worktree and project directories.
- Make the global-path test seam explicit and minimal so tests do not depend on the real home directory.
- Add automated tests for default path construction, one no-override runtime-path check, global fallback behavior, and local-over-global precedence.

## Out of Scope

- Any config schema additions or key-shape changes.
- Broader XDG path discovery beyond the requested `~/.config/opencode/easycode.json` path.
- Refactoring unrelated plugin, MCP, agent, or config-merging systems.
- Changing existing worktree/project precedence semantics.
- Adding environment-variable-based config search or generalized path resolution abstractions.
- Turning any seam or helper introduced for tests into a public or reusable config-resolution API.
- Creating git commits outside the implementation workflow defined in this plan.

## Assumptions

- The intended precedence is: worktree local config → project local config → global config.
- The smallest stable TDD target is an explicit optional `globalConfigPath` seam on config loading, with handler support only to pass that seam during tests.
- The global config file should be ignored when absent, unreadable, invalid JSON, or normalized to an empty config, matching current local-file behavior.
- Any seam/helper added for tests remains internal-only to this module flow and must not become a public/generalized config-discovery contract.

## Source Brief Alignment

- **Goal alignment:** Task 1 adds the global fallback in the centralized loader and verifies both injected-path and no-override production-path behavior; Task 2 verifies the application-facing handler still preserves local-first precedence when global config exists.
- **Constraint alignment:** The plan keeps the handler change minimal, avoids broader XDG/env refactors, and preserves the current worktree/project ordering.
- **Success criteria alignment:** Task 1 proves the global path is constructed and checked; Task 2 proves worktree/project configs still beat global; Task 3 reruns existing regression coverage to confirm local behavior remains unchanged.

## Execution Policy

- **Workspace isolation:** use `using-git-worktrees` before implementation begins.
- **Task tracking:** use `todo-sync` before work starts, after each completed task, and after all work is finished.
- **Implementation discipline:** `code-builder` should follow `test-driven-development` for each task.
- **Failure handling:** use `systematic-debugging` before attempting fixes for failed tests, regressions, or unexpected precedence changes.
- **Completion path:** after `assay` returns PASS, proceed to `finishing-a-development-branch`.

## File Structure

- Modify: `src/easycode-config.ts:193-217`
- Modify: `src/config-handler.ts:93-105`
- Modify: `src/__tests__/easycode-config.test.ts:7-259`
- Modify: `src/__tests__/config-handler.test.ts:282-426`
- Reference during implementation:
  - `src/index.ts:47-49`
  - `src/__tests__/plugin-index.test.ts:518-670`

## File Responsibilities

- `src/easycode-config.ts` — resolve the default global easycode config path and merge ordered config sources.
- `src/config-handler.ts` — apply loaded easycode config to runtime MCP/agent config while preserving caller precedence and only minimally threading test-only loader options.
- `src/__tests__/easycode-config.test.ts` — unit coverage for path construction, parsing, merging, and loader fallback behavior.
- `src/__tests__/config-handler.test.ts` — integration coverage for how loaded easycode config affects runtime plugin config under directory/fallback/global precedence.
- `src/index.ts` — reference point for worktree-first invocation of `createConfigHandler()`.
- `src/__tests__/plugin-index.test.ts` — regression reference for current worktree/project precedence expectations.

## Boundaries

- Keep the global-path logic focused on one requested macOS-style location and do not introduce generalized environment-based config search.
- Keep the seam explicit from the start: no hidden global state, no real-home-directory writes, and no implicit mocking strategy.
- Keep any seam/helper internal-only: it exists to stabilize tests, not to create a public/generalized config-resolution API.
- Do not change merge semantics for existing local directories; only append the global candidate after them.
- Keep handler changes limited to passing the explicit seam through options; do not move path-resolution responsibility into `config-handler.ts`.

## Task Breakdown

### Task 1: Add the explicit internal-only global-path seam and loader-level fallback coverage

**Files:**
- Modify: `src/easycode-config.ts:193-217`
- Modify: `src/__tests__/easycode-config.test.ts:7-259`
- Reference: `src/__tests__/plugin-index.test.ts:518-670`

- [ ] **Step 1: Write failing loader-level tests for the explicit seam and default runtime path**

Add focused tests in `src/__tests__/easycode-config.test.ts` for an explicit internal-only loader seam such as `loadEasyCodeConfig(directories, { globalConfigPath })` and for one no-override runtime-path assertion. Cover all of these cases:
- the default production path resolves exactly to `join(homedir(), ".config", "opencode", "easycode.json")`
- one no-override runtime-chain test proves `loadEasyCodeConfig()` checks that default global path when no `globalConfigPath` override is supplied
- no local config present → global config is loaded via the explicit seam
- invalid or empty higher-precedence local config → valid global config is used
- local config present → local config wins over global for the same section/agent name
- invalid global config → loader returns the same result as if the global file were absent

Anchor these tests on concrete config payloads:
- use `mcp.websearch.enabled` for at least one fallback/precedence assertion
- optionally use one `agent.explorer` model/variant case to confirm agent-name precedence still behaves the same way

- [ ] **Step 2: Run the targeted loader tests and confirm failure**

Run: `bun test src/__tests__/easycode-config.test.ts`
Expected: the new default-path, no-override runtime-path, and global fallback assertions fail because `loadEasyCodeConfig()` currently only checks `<directory>/.opencode/easycode.json` and has no explicit global seam.

- [ ] **Step 3: Implement the minimal loader seam and default path construction**

Update `src/easycode-config.ts` so it:
- exposes one explicit internal-only mechanism for the global path used in tests and production
- constructs the production fallback path with `join(homedir(), ".config", "opencode", "easycode.json")` when no override is provided
- keeps local directories in their current caller-provided order
- appends one lowest-priority global candidate after the local directories
- reuses the current missing-file / invalid-JSON / empty-config skip behavior for the global file

- [ ] **Step 4: Re-run the loader tests and confirm success**

Run: `bun test src/__tests__/easycode-config.test.ts`
Expected: the new default-path, no-override runtime-path, invalid-local-falls-to-global, and global fallback tests pass and the existing local merge/preference tests remain green.

- [ ] **Step 5: Commit the focused loader change**

```bash
git add src/easycode-config.ts src/__tests__/easycode-config.test.ts
git commit -m "feat: add global easycode config fallback"
```

**QA / Verification**
- Tool: `bun test`
- Steps: Run `bun test src/__tests__/easycode-config.test.ts` from `/Users/mirage/go/src/easycode`.
- Expected Result: all loader tests pass, including exact verification of `join(homedir(), ".config", "opencode", "easycode.json")`, one no-override runtime-path check, invalid/empty local fall-through to global, `mcp.websearch`-anchored precedence, and invalid-global ignore behavior.

### Task 2: Thread the seam through `createConfigHandler()` while preserving local-first precedence

**Files:**
- Modify: `src/config-handler.ts:93-105`
- Modify: `src/__tests__/config-handler.test.ts:282-426`
- Reference: `src/index.ts:47-49`

- [ ] **Step 1: Write failing handler-level tests for application precedence**

Add targeted tests in `src/__tests__/config-handler.test.ts` that call `createConfigHandler()` with the explicit `globalConfigPath` override in `CreateConfigHandlerOptions`. Cover all of these cases:
- `createConfigHandler(directory, undefined, { globalConfigPath })` uses the global config when the primary directory has no easycode file
- `createConfigHandler(worktree, project, { globalConfigPath })` prefers `project` over global when `worktree` is absent and both project and global configs exist
- `createConfigHandler(worktree, project, { globalConfigPath })` prefers `worktree` over both project and global when all three exist
- an invalid or empty higher-precedence local config falls through to a valid global config
- an invalid or partial global config does not fill missing fields into a higher-precedence local entry

Anchor at least one handler precedence test on `mcp.websearch` output so the assertion validates application-visible behavior instead of only raw loader data. Optionally add one agent-focused case if it clarifies agent-name precedence without expanding scope.

- [ ] **Step 2: Run the targeted handler tests and confirm failure**

Run: `bun test src/__tests__/config-handler.test.ts`
Expected: the new global precedence tests fail before `createConfigHandler()` can pass the explicit seam through to the loader.

- [ ] **Step 3: Keep the handler change minimal**

Update `src/config-handler.ts` so `CreateConfigHandlerOptions` accepts the explicit optional `globalConfigPath`, and pass that internal-only option through to `loadEasyCodeConfig()` while keeping production callers unchanged and preserving the existing local source order `[directory, fallbackDirectory]`.

- [ ] **Step 4: Re-run the handler tests and confirm success**

Run: `bun test src/__tests__/config-handler.test.ts`
Expected: the new global fallback tests pass, the project-over-global `mcp.websearch` case passes when worktree is absent, the worktree-over-project-over-global case passes when all exist, invalid/empty local config can fall through to global when appropriate, and existing local fallback tests remain green.

- [ ] **Step 5: Commit the handler-level precedence coverage**

```bash
git add src/config-handler.ts src/__tests__/config-handler.test.ts
git commit -m "feat: wire global easycode fallback through handler"
```

**QA / Verification**
- Tool: `bun test`
- Steps: Run `bun test src/__tests__/config-handler.test.ts` from `/Users/mirage/go/src/easycode`.
- Expected Result: handler tests show global config is only used after local directories are exhausted, with project/fallback beating global when worktree is absent, worktree beating both when present, and invalid/empty higher-precedence local config falling through to a valid global config.

### Task 3: Re-run regression coverage for existing local precedence and repo health

**Files:**
- Reference: `src/__tests__/plugin-index.test.ts:518-670`
- Reference: `package.json:20-29`

- [ ] **Step 1: Re-run the existing plugin precedence integration tests**

Run the worktree/directory precedence coverage already present in `src/__tests__/plugin-index.test.ts` to confirm the new global support did not alter current local behavior.

- [ ] **Step 2: Run static verification for the TypeScript surface**

Run the repository typecheck after the loader and handler signature changes.

- [ ] **Step 3: Run the full targeted regression set and confirm success**

Run the loader, handler, and plugin precedence tests together after implementation.

- [ ] **Step 4: Record verification results in the implementation notes**

Capture the exact commands and PASS results so the execution handoff includes fresh evidence for `assay`.

**QA / Verification**
- Tool: `bun test`, `bun run typecheck`
- Steps:
  1. Run `bun test src/__tests__/plugin-index.test.ts`.
  2. Run `bun test src/__tests__/easycode-config.test.ts src/__tests__/config-handler.test.ts`.
  3. Run `bun run typecheck`.
- Expected Result: existing plugin worktree/project precedence tests still pass, new global fallback tests pass, and typecheck succeeds with no signature regressions.

## QA / Verification

- Run `bun test src/__tests__/easycode-config.test.ts` and confirm PASS. Expected: loader-level coverage proves the exact default global path is `join(homedir(), ".config", "opencode", "easycode.json")`, includes one no-override runtime-path check, and confirms invalid/empty higher-precedence local config can fall through to global while valid local config still outranks it.
- Run `bun test src/__tests__/config-handler.test.ts` and confirm PASS. Expected: handler-level coverage proves runtime config loading uses the global file only after exhausting worktree/project sources, includes an `mcp.websearch`-anchored project-over-global case when worktree is absent, and confirms invalid/empty higher-precedence local config can fall through to global.
- Run `bun test src/__tests__/plugin-index.test.ts` and confirm PASS. Expected: pre-existing worktree-vs-project precedence behavior remains unchanged.
- Run `bun run typecheck` and confirm PASS. Expected: the explicit optional seam remains type-safe and does not alter runtime callers.

## Save Path

- `/docs/easycode/plans/2026-04-20-global-easycode-json-fallback-support.md`

Plan complete and saved to `/docs/easycode/plans/2026-04-20-global-easycode-json-fallback-support.md`.

Would you like to start implementation with `materialize` based on this plan?
