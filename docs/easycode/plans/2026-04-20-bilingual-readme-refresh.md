# Bilingual README Refresh Implementation Plan

> **For agentic workers:** REQUIRED IMPLEMENTATION SKILL: Use `materialize` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `README.md` as one bilingual, evidence-based guide for `easycode-plugin` that clearly explains purpose, value, setup, configuration, built-in capabilities, workflow, and usage guidance.

**Architecture:** Keep the change limited to `README.md`, using repository code, tests, and existing docs as the evidence boundary for every claim. Preserve valid existing README material, add the missing user-facing workflow and capability guidance, and exclude internal-only control details that do not belong in user documentation.

**Tech Stack:** Markdown, Bun scripts, TypeScript source files, repository tests/docs

---

## Scope

- Update only `README.md`.
- Keep one bilingual document.
- Cover project purpose, value, install/build/use flow, `.opencode/easycode.json`, major features, built-in MCP/tools/agents, workflow chain, advantages, and practical usage guidance.
- Keep all wording evidence-based and user-facing.

## Out of Scope

- Any code, test, config, or runtime behavior changes.
- Adding a second README unless implementation evidence forces it.
- Publishing raw prompt text, internal control-block markup, or hidden orchestration rules verbatim in the README.
- Claiming unsupported config semantics, defaults, `variant` values, or `color` meanings.
- Creating git commits as part of this plan.

## Assumptions

- A section-paired bilingual layout is acceptable and easier to maintain than separate language blocks.
- “Comprehensive” means broad coverage of verified user-relevant behavior, not a dump of all internal implementation details.
- If config semantics cannot be documented precisely from source and tests, the README should stay at schema-only depth for that area.

## Source Brief Alignment

- **Purpose/value/advantages** → Task 2 rewrites the introduction and capability summary.
- **Install/build/use flow** → Task 1 verifies commands and local install flow from `package.json` and `AGENTS.md`; Task 2 documents only that verified flow.
- **`.opencode/easycode.json`** → Task 1 explicitly decides schema-only vs schema+selected behaviors based on source and tests.
- **Major features/MCP/tools/agents** → Task 1 verifies canonical inventories from tool, MCP, registry, and agent files; Task 2 documents only verified capabilities.
- **Workflow chain/supporting guidance** → Task 1 verifies chain and supporting skills; Task 2 converts them into user-facing guidance.
- **Evidence discipline** → Task 1 builds an evidence ledger before prose rewrite.
- **Single bilingual README** → Task 2 enforces parity through a section map and terminology lock.

## File Structure

- Modify: `README.md:1-182`
- Reference during implementation:
  - `README.md:1-182`
  - `package.json:1-45`
  - `AGENTS.md:1-6`
  - `src/index.ts:1-60`
  - `src/config-handler.ts:1-148`
  - `src/easycode-config.ts:1-217`
  - `src/agents/builtin-policy.ts:1-93`
  - `src/agents/registry.ts:1-91`
  - `src/agents/definitions/*.agent.ts`
  - `src/agents/prompt-text/orchestrator-prompt.md:58-142`
  - `src/mcp/index.ts:1-38`
  - `src/mcp/websearch.ts:1-26`
  - `src/tools/index.ts:1-25`
  - `src/tools/ast/sg.ts:1-218`
  - `src/tools/lsp/registry.ts:1-107`
  - `src/skills/path-registration.ts:1-38`
  - `src/hooks/skill-bootstrap/index.ts:1-121`
  - `src/hooks/skill-bootstrap/skill-bootstrap.md:1-136`
  - `src/__tests__/easycode-config.test.ts`
  - `src/__tests__/config-handler.test.ts`
  - `src/__tests__/plugin-index.test.ts`

## File Responsibilities

- `README.md` — bilingual user-facing onboarding and usage guide.
- `package.json` — authoritative build, typecheck, and local install commands.
- `AGENTS.md` — concise repo authority for package name, entry point, build outputs, and local copy/install note.
- `src/easycode-config.ts` — canonical config schema and normalization behavior.
- `src/config-handler.ts` — how user config merges into MCP/agent/skill-path registration.
- `src/agents/builtin-policy.ts` — evidence for plugin-owned permission/disable behavior if README documents selected semantics.
- `src/agents/registry.ts` + `src/agents/definitions/*.agent.ts` — canonical built-in agent inventory and descriptions.
- `src/agents/prompt-text/orchestrator-prompt.md` — canonical workflow chain and supporting skills.
- `src/mcp/*.ts` — canonical built-in and optional MCP definitions.
- `src/tools/index.ts` — canonical tool registry exposed by the plugin.
- `src/tools/ast/sg.ts` — evidence for ast-grep scope, runtime requirements, and supported AST languages.
- `src/tools/lsp/registry.ts` — evidence for LSP capability breadth and runtime dependency wording.
- `src/skills/path-registration.ts` — evidence for plugin skill-path registration.
- `src/hooks/skill-bootstrap/*` — evidence boundary for any bootstrap mention.
- `src/__tests__/*.test.ts` — evidence for selected documented semantics that should not rely on source reading alone.

## Boundaries

- README must stay user-facing: describe capabilities, workflow, and supported config surface without reproducing internal prompts or XML-like bootstrap/control blocks.
- Use internal files to support user documentation, not to expose internal operating instructions verbatim.
- If a claim is useful but not directly source-backed, omit it.

## Bilingual Controls

### Section Map

Use the same EN/KR pair order for every major section:
1. Overview / 개요
2. Why EasyCode / 왜 EasyCode인가
3. Features and built-ins / 주요 기능과 내장 구성
4. Install, build, and local use / 설치, 빌드, 로컬 사용
5. Configuration / 설정
6. Agents and workflow / 에이전트와 워크플로우
7. Usage guidance / 사용 가이드
8. Development notes / 개발 메모

### Terminology Lock

- Keep product and file names untranslated: `easycode-plugin`, `README.md`, `.opencode/easycode.json`, `.opencode/plugins/easycode.ts`.
- Keep tool, MCP, agent, and skill names untranslated.
- Use one consistent Korean rendering for core concepts across the file: workflow, built-in, config, hook, bootstrap, permission.
- If a term has no clean Korean equivalent, keep the English token and explain it once.

## Task Breakdown

### Task 1: Build the evidence ledger and choose documentation depth

**Files:**
- Modify: `README.md:1-182` (working outline only until evidence is locked)
- Test/Reference: all files listed in **File Structure**

- [ ] **Step 1: Create an evidence ledger mapped to planned README sections**

Build a working ledger with columns:
- README section
- claim summary
- source files
- exact behavior vs schema-only
- include / exclude decision

Start the ledger with these sections:
- overview/value
- tools/features
- install/build/local use
- configuration
- built-in agents
- workflow chain
- supporting skills/guidance
- bootstrap note

- [ ] **Step 2: Verify build/install authority from repo docs, not runtime wiring**

Read:
- `package.json`
- `AGENTS.md`

Expected: README install/build/local copy flow is sourced from these files; do not treat `src/index.ts` as the authority for build/install commands.

- [ ] **Step 3: Verify feature/tool evidence surface**

Read:
- `src/tools/index.ts`
- `src/tools/ast/sg.ts`
- `src/tools/lsp/registry.ts`
- `src/mcp/index.ts`
- `src/mcp/websearch.ts`

Expected: confirm the exact tool registry, ast-grep/LSP capability wording limits, runtime requirement wording, and built-in MCP inventory.

- [ ] **Step 4: Verify config schema and make the depth decision**

Read:
- `src/easycode-config.ts`
- `src/config-handler.ts`

Then decide one of two documentation depths:
- **Schema-only**: file path, top-level keys, supported fields, and safe examples only.
- **Schema + selected behaviors**: only if the behavior is directly supported by code and tests.

If selecting **schema + selected behaviors**, verify additionally against:
- `src/agents/builtin-policy.ts`
- `src/__tests__/easycode-config.test.ts`
- `src/__tests__/config-handler.test.ts`
- `src/__tests__/plugin-index.test.ts`

Expected: any documented semantics are narrowly phrased and source-backed.

- [ ] **Step 5: Verify agents, workflow, and bootstrap boundaries**

Read:
- `src/agents/registry.ts`
- `src/agents/definitions/*.agent.ts`
- `src/agents/prompt-text/orchestrator-prompt.md`
- `src/skills/path-registration.ts`
- `src/index.ts`
- `src/hooks/skill-bootstrap/index.ts`
- `src/hooks/skill-bootstrap/skill-bootstrap.md`

Expected: confirm built-in agent inventory, workflow chain, supporting skills, skill registration, and whether a short user-facing bootstrap note is safe. Do not include raw prompt rules or internal control-block details.

### Task 2: Rewrite `README.md` in one bilingual, parity-controlled structure

**Files:**
- Modify: `README.md:1-182`
- Test: section-by-section review against the evidence ledger

- [ ] **Step 1: Replace the README with the section map defined above**

Use paired EN/KR content for each section so both languages cover the same claims in the same order.

- [ ] **Step 2: Reuse and upgrade valid existing material**

Preserve and improve verified existing content on:
- LSP tools
- AST-grep tools
- MCP/runtime requirements
- agent permission/config guidance
- layout and local development

Expected: useful existing material stays, but the README now clearly adds value proposition, workflow, agent summaries, and usage guidance.

- [ ] **Step 3: Keep config wording within the chosen depth**

Always document:
- config path `.opencode/easycode.json`
- top-level keys `agent` and `mcp`
- supported agent fields and supported `mcp.websearch` fields

Only document behaviors if Task 1 selected **schema + selected behaviors** and the evidence ledger cites the supporting tests/source.

- [ ] **Step 4: Keep workflow and bootstrap wording user-facing**

Include:
- built-in MCP/tools/agents summaries
- primary workflow chain
- supporting skills as practical guidance

Exclude:
- raw internal prompt instructions
- XML/control-block markup
- internal-only enforcement details that do not help users operate the plugin

- [ ] **Step 5: Enforce bilingual terminology lock before finalizing prose**

Review every EN/KR pair for:
- same scope
- same claims
- same named entities
- consistent translated terminology

## QA / Verification

- Run `bun run typecheck` from `/Users/mirage/go/src/easycode` and confirm PASS. Expected: docs-only change does not break the repo.
- Verify the evidence ledger is complete before final README sign-off. Expected: every README section has cited source files and an include/exclude decision.
- Compare the README features section against `src/tools/index.ts`, `src/tools/ast/sg.ts`, `src/tools/lsp/registry.ts`, `src/mcp/index.ts`, and `src/mcp/websearch.ts`. Expected: all documented tools/MCPs are source-backed and wording does not exceed evidence.
- Verify install/build/local install wording only against `package.json` and `AGENTS.md`. Expected: README reflects `bun run build`, `dist/index.js`, `dist/index.d.ts`, and copying to `.opencode/plugins/easycode.ts` without attributing command authority to `src/index.ts`.
- Verify config documentation against `src/easycode-config.ts` and `src/config-handler.ts`; if behaviors are documented, also verify them against `src/agents/builtin-policy.ts`, `src/__tests__/easycode-config.test.ts`, `src/__tests__/config-handler.test.ts`, and `src/__tests__/plugin-index.test.ts`. Expected: no unsupported top-level keys, defaults, `variant` enums, or `color` meanings.
- Compare agent/workflow sections against `src/agents/registry.ts`, `src/agents/definitions/*.agent.ts`, `src/agents/prompt-text/orchestrator-prompt.md`, and `src/skills/path-registration.ts`. Expected: all listed agents, workflow stages, and supporting skills are source-backed.
- Verify any bootstrap mention against `src/index.ts` and `src/hooks/skill-bootstrap/*`. Expected: wording stays high-level and user-facing; no raw control-block or prompt-rule transcription.
- Perform final bilingual parity QA in rendered Markdown. Expected: each EN section has a matching KR section with the same claims, terminology, examples, and constraints.

## Save Path

- `/docs/easycode/plans/2026-04-20-bilingual-readme-refresh.md`

Plan complete and saved to `/docs/easycode/plans/2026-04-20-bilingual-readme-refresh.md`.

Would you like to start implementation with `materialize` based on this plan?
