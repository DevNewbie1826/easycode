# README Product Introduction Repositioning Implementation Plan

> **For agentic workers:** REQUIRED IMPLEMENTATION SKILL: Use `materialize` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `README.md` so it reads like a product introduction first—value, built-ins, configuration model, workflow, and advantages—while staying strictly accurate to current implementation.

**Architecture:** Keep the change limited to `README.md`. Build the rewrite from source code and tests first, then use `package.json` and `src/index.ts` for build/wiring context, and reuse existing README copy only when it is cross-checked against code. Reorder the document so product story leads and setup/reference detail follows.

**Tech Stack:** Markdown, TypeScript source references, Bun verification commands

---

## Scope

- **In scope**
  - Rebalance `README.md` toward a product-first bilingual introduction.
  - Foreground built-in tools, built-in MCP integrations, config location, workflow introduction, and evidence-backed advantages.
  - Explicitly document that `.opencode/easycode.json` is the supported config file location today.
  - Explicitly document that `~/.config/opencode/` is not supported.
  - Keep necessary install/build/use guidance, but compress and move it later in the file.
- **Out of scope**
  - Any code, test, config, or runtime changes.
  - Adding support for `~/.config/opencode/`.
  - Splitting the README into multiple files.
  - Adding screenshots or unsupported marketing claims.
  - Adding commit steps.

## Assumptions

- The bilingual single-file README remains the desired output format.
- The product-facing built-ins section should include the full shipped tool inventory, including `current_time` as the utility tool.
- The workflow should be documented as the default/primary path, not as a universal path that every request always executes end-to-end.

## Source Brief Alignment

- **Product-introduction tone** → Task 2 rewrites the opening and section order around value and user outcomes.
- **Built-in tools / MCP emphasis** → Tasks 1-2 verify and foreground the exact shipped inventories.
- **Config truth** → Tasks 1-3 preserve the supported file path, unsupported global path, precedence behavior, and override behavior.
- **Workflow introduction** → Task 2 documents the primary workflow path with bounded wording.
- **Advantages / value proposition** → Tasks 1 and 3 restrict promotional copy to source-backed claims.
- **Bilingual accuracy** → Task 2 enforces EN/KR parity before final sign-off.

## Execution Policy

- **Workspace isolation:** use `using-git-worktrees` before implementation begins.
- **Task tracking:** use `todo-sync` before work starts, after each completed task, and after all work is finished.
- **Implementation discipline:** use an evidence ledger before drafting prose.
- **Failure handling:** use `systematic-debugging` before attempting fixes if verification fails or wording conflicts with source evidence.
- **Git policy:** do not add commit steps or create commits for this docs-only task.

## Evidence Model

- **Primary authority:** `src/**/*.ts` and `src/__tests__/*.ts`
- **Secondary authority:** `package.json` and `src/index.ts`
- **Cross-check only:** existing `README.md` content may be reused only after matching it to current source/test evidence.
- If a useful sentence cannot be supported by code/tests or the approved secondary sources, omit it.

## File Structure

- Modify: `README.md:1-501`
- Reference:
  - `package.json:1-45`
  - `src/index.ts:1-60`
  - `src/tools/index.ts:1-25`
  - `src/tools/lsp/registry.ts`
  - `src/tools/ast/sg.ts`
  - `src/tools/current-time/index.ts`
  - `src/mcp/index.ts`
  - `src/mcp/websearch.ts`
  - `src/easycode-config.ts:1-217`
  - `src/config-handler.ts:1-148`
  - `src/agents/prompt-text/orchestrator-prompt.md:1-120`
  - `src/__tests__/easycode-config.test.ts`
  - `src/__tests__/config-handler.test.ts`
  - `src/__tests__/plugin-index.test.ts`

## File Responsibilities

- `README.md` — bilingual product introduction, capability overview, config guide, workflow overview, and concise setup reference.
- `src/tools/index.ts` + tool implementation files — canonical shipped tool inventory, including `current_time`.
- `src/mcp/*.ts` — canonical built-in and optional MCP inventory.
- `src/index.ts` — plugin wiring for worktree/directory config resolution.
- `src/easycode-config.ts` — canonical config file loading, normalization, precedence, and fallback behavior.
- `src/config-handler.ts` — canonical merge/override behavior for built-in MCP and agent config injection.
- `src/__tests__/*.ts` — executable evidence for config precedence and override wording.
- `package.json` — authoritative build/typecheck/local install commands that remain in README.

## Boundaries

- **Allowed workflow phrasing:** “default workflow path,” “primary workflow path,” “common progression,” “structured handoff across stages.”
- **Banned workflow phrasing:** “every request always runs every stage,” “all requests must go through every stage,” “strict chain enforced for every request.”
- **Built-ins decision:** include `current_time` in the product-facing built-ins inventory and QA.
- **Must-keep config truths for the compressed config section:**
  - supported file location: `.opencode/easycode.json`
  - unsupported global path: `~/.config/opencode/`
  - precedence behavior: worktree config wins over project-directory config; absent/invalid worktree config falls back to directory config
  - override behavior: higher-precedence entries replace fallback entries instead of deep-merging; existing OpenCode `config.mcp` entries override plugin MCP defaults
- Do not expose raw internal prompt/control-block text.

## Task Breakdown

### Task 1: Build the evidence ledger and lock section rules

**Files:**
- Modify: `README.md:1-501` (outline only until evidence is locked)
- Test/Reference:
  - `src/tools/index.ts`
  - `src/tools/current-time/index.ts`
  - `src/mcp/index.ts`
  - `src/mcp/websearch.ts`
  - `src/index.ts`
  - `src/easycode-config.ts`
  - `src/config-handler.ts`
  - `src/agents/prompt-text/orchestrator-prompt.md`
  - `src/__tests__/easycode-config.test.ts`
  - `src/__tests__/config-handler.test.ts`
  - `src/__tests__/plugin-index.test.ts`

- [ ] **Step 1: Create a claim ledger for each planned README section**

Create rows for:
- product introduction / value proposition
- built-in tools
- built-in MCP integrations
- configuration model
- workflow introduction
- compressed install/build/local use guidance

- [ ] **Step 2: Lock the built-in inventories, including the utility tool decision**

Verify the exact product-facing inventory from source:
- 6 LSP tools
- 2 AST tools
- 1 utility tool: `current_time`
- built-in MCP: `context7`, `grep_app`, `sequential_thinking`
- optional MCP: `websearch`

Expected: the README and QA both treat `current_time` as included, not implicit.

- [ ] **Step 3: Verify the must-keep config truth list**

Cross-check `src/index.ts`, `src/easycode-config.ts`, `src/config-handler.ts`, `src/__tests__/easycode-config.test.ts`, `src/__tests__/config-handler.test.ts`, and `src/__tests__/plugin-index.test.ts`.

Expected: the ledger records the exact supported file location, unsupported global path, precedence behavior, and override behavior that the README must retain.

- [ ] **Step 4: Lock the workflow wording boundary**

Use `src/agents/prompt-text/orchestrator-prompt.md` to capture the chain as the default/primary workflow path and explicitly ban universal wording.

- [ ] **Step 5: Freeze the section order before prose rewrite**

Final order:
1. what EasyCode is
2. why it is useful
3. what is built in
4. how configuration works
5. the default workflow path
6. concise install/build/local use
7. brief development/reference notes only if still necessary

**QA / Verification**
- Tool: `read`
- Steps: Compare the evidence ledger against the referenced source/test files.
- Expected Result: every planned section has a source-backed claim set, a banned-claim list, and an explicit decision on `current_time` and workflow wording.

### Task 2: Rewrite `README.md` as a bilingual product introduction

**Files:**
- Modify: `README.md:1-501`
- Test: `README.md:1-501`

- [ ] **Step 1: Replace the opening with a value-first product summary**

Lead with what EasyCode is, what users get out of the box, and why it is useful before build/setup detail.

- [ ] **Step 2: Add the built-ins section with complete shipped inventory**

Document the product-facing tool inventory, including `current_time`, and the MCP inventory with `websearch` clearly marked optional.

- [ ] **Step 3: Compress the config section without losing the required truths**

The final config section must keep all four truths from **Boundaries** and must not introduce unsupported global-path or merge claims.

- [ ] **Step 4: Introduce the workflow as the default/primary path**

Describe `lucidify → crystallize → using-git-worktrees → materialize → assay → finishing-a-development-branch` as the primary workflow story. Do not state or imply that every request always runs every stage.

- [ ] **Step 5: Move install/build/dev-heavy detail later and shorten it**

Keep the verified commands and local-use notes, but make them supporting reference material rather than the lead narrative.

- [ ] **Step 6: Enforce EN/KR parity**

Ensure both languages carry the same claims, warnings, and workflow/config limits.

**QA / Verification**
- Tool: `read`
- Steps: Read the rewritten `README.md` top-to-bottom and confirm the first major sections are value, built-ins, config, and workflow—not setup.
- Expected Result: the README reads like a product introduction while preserving bilingual parity and required technical truth.

### Task 3: Run semantic QA and trim overreach

**Files:**
- Modify: `README.md:1-501` (final wording trim only if QA fails)
- Test/Reference:
  - `README.md:1-501`
  - all files listed in **File Structure**

- [ ] **Step 1: Verify wording boundaries for workflow claims**

Confirm the README uses allowed workflow phrasing and contains none of the banned universal claims.

- [ ] **Step 2: Verify the built-ins section is semantically complete and accurate**

Confirm the README includes `current_time` alongside the LSP and AST tool inventories, and that optional vs built-in MCP wording is correct.

- [ ] **Step 3: Verify the compressed config section still preserves all four truths**

Confirm the final wording covers supported location, unsupported global path, precedence behavior, and override behavior without drifting into unsupported semantics.

- [ ] **Step 4: Verify value claims stay within evidence**

Check each advantage statement against the evidence ledger and remove any sentence that oversells beyond source-backed capability.

- [ ] **Step 5: Run lightweight repository verification**

Run the standard non-regression command after the docs change.

**QA / Verification**
- Tool: `rg` + `read` + `bun`
- Steps:
  1. Run `rg -n "^#|^##" README.md` and confirm product/value sections appear before install/build sections.
  2. Run `rg -n "current_time|lsp_goto_definition|lsp_find_references|lsp_symbols|lsp_diagnostics|lsp_prepare_rename|lsp_rename|ast_grep_search|ast_grep_replace|context7|grep_app|sequential_thinking|websearch" README.md`.
  3. Run `rg -n "\.opencode/easycode\.json|~/.config/opencode/|worktree|project directory|fallback|override|deep merge|deep-merg" README.md`.
  4. Run `rg -n "every request always runs every stage|all requests must go through every stage|strict chain enforced for every request" README.md` and confirm no matches.
  5. Read the workflow and config sections and compare their exact wording against `src/agents/prompt-text/orchestrator-prompt.md`, `src/index.ts`, `src/easycode-config.ts`, `src/config-handler.ts`, and the listed tests.
  6. Run `bun run typecheck`.
- Expected Result:
  - section order is product-first;
  - `current_time` is included in the built-ins inventory;
  - built-in vs optional MCP wording is correct;
  - `.opencode/easycode.json` is documented and `~/.config/opencode/` is explicitly unsupported;
  - precedence/override wording matches source/tests;
  - banned workflow phrasing is absent;
  - `bun run typecheck` passes.

## QA / Verification

- Run `rg -n "^#|^##" README.md` and confirm the opening order is product/value → built-ins → config → workflow before install/build detail.
- Run `rg -n "current_time|lsp_goto_definition|lsp_find_references|lsp_symbols|lsp_diagnostics|lsp_prepare_rename|lsp_rename|ast_grep_search|ast_grep_replace" README.md` and confirm the full tool inventory is present, including `current_time`.
- Run `rg -n "context7|grep_app|sequential_thinking|websearch" README.md` and confirm built-in vs optional MCP wording is accurate.
- Run `rg -n "\.opencode/easycode\.json|~/.config/opencode/" README.md` and confirm supported and unsupported config paths are stated explicitly.
- Read the config section against `src/index.ts`, `src/easycode-config.ts`, `src/config-handler.ts`, `src/__tests__/easycode-config.test.ts`, `src/__tests__/config-handler.test.ts`, and `src/__tests__/plugin-index.test.ts`. Expected: location, precedence, fallback, and override wording match implementation.
- Run `rg -n "every request always runs every stage|all requests must go through every stage|strict chain enforced for every request" README.md` and confirm zero matches.
- Read the workflow section against `src/agents/prompt-text/orchestrator-prompt.md:52-91`. Expected: the README describes a default/primary workflow path, not a universal guarantee.
- Run `bun run typecheck` from `/Users/mirage/go/src/easycode`. Expected: PASS.

## Save Path

- `/docs/easycode/plans/2026-04-20-readme-product-introduction-repositioning.md`

Plan complete and saved to `/docs/easycode/plans/2026-04-20-readme-product-introduction-repositioning.md`.
