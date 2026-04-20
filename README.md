# EasyCode

Local code intelligence in every OpenCode session — LSP navigation, AST-aware search, builtin MCP servers, and a structured workflow that carries requests from clarification to verified completion.

세션마다 작동하는 로컬 코드 인텔리전스 — LSP 탐색, AST 인식 검색, 내장 MCP 서버, 그리고 명확한 요청 파악부터 검증된 완료까지 이어지는 구조화된 워크플로우.

---

## 1. What you get / 제공 기능

### Session tools / 세션 도구

Every OpenCode session that loads EasyCode gets **9 tools** — no extra setup required for LSP and AST tools.

모든 OpenCode 세션에서 EasyCode가 로드되면 **9개의 도구**를 사용할 수 있습니다 — LSP 및 AST 도구는 추가 설정 없이 바로 사용할 수 있습니다.

| Tool | Description |
|------|-------------|
| `lsp_goto_definition` | Jump to symbol definition |
| `lsp_find_references` | Find all references to a symbol |
| `lsp_symbols` | List symbols in a file or search workspace symbols |
| `lsp_diagnostics` | Show compiler/linter diagnostics for a file |
| `lsp_prepare_rename` | Check if a symbol can be renamed safely |
| `lsp_rename` | Rename a symbol across the codebase |
| `ast_grep_search` | Search code by AST pattern with `$VAR` and `$$$` placeholders |
| `ast_grep_replace` | Replace code by AST pattern (dry-run by default) |
| `current_time` | Return the current local time string |

| 도구 | 설명 |
|------|------|
| `lsp_goto_definition` | 심볼 정의로 이동 |
| `lsp_find_references` | 심볼에 대한 모든 참조 찾기 |
| `lsp_symbols` | 파일의 심볼 나열 또는 워크스페이스 심볼 검색 |
| `lsp_diagnostics` | 파일에 대한 컴파일러/린터 진단 표시 |
| `lsp_prepare_rename` | 심볼의 이름 변경이 안전한지 확인 |
| `lsp_rename` | 코드베이스 전체에서 심볼 이름 변경 |
| `ast_grep_search` | `$VAR` 및 `$$$` 플레이스홀더를 사용하여 AST 패턴으로 코드 검색 |
| `ast_grep_replace` | AST 패턴으로 코드 교체 (기본적으로 dry-run) |
| `current_time` | 현재 로컬 시간 문자열 반환 |

### Builtin MCP servers / 내장 MCP 서버

| Server | Type | Description |
|--------|------|-------------|
| `context7` | remote | Context7 code intelligence (`https://mcp.context7.com/mcp`) |
| `grep_app` | remote | Grep.app code search (`https://mcp.grep.app`) |
| `sequential_thinking` | local | `npx -y @modelcontextprotocol/server-sequential-thinking` |
| `websearch` | remote | Exa web search (optional — requires API key in config) |

| 서버 | 유형 | 설명 |
|------|------|------|
| `context7` | 원격 | Context7 코드 인텔리전스 |
| `grep_app` | 원격 | Grep.app 코드 검색 |
| `sequential_thinking` | 로컬 | `npx -y @modelcontextprotocol/server-sequential-thinking` |
| `websearch` | 원격 | Exa 웹 검색 (선택적 — 설정에 API 키 필요) |

The three builtin servers (`context7`, `grep_app`, `sequential_thinking`) are always registered and cannot be disabled via config. Existing OpenCode `config.mcp` entries take precedence over plugin defaults.

세 개의 내장 서버(`context7`, `grep_app`, `sequential_thinking`)는 항상 등록되며 설정으로 비활성화할 수 없습니다. 기존 OpenCode `config.mcp` 항목은 플러그인 기본값보다 우선합니다.

### Skill bootstrap / 스킬 부트스트랩

On the first user message of every session, the plugin prepends a bootstrap guidance block that reminds agents to check for applicable skills before acting. This ensures skill-first behavior is applied consistently.

모든 세션의 첫 번째 사용자 메시지에서, 플러그인은 에이전트가 행동하기 전에 적용 가능한 스킬을 확인하도록 상기시키는 부트스트랩 안내 블록을 앞에 붙입니다. 이를 통해 스킬 우선 동작이 일관되게 적용됩니다.

### Session hooks / 세션 훅

The plugin registers three session-level hooks beyond tools and config:

플러그인은 도구와 설정 외에 세 가지 세션 수준 훅을 등록합니다:

| Hook | Purpose |
|------|---------|
| `tool.execute.before` / `tool.execute.after` | Todo tool guard — tracks tool execution context per session |
| `event` | Session role resolver + todo continuation enforcer — auto-continues when incomplete tasks remain after a session goes idle |
| `experimental.chat.messages.transform` | Injects skill-bootstrap guidance on first user message |

| 훅 | 목적 |
|------|------|
| `tool.execute.before` / `tool.execute.after` | Todo 도구 가드 — 세션별 도구 실행 컨텍스트 추적 |
| `event` | 세션 역할 확인자 + Todo 연속 실행기 — 세션이 유휴 상태가 된 후 미완료 작업이 남아 있으면 자동으로 계속 진행 |
| `experimental.chat.messages.transform` | 첫 번째 사용자 메시지에 스킬 부트스트랩 안내 삽입 |

The todo continuation enforcer triggers after a configurable countdown (default 120 seconds) when a session goes idle with incomplete todos. It re-prompts the agent to continue working.

Todo 연속 실행기는 세션이 미완료 Todo가 있는 상태로 유휴 상태가 되면 구성 가능한 카운트다운(기본값 120초) 후에 트리거되어 에이전트에게 작업을 계속하도록 다시 프롬프트합니다.

---

## 2. Configuration / 설정

Config file: **`.opencode/easycode.json`** in the worktree or project directory.

Only `.opencode/easycode.json` is supported. The plugin does **not** read config from `~/.config/opencode/` or any other location.

설정 파일: 워크트리 또는 프로젝트 디렉터리의 **`.opencode/easycode.json`**.

`.opencode/easycode.json`만 지원됩니다. 플러그인은 `~/.config/opencode/` 또는 다른 위치에서 설정을 읽지 **않습니다**.

### Precedence / 우선순위

The plugin looks for `.opencode/easycode.json` in the worktree directory first. If the worktree config is absent or invalid, EasyCode falls back to the project-directory `.opencode/easycode.json`. When both exist, the worktree config takes precedence. Agent entries in the higher-precedence config fully replace (not deep-merge) fallback entries for the fields the plugin owns (`model`, `variant`, `color`, `temperature`, `permission`). An empty object `{}` for an agent in the higher-precedence config clears all fallback values for that agent's plugin-owned fields.

플러그인은 먼저 워크트리 디렉터리에서 `.opencode/easycode.json`을 찾습니다. 워크트리 설정이 없거나 유효하지 않으면 프로젝트 디렉터리의 `.opencode/easycode.json`으로 폴백합니다. 둘 다 존재하면 워크트리 설정이 우선합니다. 상위 우선순위 설정의 에이전트 항목은 플러그인이 소유한 필드(`model`, `variant`, `color`, `temperature`, `permission`)에 대해 폴백 항목을 완전히 대체합니다(딥 머지 아님). 상위 우선순위 설정에서 에이전트에 대한 빈 객체 `{}`는 해당 에이전트의 플러그인 소유 필드의 모든 폴백 값을 지웁니다.

> **Secret handling** / **시크릿 처리**: Do not commit `.opencode/easycode.json` if it contains credentials. Add it to `.gitignore`.

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

| 필드 | 타입 | 기본값 | 동작 |
|------|------|---------|------|
| `mcp.websearch.enabled` | `boolean` | `true` | 생략하거나 `true`로 설정하면 활성화. `false`로 설정하면 비활성화 — 이 경우 API 키가 임베디드되지 않습니다. |
| `mcp.websearch.apiKey` | `string` | — | 설정되고 활성화되면 API 키가 MCP URL에 임베디드됩니다. |

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
| `orchestrator` | Workflow coordinator (question=allow, apply_patch=deny by default) |
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

**지원되는 에이전트** — 플러그인 관리 에이전트 (`src/agents/definitions/*.agent.ts`에서 로드됨):

| 에이전트 | 역할 |
|----------|------|
| `orchestrator` | 워크플로우 조정자 (기본값: question=allow, apply_patch=deny) |
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

**Disable-policy agents**: `explore`, `build`, and `plan` are disabled by default. `general` is enabled by default. These are OpenCode built-in agents that the plugin disables to avoid conflicts with its own workflow agents.

**비활성화 정책 에이전트**: `explore`, `build`, `plan`은 기본적으로 비활성화되어 있습니다. `general`은 기본적으로 활성화되어 있습니다. 이들은 플러그인이 자체 워크플로우 에이전트와의 충돌을 피하기 위해 비활성화하는 OpenCode 내장 에이전트입니다.

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

---

## 3. Workflow / 워크플로우

### Default skill chain / 기본 스킬 체인

For implementation requests, the orchestrator runs a 6-stage skill chain by default. This is the primary workflow path — not every request must follow it. Simple questions, explorations, or one-shot edits may skip stages entirely.

구현 요청의 경우, 오케스트레이터는 기본적으로 6단계 스킬 체인을 실행합니다. 이것은 기본 워크플로우 경로입니다 — 모든 요청이 이 체인을 따라야 하는 것은 아닙니다. 간단한 질문, 탐색 또는 일회성 편집은 단계를 완전히 건너뛸 수 있습니다.

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

| 단계 | 역할 |
|------|------|
| `lucidify` | 모호하거나 불분명하거나 미지정된 요청을 명확히 합니다 |
| `crystallize` | 요구 사항 브리프에서 경화된 구현 계획을 생성합니다 |
| `using-git-worktrees` | 실행을 위해 격리된 git worktree를 준비합니다 |
| `materialize` | code-builder → code-spec-reviewer → code-quality-reviewer를 통해 계획을 실행합니다 |
| `assay` | 최종 독립 검토 및 PASS/FAIL 판단 |
| `finishing-a-development-branch` | assay PASS 후 머지, PR 또는 정리 |

The orchestrator delegates all substantive work to the appropriate skill or subagent and maintains TODO state throughout.

오케스트레이터는 모든 실질적인 작업을 적절한 스킬 또는 하위 에이전트에 위임하고 전 과정에서 TODO 상태를 유지합니다.

### Supporting workflow rules / 보조 워크플로우 규칙

- `todo-sync` synchronizes task state before execution, after each task, and when all work is finished.
- `test-driven-development` is the default discipline for any code changes.
- `systematic-debugging` is required before attempting a fix when tests fail, regressions appear, or validation finds an implementation defect.
- Stage boundaries are enforced: `materialize` starts only after `using-git-worktrees`, `assay` starts only after `materialize`, and branch-finishing starts only after `assay` passes.

- `todo-sync`는 실행 전, 각 작업 후, 모든 작업이 완료될 때 작업 상태를 동기화합니다.
- `test-driven-development`는 모든 코드 변경에 대한 기본 규칙입니다.
- 테스트가 실패하거나 회귀가 나타나거나 검증이 구현 결함을 발견하면 수정 시도 전에 `systematic-debugging`이 필요합니다.
- 단계 경계가 적용됩니다: `materialize`는 `using-git-worktrees` 후에만 시작하고, `assay`는 `materialize` 후에만 시작하며, 브랜치 마무리는 `assay` 통과 후에만 시작합니다.

---

## 4. Install, build, and local use / 설치, 빌드, 로컬 사용

### Build / 빌드

**package.json** declares the build and install scripts:

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
    "typecheck": "tsc --noEmit",
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

### Runtime requirements / 런타임 요구사항

- Install the language servers for the languages you use. The plugin auto-detects which server to use based on file extension and project markers.
- `sg` (`ast-grep`) must be installed globally or available as `@ast-grep/cli` in the workspace.
- The plugin prefers workspace-local binaries in `node_modules/.bin` and falls back to `PATH`.
- `sequential_thinking` runs via `npx`, so `npx` must be available.

- 사용하는 언어에 맞는 언어 서버를 설치하세요. 플러그인은 파일 확장자 및 프로젝트 마커를 기반으로 사용할 서버를 자동 감지합니다.
- `sg`(`ast-grep`)는 글로벌로 설치되거나 워크스페이스에서 `@ast-grep/cli`로 사용 가능해야 합니다.
- 플러그인은 `node_modules/.bin`의 워크스페이스 로컬 바이너리를 선호하고 `PATH`로 대체합니다.
- `sequential_thinking`은 `npx`를 통해 실행되므로 `npx`가 사용 가능해야 합니다.

---

## 5. Project layout / 프로젝트 레이아웃

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
    ast/index.ts          # ast_grep_search, ast_grep_replace
    current-time/index.ts # current_time tool
    lsp/registry.ts       # LSP server registry
    lsp/index.ts          # LSP tools (6 tools)
  skills/
    path-registration.ts  # Plugin skill path resolution
  hooks/
    skill-bootstrap/
      index.ts            # Bootstrap transform hook
      skill-bootstrap.md  # Session bootstrap content
    session-role-resolver.ts  # Session role detection
    todo-tool-guard/      # Tool execution context tracking
    todo-continuation-enforcer/  # Auto-continue on incomplete todos
.opencode/plugins/
  easycode.ts             # Local loader bridge
package.json
AGENTS.md                 # Korean build instructions
```

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
    ast/index.ts          # ast_grep_search, ast_grep_replace
    current-time/index.ts # current_time 도구
    lsp/registry.ts       # LSP 서버 레지스트리
    lsp/index.ts          # LSP 도구 (6개)
  skills/
    path-registration.ts  # 플러그인 스킬 경로 확인
  hooks/
    skill-bootstrap/
      index.ts            # 부트스트랩 변환 훅
      skill-bootstrap.md  # 세션 부트스트랩 콘텐츠
    session-role-resolver.ts  # 세션 역할 감지
    todo-tool-guard/      # 도구 실행 컨텍스트 추적
    todo-continuation-enforcer/  # 미완료 Todo 자동 계속
.opencode/plugins/
  easycode.ts             # 로컬 로더 브릿지
package.json
AGENTS.md                 # 한국어 빌드 안내
```

---

## 6. Development notes / 개발 메모

### Local development / 로컬 개발

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
