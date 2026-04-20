# GitHub-style EasyCode Installation + Config Fallback Implementation Plan

> **For agentic workers:** REQUIRED IMPLEMENTATION SKILL: Use `materialize` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make EasyCode installable from a GitHub-hosted OpenCode plugin flow while adding `easycode.json` lookup with worktree-local > project-local > global precedence.

**Architecture:** First bound the packaging change with an explicit runtime-file inventory before adopting any source-entry approach, and treat that inventory as a hard gate: if the runtime file set is not narrowly bounded, stop and return for plan revision instead of inventing a broader packaging strategy during execution. Verify Task 1 against both a packed tarball and the exact Bun/OpenCode-style git install spec `easycode-plugin@git+https://github.com/DevNewbie1826/easycode`, and assert that installed config-hook execution still registers bundled skills, bootstrap markdown, and at least one builtin agent. Keep config fallback centralized in `src/easycode-config.ts`, with any global-path override remaining internal-only to loader/config-handler tests and leaving plugin-facing/runtime APIs unchanged. Add one narrow plugin-hook regression through `EasyCodePlugin(...).config` for local > global fallback, and document the GitHub install flow in `README.opencode.md` and `README.md` using the confirmed repository URL `https://github.com/DevNewbie1826/easycode`.

**Tech Stack:** TypeScript, Bun test, Node `fs`/`os`/`path`, OpenCode plugin hooks

---

## Scope

- **In scope**:
  - make the package entry usable from a GitHub-installed OpenCode plugin flow without requiring users to run the local-dev copy script
  - keep or extend automated coverage for install-layout-sensitive behavior, including bundled skills/bootstrap assets
  - add `easycode.json` loading with `worktree local > project local > global` precedence
  - update user docs for GitHub install flow, local-dev flow, and config precedence
- **Out of scope**:
  - unrelated hook/runtime refactors
  - broader config discovery redesign beyond `~/.config/opencode/easycode.json`
  - adding tracked `.opencode/` repo assets or a second installer flow
  - changing agent/MCP merge semantics unrelated to the requested precedence change

## Assumptions

- The intended global fallback path is `~/.config/opencode/easycode.json`.
- A tracked source entry is acceptable only if the Task 1 preflight inventory shows that the required runtime files are already narrowly bounded to the existing plugin source/assets and do not force a broader packaging refactor.
- The final install snippet should use the confirmed repository URL literally: `easycode-plugin@git+https://github.com/DevNewbie1826/easycode`.
- `.opencode/` should remain ignored for local generated plugin copies, so GitHub install support should come from package/docs changes rather than tracked `.opencode/plugins/*` files.

## Source Brief Alignment

- **Goal alignment:** Task 1 makes the package directly loadable from a GitHub install flow and proves bundled skill/bootstrap assets still resolve; Task 2 adds local-over-global config fallback; Task 3 documents both behaviors.
- **Constraint alignment:** The plan keeps config loading centered in `src/easycode-config.ts`, keeps runtime hook behavior intact, avoids unrelated API expansion, and leaves local-dev copy/install behavior available as an explicit separate step.
- **Success criteria alignment:** Task 1 verifies both packed-artifact behavior and the exact Bun git install path with bounded package layout while proving builtin agent assets still load; Task 2 verifies `easycode.json` precedence through loader, handler, and one narrow real plugin-hook regression while keeping the global-path seam internal-only; Task 3 verifies docs explain the exact GitHub install snippet and precedence clearly and reruns runtime regressions.

## Execution Policy

- **Workspace isolation:** use `using-git-worktrees` before implementation begins.
- **Task tracking:** use `todo-sync` before work starts, after each completed task, and after all work is finished.
- **Implementation discipline:** use `test-driven-development` for each code path when feasible.
- **Failure handling:** use `systematic-debugging` before changing code in response to failing tests or unexpected install/layout behavior.
- **Completion path:** after `assay` returns PASS, proceed to `finishing-a-development-branch`.

## File Structure

- Create: `README.opencode.md`
- Create: `src/__tests__/package-entry.test.ts`
- Modify: `package.json:6-29`
- Modify: `README.md:91-105`
- Modify: `README.md:292-438`
- Modify: `src/easycode-config.ts:193-217`
- Modify: `src/config-handler.ts:10-105`
- Modify: `src/__tests__/easycode-config.test.ts:7-535`
- Modify: `src/__tests__/config-handler.test.ts:578-719`
- Modify: `src/__tests__/plugin-index.test.ts:518-671`
- Reference during implementation:
  - `src/index.ts:24-60`
  - `src/hooks/skill-bootstrap/index.ts:37-121`
  - `src/skills/path-registration.ts:8-38`
  - `src/__tests__/plugin-index.test.ts:176-235`
  - `src/__tests__/plugin-index.test.ts:518-670`
  - `src/__tests__/skill-path-registration.test.ts:28-159`

## File Responsibilities

- `README.opencode.md` — OpenCode-specific GitHub install guide, version-pin example, runtime prerequisites, and config precedence reference.
- `src/__tests__/package-entry.test.ts` — regression coverage that the package entry declared in `package.json` is loadable from a clean git checkout and still resolves plugin-owned assets.
- `package.json` — package runtime entry, exported files, and separation between generic build output and local-dev copy/install scripts.
- `README.md` — main project readme that links to GitHub install docs, distinguishes local development from user installation, and states final config precedence.
- `src/easycode-config.ts` — centralized ordered loading/merging for local and global `easycode.json` sources.
- `src/config-handler.ts` — runtime integration layer that passes directory order into the loader and applies loaded config to MCP/agent settings.
- `src/__tests__/easycode-config.test.ts` — unit coverage for loader path resolution, parse/merge rules, and global fallback precedence.
- `src/__tests__/config-handler.test.ts` — handler-level coverage for application-visible precedence after loader changes.
- `src/__tests__/plugin-index.test.ts` — narrow plugin-level regression coverage for `EasyCodePlugin(...).config` using the real plugin hook path.
- `src/index.ts` — reference point for how the plugin constructs hooks from the resolved module directory.
- `src/hooks/skill-bootstrap/index.ts` — reference for markdown asset resolution from the declared package entry.
- `src/skills/path-registration.ts` — reference for bundled skill path resolution from the declared package entry.

## Boundaries

- Do not add tracked `.opencode/plugins/*` files; the repo currently ignores `.opencode/`, and the requested GitHub install flow can be supported through package entry/doc changes instead.
- Do not introduce generalized XDG/env-based config discovery; only the requested `~/.config/opencode/easycode.json` fallback is in scope.
- Do not move config merging logic into hook/bootstrap code; keep config loading separate from unrelated runtime hooks.
- Do not change current local precedence rules: worktree remains higher priority than project, and global remains lowest priority.
- Do not let the package entry change break the existing local-dev `install:local` path; keep it available as an explicit developer-only step.
- Keep any `globalConfigPath` override internal-only to `loadEasyCodeConfig()` / `createConfigHandler()` test plumbing; do not change `EasyCodePlugin(...)` inputs, plugin hooks, or user-facing config to expose it.
- If the Step 1 runtime-file inventory is not narrowly bounded, stop implementation and return for plan revision; do not invent an alternative packaging strategy inside Task 1.

## Task Breakdown

### Task 1: Make the package entry GitHub-installable from a clean checkout

**Files:**
- Create: `src/__tests__/package-entry.test.ts`
- Modify: `package.json:6-29`
- Reference: `src/index.ts:24-60`
- Reference: `src/hooks/skill-bootstrap/index.ts:37-121`
- Reference: `src/skills/path-registration.ts:8-38`

- [ ] **Step 1: Run a preflight runtime-file inventory before choosing a source-entry approach**

Inventory the exact files that would have to ship if `package.json` points at tracked source instead of `dist/index.js`. Explicitly list every runtime-imported file family touched by the current entry path and its asset resolvers, including `src/index.ts`, `src/config-handler.ts`, `src/easycode-config.ts`, `src/agents/**`, `src/hooks/**`, `src/mcp/**`, `src/tools/**`, `src/skills/**`, and any prompt/markdown assets those paths load at runtime. Compare that inventory to `package.json.files`, and record the bounded delta before changing the package entry. Treat this as a hard gate: if the inventory requires a broader packaging redesign than the brief allows, stop Task 1 and return for plan revision instead of inventing a new packaging strategy during execution.

- [ ] **Step 2: Write the failing package-entry regression test**

Create `src/__tests__/package-entry.test.ts` with a clean-checkout assertion that reads `package.json`, resolves the declared package runtime entry (`main` plus `exports["."].import`), and proves the declared file exists before any build runs. In the same test file, dynamically import that declared entry, instantiate the default plugin with minimal fake `PluginInput`, run the returned `config` hook on an empty config object, and assert `config.skills.paths` includes the repository `src/skills` directory. Add a bootstrap assertion that runs `experimental.chat.messages.transform` on one user message and confirms the text injected from `src/hooks/skill-bootstrap/skill-bootstrap.md` contains `<SESSION_BOOTSTRAP_MANDATORY>`.

- [ ] **Step 3: Run the new package-entry test and confirm failure**

Run: `bun test src/__tests__/package-entry.test.ts`
Expected: FAIL because `package.json` currently declares `./dist/index.js`, `dist/` is gitignored in a clean checkout, and the declared package entry cannot be imported without running the local build first.

- [ ] **Step 4: Switch the package flow only within the bounded inventory**

Update `package.json` so the runtime entry used by GitHub/OpenCode installs points at a tracked source file only if Step 1 proved the runtime-file set is narrowly bounded. Expand `files` only to the exact inventory recorded in Step 1 so every runtime-imported source file and asset needed by that entry is included in a git-installed package. In the same edit, separate the generic build from the local-dev copy step: `build` should only create `dist/` artifacts, while local copy/install remains an explicit follow-up command such as `build:local` or `bun run build && bun run install:local`. Keep `install:local` for developer testing, but do not make GitHub installation depend on it.

- [ ] **Step 5: Verify real packed/install behavior, exact Bun git install behavior, and build-flow behavior**

Run:
  1. `bun test src/__tests__/package-entry.test.ts`
  2. `TARBALL=$(npm pack --silent)`
  3. `TMPDIR=$(mktemp -d) && npm init -y --prefix "$TMPDIR" && npm install --prefix "$TMPDIR" "/Users/mirage/go/src/easycode/$TARBALL"`
  4. `bun --cwd "$TMPDIR" -e 'const { default: EasyCodePlugin } = await import("easycode-plugin"); const hooks = await EasyCodePlugin({ client: { app: { log() { return Promise.resolve() } } }, project: "test-project", directory: process.cwd(), worktree: process.cwd(), serverUrl: new URL("https://example.com"), $: {} }, {}); const config = {}; await hooks.config?.(config); if (!Array.isArray(config.skills?.paths) || config.skills.paths.length === 0) throw new Error("skills path missing"); if (!config.agent || typeof config.agent !== "object" || !config.agent.orchestrator) throw new Error("builtin agent missing"); const output = { messages: [{ info: { id: "user-1", sessionID: "session-1", role: "user", time: { created: 1 }, agent: "coder", model: { providerID: "test", modelID: "test" } }, parts: [{ id: "part-1", sessionID: "session-1", messageID: "user-1", type: "text", text: "hello" }] }] }; await hooks["experimental.chat.messages.transform"]?.({}, output); if (!output.messages[0].parts[0].text.includes("<SESSION_BOOTSTRAP_MANDATORY>")) throw new Error("bootstrap missing");'`
  5. `GITTMP=$(mktemp -d) && cat > "$GITTMP/package.json" <<'EOF'
{
  "name": "easycode-git-install-check",
  "private": true,
  "dependencies": {
    "easycode-plugin": "git+https://github.com/DevNewbie1826/easycode"
  }
}
EOF
  && bun install --cwd "$GITTMP"`
  6. `bun --cwd "$GITTMP" -e 'const { default: EasyCodePlugin } = await import("easycode-plugin"); const hooks = await EasyCodePlugin({ client: { app: { log() { return Promise.resolve() } } }, project: "test-project", directory: process.cwd(), worktree: process.cwd(), serverUrl: new URL("https://example.com"), $: {} }, {}); const config = {}; await hooks.config?.(config); if (!Array.isArray(config.skills?.paths) || config.skills.paths.length === 0) throw new Error("skills path missing"); if (!config.agent || typeof config.agent !== "object" || !config.agent.orchestrator) throw new Error("builtin agent missing"); const output = { messages: [{ info: { id: "user-1", sessionID: "session-1", role: "user", time: { created: 1 }, agent: "coder", model: { providerID: "test", modelID: "test" } }, parts: [{ id: "part-1", sessionID: "session-1", messageID: "user-1", type: "text", text: "hello" }] }] }; await hooks["experimental.chat.messages.transform"]?.({}, output); if (!output.messages[0].parts[0].text.includes("<SESSION_BOOTSTRAP_MANDATORY>")) throw new Error("bootstrap missing");'`
  7. `bun run build`

Expected: the package-entry test PASSes from a clean checkout without requiring `dist/index.js`; the packed tarball installs into a temporary consumer project; the installed package can be imported from `node_modules`; its config hook still registers bundled skills, injects at least one builtin agent such as `orchestrator`, and injects the bootstrap markdown marker; the exact Bun git dependency install path using `easycode-plugin@git+https://github.com/DevNewbie1826/easycode` succeeds and produces the same runtime behavior when the tested revision is reachable at that canonical URL; and `bun run build` produces `dist/index.js`/`dist/index.d.ts` without also creating `.opencode/plugins/easycode.ts` as a side effect.

- [ ] **Step 6: Verify the local-dev copy flow still works, then commit**

Run: `bun run install:local`
Expected: PASS and `.opencode/plugins/easycode.ts` is created only when this explicit developer command is invoked.

```bash
git add package.json src/__tests__/package-entry.test.ts
git commit -m "feat: support github-installed package entry"
```

**QA / Verification**
- Tool: `bun test`, `npm pack`, `npm install`, `bun install`, `bun run build`, `bun run install:local`
- Steps:
  1. Run `bun test src/__tests__/package-entry.test.ts`.
  2. Run `npm pack --silent` and install the resulting tarball into a fresh temporary consumer directory with `npm install --prefix "$TMPDIR" "/Users/mirage/go/src/easycode/$TARBALL"`.
  3. From that consumer directory, run the `bun --cwd "$TMPDIR" -e '...'` import check from Step 5 and confirm `config.agent.orchestrator` exists after `hooks.config?.(config)`.
  4. Create a fresh temporary consumer project with dependency spec `easycode-plugin@git+https://github.com/DevNewbie1826/easycode`, run `bun install --cwd "$GITTMP"`, and run the matching `bun --cwd "$GITTMP" -e '...'` import check from Step 5. If the tested revision is not yet reachable at that canonical URL, pause Task 1 completion and return for coordination rather than substituting a different install path.
  5. Run `bun run build`.
  6. Confirm `dist/index.js` exists after the build.
  7. Confirm `.opencode/plugins/easycode.ts` does not exist until `bun run install:local` is run.
  8. Run `bun run install:local` and confirm `.opencode/plugins/easycode.ts` is then created.
- Expected Result: the declared package entry is loadable from a clean checkout, the packed artifact installs and runs correctly from a consumer project, the exact Bun git install spec follows the same dependency path OpenCode uses, plugin hooks still resolve bundled skills/bootstrap assets and at least one builtin agent after installation, build output is produced without local-install side effects, and the explicit local-dev copy flow still works.

### Task 2: Add `worktree > project > global` easycode.json fallback

**Files:**
- Modify: `src/easycode-config.ts:193-217`
- Modify: `src/config-handler.ts:10-105`
- Modify: `src/__tests__/easycode-config.test.ts:7-535`
- Modify: `src/__tests__/config-handler.test.ts:578-719`
- Modify: `src/__tests__/plugin-index.test.ts:518-671`
- Reference: `src/index.ts:47-49`

- [ ] **Step 1: Write failing loader, handler, and one narrow plugin-hook regression for the global fallback**

Add focused tests in `src/__tests__/easycode-config.test.ts` for these exact cases:
- default global path resolves to `join(homedir(), ".config", "opencode", "easycode.json")`
- no local config present → valid global config is loaded
- invalid worktree/project config falls through to a valid global config
- valid worktree config beats project and global for the same section
- valid project config beats global when worktree is absent
- invalid global config behaves the same as an absent global file

Add matching handler-level tests in `src/__tests__/config-handler.test.ts` that call `createConfigHandler()` with an internal-only `globalConfigPath` override in options and assert application-visible behavior through final MCP/agent config output, not just raw loader data. Keep that override confined to internal loader/config-handler test plumbing; do not change `EasyCodePlugin(...)`, documented user config, or any plugin-facing runtime hook shape.

Add one narrow plugin-level regression in `src/__tests__/plugin-index.test.ts` that exercises the real `EasyCodePlugin(...).config` hook path without any new plugin-facing options. Use a temporary home directory containing `~/.config/opencode/easycode.json` plus a temporary local worktree `.opencode/easycode.json`, invoke the plugin’s returned `config` hook, and assert the final visible runtime config follows local > global precedence through the actual plugin hook path.

- [ ] **Step 2: Run the targeted tests and confirm failure**

Run:
  1. `bun test src/__tests__/easycode-config.test.ts`
  2. `bun test src/__tests__/config-handler.test.ts`
  3. `bun test src/__tests__/plugin-index.test.ts`

Expected: FAIL because the loader currently only checks `<directory>/.opencode/easycode.json`, `createConfigHandler()` has no way to thread a global fallback path into loader tests, and the real plugin hook path has no global fallback coverage yet.

- [ ] **Step 3: Implement the minimal centralized fallback**

Update `src/easycode-config.ts` so `loadEasyCodeConfig()` preserves caller-provided local directory order, appends a lowest-priority global candidate built from `join(homedir(), ".config", "opencode", "easycode.json")`, and skips missing/invalid/empty global config the same way it already skips local config files. Add one explicit internal-only options seam for tests to override `globalConfigPath`, then update `src/config-handler.ts` to pass that option through while keeping its responsibility limited to `[worktreeOrDirectory, fallbackDirectory]` ordering and final config application. Do not thread this seam through `src/index.ts` or the exported plugin API unless implementation proves it is absolutely unavoidable.

- [ ] **Step 4: Re-run the targeted tests and confirm success**

Run:
  1. `bun test src/__tests__/easycode-config.test.ts`
  2. `bun test src/__tests__/config-handler.test.ts`
  3. `bun test src/__tests__/plugin-index.test.ts`

Expected: PASS with coverage proving `worktree > project > global` precedence, correct fallback from invalid local config to valid global config, one real plugin-hook regression through `EasyCodePlugin(...).config`, and no change to existing agent/MCP merge semantics beyond the new source order.

- [ ] **Step 5: Commit the precedence change**

```bash
git add src/easycode-config.ts src/config-handler.ts src/__tests__/easycode-config.test.ts src/__tests__/config-handler.test.ts src/__tests__/plugin-index.test.ts
git commit -m "feat: add global easycode config fallback"
```

**QA / Verification**
- Tool: `bun test`
- Steps:
  1. Run `bun test src/__tests__/easycode-config.test.ts`.
  2. Run `bun test src/__tests__/config-handler.test.ts`.
  3. Run `bun test src/__tests__/plugin-index.test.ts`.
- Expected Result: loader, handler, and real plugin-hook tests all PASS, the default global path is exactly `~/.config/opencode/easycode.json`, and final runtime behavior is `worktree local > project local > global`.

### Task 3: Document the GitHub install flow and final config precedence

**Files:**
- Create: `README.opencode.md`
- Modify: `README.md:91-105`
- Modify: `README.md:292-438`
- Reference: `package.json:6-29`

- [ ] **Step 1: Capture the current documentation gaps as explicit failing checks**

Before editing docs, confirm the current gaps by checking that `README.opencode.md` does not exist and that `README.md` still states the plugin only reads `.opencode/easycode.json` from local directories. Use those exact missing/outdated statements as the replacement targets for the documentation update.

- [ ] **Step 2: Write `README.opencode.md` for the GitHub/OpenCode install flow**

Create `README.opencode.md` with these exact sections:
- GitHub install snippet using OpenCode’s `plugin` array and the exact repository URL `easycode-plugin@git+https://github.com/DevNewbie1826/easycode`
- optional version pin example using `#tag`
- note that EasyCode self-registers bundled skills; users do not need to manually add `skills.paths`
- runtime prerequisites (`sg`, language servers, `npx`)
- config precedence summary: worktree `.opencode/easycode.json` → project `.opencode/easycode.json` → `~/.config/opencode/easycode.json`
- local-development note clarifying that `install:local` is for repository development, not normal GitHub installation

- [ ] **Step 3: Update `README.md` so local-dev instructions and config docs match the new behavior**

Update `README.md` to:
- link readers to `README.opencode.md` for the GitHub install flow
- replace the current “Only `.opencode/easycode.json` is supported” statement with the final precedence order
- revise the build/install section so `bun run build` is a build step and the local copy command is an explicit separate developer action
- keep the existing local-development guidance intact for contributors

- [ ] **Step 4: Run documentation and regression verification**

Run:
  1. `bun test src/__tests__/package-entry.test.ts src/__tests__/easycode-config.test.ts src/__tests__/config-handler.test.ts src/__tests__/plugin-index.test.ts src/__tests__/skill-path-registration.test.ts`
  2. `bun run typecheck`
  3. `grep -n "easycode-plugin@git+https://github.com/DevNewbie1826/easycode" README.opencode.md README.md`
  4. `grep -n "~/.config/opencode/easycode.json" README.opencode.md README.md`
  5. `grep -n "install:local" README.opencode.md README.md package.json`

Expected: the targeted regression suite PASSes, typecheck PASSes, both docs contain the exact final install snippet `easycode-plugin@git+https://github.com/DevNewbie1826/easycode`, both readmes describe the global fallback path, and local-dev copy instructions appear only as an explicit developer step.

- [ ] **Step 5: Commit the docs update**

```bash
git add README.opencode.md README.md
git commit -m "docs: add opencode install guide and config precedence"
```

**QA / Verification**
- Tool: `bun test`, `bun run typecheck`, `grep`
- Steps:
  1. Run `bun test src/__tests__/package-entry.test.ts src/__tests__/easycode-config.test.ts src/__tests__/config-handler.test.ts src/__tests__/plugin-index.test.ts src/__tests__/skill-path-registration.test.ts`.
  2. Run `bun run typecheck`.
  3. Run `grep -n "easycode-plugin@git+https://github.com/DevNewbie1826/easycode" README.opencode.md README.md`.
  4. Run `grep -n "~/.config/opencode/easycode.json" README.opencode.md README.md`.
  5. Run `grep -n "install:local" README.opencode.md README.md package.json`.
- Expected Result: regression tests and typecheck PASS, `README.opencode.md` exists, both docs contain the exact final install snippet built from the confirmed URL, `README.md` no longer claims global config is unsupported, and both docs consistently describe the explicit local-dev copy flow.

## QA / Verification

- Run `bun test src/__tests__/package-entry.test.ts` and confirm PASS. Expected: the package entry declared in `package.json` exists in a clean checkout, can be imported directly, registers `src/skills`, and injects bootstrap markdown.
- Run `npm pack --silent`, install the resulting tarball into a fresh temporary consumer project, and execute the Task 1 installed-package import check. Expected: the packed artifact, not just the repo checkout, resolves bundled skills/bootstrap assets and at least one builtin agent correctly after installation.
- Run a fresh Bun git dependency install using dependency spec `easycode-plugin@git+https://github.com/DevNewbie1826/easycode` in a temporary consumer project, then execute the Task 1 installed-package import check. Expected: the same path OpenCode/Bun uses for git installs resolves bundled skills/bootstrap assets and at least one builtin agent correctly.
- Run `bun test src/__tests__/easycode-config.test.ts src/__tests__/config-handler.test.ts` and confirm PASS. Expected: config loading follows `worktree local > project local > global` and ignores missing/invalid global files.
- Run `bun test src/__tests__/plugin-index.test.ts src/__tests__/skill-path-registration.test.ts` and confirm PASS. Expected: existing copied/package-layout runtime behavior still works after the package-entry and precedence changes, and the new plugin-hook fallback regression passes.
- Run `bun run typecheck` and confirm PASS. Expected: package/config signature changes remain type-safe.
- Run `grep -n "easycode-plugin@git+https://github.com/DevNewbie1826/easycode" README.opencode.md README.md && grep -n "~/.config/opencode/easycode.json" README.opencode.md README.md` and confirm PASS. Expected: docs clearly explain the exact GitHub install snippet and config precedence.

## Save Path

- `/docs/easycode/plans/2026-04-20-github-style-install-and-config-fallback.md`

Plan complete and saved to `/docs/easycode/plans/2026-04-20-github-style-install-and-config-fallback.md`.

Next step: use `using-git-worktrees` to prepare the isolated workspace, then start `materialize` with this plan.

Would you like to start implementation with `materialize` based on this plan?
