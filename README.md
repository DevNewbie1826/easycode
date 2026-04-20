# EasyCode Plugin Base

OpenCode plugin scaffold for local code intelligence through multi-language LSP tools and AST-aware search and replace.

---

# EasyCode 플러그인 베이스

다중 언어 LSP 도구와 AST 인식 검색 및 교체를 통해 로컬 코드 인텔리전스를 제공하는 OpenCode 플러그인 스캐폴딩입니다.

---

## 1. Overview / 개요

EasyCode is an OpenCode plugin that adds code-intelligence tools to every session. It provides LSP-based navigation and search across many languages, AST-aware code search and replacement, builtin MCP servers for web search and external reference, and a structured workflow orchestrator that guides requests from clarification to final validation.

The plugin is configured through `.opencode/easycode.json` in the worktree or project directory. No external services are required for the core LSP and ast-grep tools.

EasyCode는 모든 세션에 코드 인텔리전스 도구를 추가하는 OpenCode 플러그인입니다. 다중 언어에 대한 LSP 기반 탐색 및 검색, AST 인식 코드 검색 및 교체, 웹 검색 및 외부 참조를 위한 내장 MCP 서버, 그리고 명확한 설명에서 최종 검증까지 요청을 안내하는 구조화된 워크플로우 오케스트레이터를 제공합니다.

플러그인은 워크트리 또는 프로젝트 디렉터리의 `.opencode/easycode.json`을 통해 구성됩니다. 핵심 LSP 및 ast-grep 도구에 외부 서비스가 필요하지 않습니다.

---

## 2. Why EasyCode / 왜 EasyCode인가

- **Multi-language LSP in every session** — Jump to definition, find references, list symbols, run diagnostics, and rename across many languages without leaving OpenCode.
- **AST-aware search and replace** — Search code by AST pattern instead of regex, apply safe replacements that respect language syntax.
- **Builtin MCP servers** — context7, grep_app, and sequential thinking are registered automatically. Web search via Exa is available with a single config entry.
- **Structured workflow** — The orchestrator enforces a strict skill chain (`lucidify → crystallize → using-git-worktrees → materialize → assay → finishing-a-development-branch`) so every request follows a consistent path from clarification to verified completion.
- **Declarative agent config** — Control per-agent model, temperature, color, and permission rules through `.opencode/easycode.json`.

- **멀티 언어 LSP** — OpenCode를 벗어나지 않고도 여러 언어에서 정의로 이동, 참조 찾기, 심볼 나열, 진단 실행, 이름 변경을 할 수 있습니다.
- **AST 인식 검색 및 교체** — 정규식 대신 AST 패턴으로 코드를 검색하고, 언어 구문을 존중하는 안전한 교체를 적용합니다.
- **내장 MCP 서버** — context7, grep_app, sequential thinking이 자동으로 등록됩니다. Exa를 통한 웹 검색은 하나의 설정 항목으로 사용 가능합니다.
- **구조화된 워크플로우** — 오케스트레이터가 엄격한 스킬 체인(`lucidify → crystallize → using-git-worktrees → materialize → assay → finishing-a-development-branch`)을 적용하여 모든 요청이 명확한 설명에서 검증된 완료까지 일관된 경로를 따릅니다.
- **선언적 에이전트 설정** — `.opencode/easycode.json`을 통해 에이전트별 모델, 온도, 색상, 권한 규제를 제어할 수 있습니다.

---

## 3. Features and built-ins / 주요 기능과 내장 구성

### LSP tools / LSP 도구

| Tool | Description |
|------|-------------|
| `lsp_goto_definition` | Jump to symbol definition |
| `lsp_find_references` | Find all references to a symbol |
| `lsp_symbols` | List symbols in a file |
| `lsp_diagnostics` | Show compiler/linter diagnostics |
| `lsp_prepare_rename` | Check if a symbol can be renamed safely |
| `lsp_rename` | Rename a symbol across the codebase |

### LSP 도구

| 도구 | 설명 |
|------|------|
| `lsp_goto_definition` | 심볼 정의로 이동 |
| `lsp_find_references` | 심볼에 대한 모든 참조 찾기 |
| `lsp_symbols` | 파일의 심볼 나열 |
| `lsp_diagnostics` | 컴파일러/린터 진단 표시 |
| `lsp_prepare_rename` | 심볼의 이름 변경이 안전한지 확인 |
| `lsp_rename` | 코드베이스 전체에서 심볼 이름 변경 |

### AST tools / AST 도구

| Tool | Description |
|------|-------------|
| `ast_grep_search` | Search code by AST pattern |
| `ast_grep_replace` | Replace code by AST pattern |

### AST 도구

| 도구 | 설명 |
|------|------|
| `ast_grep_search` | AST 패턴으로 코드 검색 |
| `ast_grep_replace` | AST 패턴으로 코드 교체 |

### Builtin MCP servers / 내장 MCP 서버

| Server | Type | Description |
|--------|------|-------------|
| `context7` | remote | Context7 code intelligence |
| `grep_app` | remote | Grep.app code search |
| `sequential_thinking` | local | npx -y @modelcontextprotocol/server-sequential-thinking |
| `websearch` | remote | Exa web search (optional, configured via `.opencode/easycode.json`) |

### 내장 MCP 서버

| 서버 | 유형 | 설명 |
|------|------|------|
| `context7` | 원격 | Context7 코드 인텔리전스 |
| `grep_app` | 원격 | Grep.app 코드 검색 |
| `sequential_thinking` | 로컬 | npx -y @modelcontextprotocol/server-sequential-thinking |
| `websearch` | 원격 | Exa 웹 검색 (선택적, `.opencode/easycode.json`을 통해 구성) |

### Skill bootstrap / 스킬 부트스트랩

On the first user message of every session, the plugin prepends a bootstrap guidance block that reminds agents to check for applicable skills before acting. This ensures skill-first behavior is applied consistently across the workflow chain.

모든 세션의 첫 번째 사용자 메시지에서, 플러그인은 에이전트가 행동하기 전에 적용 가능한 스킬을 확인하도록 상기시키는 부트스트랩 안내 블록을 앞에 붙입니다. 이를 통해 워크플로우 체인 전반에 걸쳐 스킬 우선 동작이 일관되게 적용됩니다.

---

## 4. Install, build, and local use / 설치, 빌드, 로컬 사용

### Build authority / 빌드 권한

**package.json** declares the build and install scripts:

```json
{
  "name": "easycode-plugin",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "bun run build:js && bun run build:types && bun run install:local",
    "build:js": "bun build src/index.ts --outdir dist --target bun --external @opencode-ai/plugin",
    "build:types": "tsc --emitDeclarationOnly",
    "install:local": "mkdir -p .opencode/plugins && cp dist/index.js .opencode/plugins/easycode.ts"
  }
}
```

### 빌드 권한

**package.json**이 빌드 및 설치 스크립트를 선언합니다:

```json
{
  "name": "easycode-plugin",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "bun run build:js && bun run build:types && bun run install:local",
    "build:js": "bun build src/index.ts --outdir dist --target bun --external @opencode-ai/plugin",
    "build:types": "tsc --emitDeclarationOnly",
    "install:local": "mkdir -p .opencode/plugins && cp dist/index.js .opencode/plugins/easycode.ts"
  }
}
```

### Install steps / 설치 단계

```bash
bun install
bun run build
```

The build output is `dist/index.js` and `dist/index.d.ts`. The `install:local` script copies the built plugin to `.opencode/plugins/easycode.ts`.

빌드 결과물은 `dist/index.js`와 `dist/index.d.ts`입니다. `install:local` 스크립트가 빌드된 플러그인을 `.opencode/plugins/easycode.ts`로 복사합니다.

`AGENTS.md` also confirms the install path: build output is `dist/index.js` and `dist/index.d.ts`, and the local install step copies the built plugin to `.opencode/plugins/easycode.ts`.

`AGENTS.md`는 설치 경로도 확인해 줍니다. 빌드 결과물은 `dist/index.js`와 `dist/index.d.ts`이며, 로컬 설치 단계에서 빌드된 플러그인을 `.opencode/plugins/easycode.ts`로 복사합니다.

### Runtime requirements / 런타임 요구사항

- Install the language servers for the languages you use. The plugin auto-detects which server to use based on file extension and project markers.
- `sg` (`ast-grep`) must be installed globally or available as `@ast-grep/cli` in the workspace.
- The plugin prefers workspace-local binaries in `node_modules/.bin` and falls back to `PATH`.
- `sequential_thinking` runs via `npx`, so `npx` must be available.

### 런타임 요구사항

- 사용하는 언어에 맞는 언어 서버를 설치하세요. 플러그인은 파일 확장자 및 프로젝트 마커를 기반으로 사용할 서버를 자동 감지합니다.
- `sg`(`ast-grep`)는 글로벌로 설치되거나 워크스페이스에서 `@ast-grep/cli`로 사용 가능해야 합니다.
- 플러그인은 `node_modules/.bin`의 워크스페이스 로컬 바이너리를 선호하고 `PATH`로 대체합니다.
- `sequential_thinking`은 `npx`를 통해 실행되므로 `npx`가 사용 가능해야 합니다.

---

## 5. Configuration / 설정

Config file: `.opencode/easycode.json` in the worktree or project directory.

Worktree config takes precedence over project-directory config. Entries in the worktree config fully replace (rather than merge with) fallback entries.

설정 파일: 워크트리 또는 프로젝트 디렉터리의 `.opencode/easycode.json`

워크트리 설정이 프로젝트 디렉터리 설정보다 우선합니다. 워크트리 설정의 항목은 폴백 항목과 병합하지 않고 완전히 대체합니다.

### MCP config / MCP 설정

```json
{
  "mcp": {
    "websearch": {
      "enabled": true,
      "apiKey": "YOUR_EXA_API_KEY"
    }
  }
}
```

| Field | Type | Default | Behavior |
|-------|------|---------|----------|
| `mcp.websearch.enabled` | `boolean` | `true` | Omit or set to `true` to enable. Set to `false` to disable — API key is not embedded in this case. |
| `mcp.websearch.apiKey` | `string` | — | When set and enabled, the API key is embedded in the MCP URL. |

The builtin servers `context7`, `grep_app`, and `sequential_thinking` are always registered and cannot be disabled via config. Existing OpenCode `config.mcp` entries take precedence over plugin defaults.

### MCP 설정

| 필드 | 타입 | 기본값 | 동작 |
|------|------|---------|----------|
| `mcp.websearch.enabled` | `boolean` | `true` | 생략하거나 `true`로 설정하면 활성화. `false`로 설정하면 비활성화 — 이 경우 API 키가 임베디드되지 않습니다. |
| `mcp.websearch.apiKey` | `string` | — | 설정되고 활성화되면 API 키가 MCP URL에 임베디드됩니다. |

내장 서버 `context7`, `grep_app`, `sequential_thinking`은 항상 등록되며 설정을 통해 비활성화할 수 없습니다. 기존 OpenCode `config.mcp` 항목은 플러그인 기본값보다 우선합니다.

### Agent config / 에이전트 설정

```json
{
  "agent": {
    "explorer": {
      "model": "gpt-5.4",
      "variant": "fast",
      "temperature": 0.6,
      "permission": {
        "edit": "deny",
        "bash": {
          "*": "ask",
          "git status*": "allow"
        }
      }
    }
  }
}
```

**Supported agents** — Plugin-managed agents (loaded from `src/agents/definitions/*.agent.ts`):

| Agent | Role |
|-------|------|
| `orchestrator` | Workflow coordinator (question=allow by default) |
| `planner` | Creates implementation plans |
| `plan-checker` | Validates plan readiness |
| `plan-challenger` | Stress-tests plans |
| `explorer` | Codebase discovery (edit=deny, task=deny by default) |
| `librarian` | External reference search (edit=deny, task=deny by default) |
| `code-builder` | Implements tasks (edit=allow, todowrite=allow by default) |
| `code-spec-reviewer` | Checks spec compliance (bash=allow by default) |
| `code-quality-reviewer` | Reviews implementation quality |
| `final-reviewer` | Final PASS/FAIL judgment |
| `completion-verifier` | Runs fresh verification |

**Disable-policy agents**: `explore`, `build`, and `plan` are disabled by default. `general` is enabled by default.

**지원되는 에이전트** — 플러그인 관리 에이전트 (`src/agents/definitions/*.agent.ts`에서 로드됨):

| 에이전트 | 역할 |
|----------|------|
| `orchestrator` | 워크플로우 조정자 (기본값: question=allow) |
| `planner` | 구현 계획 작성 |
| `plan-checker` | 계획 준비 상태 검증 |
| `plan-challenger` | 계획 스트레스 테스트 |
| `explorer` | 코드베이스 탐색 (기본값: edit=deny, task=deny) |
| `librarian` | 외부 참조 검색 (기본값: edit=deny, task=deny) |
| `code-builder` | 작업 구현 (기본값: edit=allow, todowrite=allow) |
| `code-spec-reviewer` | 스펙 준수 확인 (기본값: bash=allow) |
| `code-quality-reviewer` | 구현 품질 검토 |
| `final-reviewer` | 최종 PASS/FAIL 판단 |
| `completion-verifier` | 최신 검증 실행 |

**비활성화 정책 에이전트**: `explore`, `build`, `plan`은 기본적으로 비활성화되어 있습니다. `general`은 기본적으로 활성화되어 있습니다.

**Agent fields** / **에이전트 필드**:

| Field | Type | Constraint | Notes |
|-------|------|------------|-------|
| `model` | `string` | — | Passed through as-is |
| `variant` | `string` | — | Passed through as-is |
| `color` | `string` | — | Non-string values are ignored |
| `temperature` | `number` | `0 ≤ x ≤ 2`, finite | Outside range or NaN is ignored |
| `permission` | `object` | See below | Normalized; invalid entries filtered |

| 필드 | 타입 | 제약조건 | 참고 |
|------|------|----------|------|
| `model` | `string` | — | 있는 그대로 전달 |
| `variant` | `string` | — | 있는 그대로 전달 |
| `color` | `string` | — | 문자열이 아닌 값은 무시됩니다 |
| `temperature` | `number` | `0 ≤ x ≤ 2`, 유한 | 범위 밖이거나 NaN이면 무시됨 |
| `permission` | `object` | 아래 참조 | 정규화됨; 잘못된 항목은 필터링됨 |

**Permission schema** / **권한 스키마**:

```json
{
  "permission": {
    "apply_patch": "allow | ask | deny",
    "ast_grep_replace": "allow | ask | deny",
    "bash": "allow | ask | deny | { \"pattern*\": \"allow | ask | deny\" }",
    "doom_loop": "allow | ask | deny",
    "edit": "allow | ask | deny",
    "external_directory": "allow | ask | deny",
    "lsp_rename": "allow | ask | deny",
    "question": "allow | ask | deny",
    "task": "allow | ask | deny | { \"subagent*\": \"allow | ask | deny\" }",
    "webfetch": "allow | ask | deny"
  }
}
```

Permission rules:
- Root keys: `apply_patch`, `ast_grep_replace`, `bash`, `doom_loop`, `edit`, `external_directory`, `lsp_rename`, `question`, `task`, `webfetch`
- Values: `allow`, `ask`, `deny`
- Each key accepts a scalar or a one-level pattern map: `{ "*": "ask", "git status*": "allow" }`
- Pattern maps deeper than one level are ignored
- `{}` is preserved and clears plugin-owned defaults for that agent
- Unknown keys and invalid values are silently ignored

권한 규칙:
- 루트 키: `apply_patch`, `ast_grep_replace`, `bash`, `doom_loop`, `edit`, `external_directory`, `lsp_rename`, `question`, `task`, `webfetch`
- 값: `allow`, `ask`, `deny`
- 각 키는 스칼라 또는 한 수준 패턴 맵을 허용: `{ "*": "ask", "git status*": "allow" }`
- 한 수준보다 깊은 패턴 맵은 무시됩니다
- `{}`가 보존되어 해당 에이전트의 플러그인 소유 기본값을 지웁니다
- 알 수 없는 키와 잘못된 값은 자동으로 무시됩니다

### Worktree precedence / 워크트리 우선순위

When both worktree and directory have `.opencode/easycode.json`, the worktree config is authoritative for its entries and fully replaces fallback entries (not a deep merge). An empty object `{}` for an agent in the higher-precedence config clears all fallback values for that agent.

워크트리 디렉터리와 일반 디렉터리 모두 `.opencode/easycode.json`을 가지고 있는 경우, 워크트리 설정이 해당 항목에 대해 최종적이며 폴백 항목을 완전히 대체합니다(딥 머지 아님). 상위 우선순위 설정에서 에이전트에 대한 빈 객체 `{}`는 해당 에이전트의 모든 폴백 값을 지웁니다.

> **Secret handling** / **시크릿 처리**: Do not commit `.opencode/easycode.json` if it contains credentials. Add it to `.gitignore`.

---

## 6. Agents and workflow / 에이전트와 워크플로우

### Skill chain / 스킬 체인

The orchestrator runs a strict 6-stage chain:

```
lucidify → crystallize → using-git-worktrees → materialize → assay → finishing-a-development-branch
```

| Stage | Role |
|-------|------|
| `lucidify` | Clarifies vague, ambiguous, or underspecified requests |
| `crystallize` | Produces a hardened Implementation Plan from a Requirements Brief |
| `using-git-worktrees` | Prepares an isolated git worktree for execution |
| `materialize` | Executes the plan through code-builder → code-spec-reviewer → code-quality-reviewer |
| `assay` | Final independent review and PASS/FAIL judgment |
| `finishing-a-development-branch` | Merge, PR, or cleanup after assay PASS |

The orchestrator delegates all substantive work to the appropriate skill or subagent and maintains TODO state throughout.

### 스킬 체인

오케스트레이터가 엄격한 6단계 체인을 실행합니다:

```
lucidify → crystallize → using-git-worktrees → materialize → assay → finishing-a-development-branch
```

| 단계 | 역할 |
|------|------|
| `lucidify` | 모호하거나 불분명하거나 미지정된 요청을 명확히 합니다 |
| `crystallize` | 요구 사항 브리프에서 경화된 구현 계획을 생성합니다 |
| `using-git-worktrees` | 실행을 위해 격리된 git worktree를 준비합니다 |
| `materialize` | code-builder → code-spec-reviewer → code-quality-reviewer를 통해 계획을 실행합니다 |
| `assay` | 최종 독립 검토 및 PASS/FAIL 판단 |
| `finishing-a-development-branch` | assay PASS 후 머지, PR 또는 정리 |

오케스트레이터는 모든 실질적인 작업을 적절한 스킬 또는 하위 에이전트에 위임하고 전 과정에서 TODO 상태를 유지합니다.

### Supporting workflow rules / 보조 워크플로우 규칙

- `todo-sync` synchronizes task state before execution, after each task, and when all work is finished.
- `test-driven-development` is the default discipline for any code changes.
- `systematic-debugging` is required before attempting a fix when tests fail, regressions appear, or validation finds an implementation defect.
- Stage boundaries are enforced: `materialize` starts only after `using-git-worktrees`, `assay` starts only after `materialize`, and branch-finishing starts only after `assay` passes.

### 보조 워크플로우 규칙

- `todo-sync`는 실행 전, 각 작업 후, 모든 작업이 완료될 때 작업 상태를 동기화합니다.
- `test-driven-development`는 모든 코드 변경에 대한 기본 규칙입니다.
- 테스트가 실패하거나 회귀가 나타나거나 검증이 구현 결함을 발견하면 수정 시도 전에 `systematic-debugging`이 필요합니다.
- 단계 경계가 적용됩니다: `materialize`는 `using-git-worktrees` 후에만 시작하고, `assay`는 `materialize` 후에만 시작하며, 브랜치 마무리는 `assay` 통과 후에만 시작합니다.

---

## 7. Usage guidance / 사용 가이드

### Quick start / 빠른 시작

1. Run `bun install && bun run build` to build the plugin.
2. The build step copies the plugin to `.opencode/plugins/easycode.ts`.
3. LSP tools and ast-grep are available in every session immediately.
4. To enable web search, add `.opencode/easycode.json` with your Exa API key.

### 빠른 시작

1. `bun install && bun run build`을 실행하여 플러그인을 빌드합니다.
2. 빌드 단계에서 플러그인이 `.opencode/plugins/easycode.ts`로 복사됩니다.
3. LSP 도구와 ast-grep가 모든 세션에서 즉시 사용 가능합니다.
4. 웹 검색을 사용하려면 Exa API 키와 함께 `.opencode/easycode.json`을 추가하세요.

### Project layout / 프로젝트 레이아웃

```
src/
  index.ts                # Plugin entry (EasyCodePlugin)
  config-handler.ts       # Config merging and normalization
  easycode-config.ts      # Config schema and loader
  agents/
    builtin-policy.ts     # Disable policy and permission defaults
    registry.ts           # Agent definition loader
    definitions/          # builtin agent definitions
      *.agent.ts
    prompt-text/
      orchestrator-prompt.md
  mcp/
    index.ts              # Builtin MCP servers
    websearch.ts          # Exa websearch MCP
  tools/
    index.ts              # Tool registry
    ast/sg.ts             # ast-grep adapter
    lsp/registry.ts       # LSP server registry
  skills/
    path-registration.ts  # Plugin skill path resolution
  hooks/
    skill-bootstrap/
      index.ts            # Bootstrap transform hook
      skill-bootstrap.md  # Session bootstrap content
.opencode/plugins/
  easycode.ts             # Local loader bridge
package.json
AGENTS.md                 # Korean build instructions
```

### 프로젝트 레이아웃

```
src/
  index.ts                # 플러그인 엔트리 (EasyCodePlugin)
  config-handler.ts       # 설정 병합 및 정규화
  easycode-config.ts      # 설정 스키마 및 로더
  agents/
    builtin-policy.ts     # 비활성화 정책 및 권한 기본값
    registry.ts           # 에이전트 정의 로더
    definitions/          # 내장 에이전트 정의
      *.agent.ts
    prompt-text/
      orchestrator-prompt.md
  mcp/
    index.ts              # 내장 MCP 서버
    websearch.ts          # Exa 웹검색 MCP
  tools/
    index.ts              # 도구 레지스트리
    ast/sg.ts             # ast-grep 어댑터
    lsp/registry.ts       # LSP 서버 레지스트리
  skills/
    path-registration.ts  # 플러그인 스킬 경로 확인
  hooks/
    skill-bootstrap/
      index.ts            # 부트스트랩 변환 훅
      skill-bootstrap.md  # 세션 부트스트랩 콘텐츠
.opencode/plugins/
  easycode.ts             # 로컬 로더 브릿지
package.json
AGENTS.md                 # 한국어 빌드 안내
```

---

## 8. Development notes / 개발 메모

### Local development / 로컬 개발

```bash
bun install
bun run typecheck
bun run build
```

### 로컬 개발

```bash
bun install
bun run typecheck
bun run build
```

### Publish flow / 배포 흐름

1. Build: `bun run build`
2. Ensure `dist/` is generated
3. Publish package with your preferred registry flow

### 배포 흐름

1. 빌드: `bun run build`
2. `dist/`가 생성되었는지 확인
3. 원하는 레지스트리 흐름으로 패키지를 배포합니다
