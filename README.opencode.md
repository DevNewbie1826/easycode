# EasyCode — OpenCode Plugin Installation

Install EasyCode directly from GitHub into any OpenCode project.

---

## Install

Add the plugin to your OpenCode configuration:

```jsonc
// .opencode/config.json
{
  "plugin": [
    "easycode-plugin@git+https://github.com/DevNewbie1826/easycode"
  ]
}
```

### Version pinning

To pin a specific tag or commit:

```jsonc
{
  "plugin": [
    "easycode-plugin@git+https://github.com/DevNewbie1826/easycode#v0.1.0"
  ]
}
```

OpenCode installs the plugin directly from the Git repository. No build step is required — EasyCode ships TypeScript source that Bun resolves at runtime.

## What you get

EasyCode self-registers everything it needs:

- **Bundled skills** — workflow skills are registered automatically; you do not need to add `skills.paths`
- **Builtin agents** — orchestrator, planner, code-builder, reviewer, and more
- **Builtin MCP servers** — Context7, Grep.app, Sequential Thinking, and optional Exa web search
- **Session tools** — LSP navigation, AST-aware search, and code transformation

## Runtime prerequisites

| Requirement | Purpose |
|-------------|---------|
| Language servers | LSP tools auto-detect servers by file extension and project markers |
| `sg` (ast-grep) | AST search and replace tools |
| `npx` | Sequential Thinking MCP server |

Install `sg` globally or add `@ast-grep/cli` to your workspace:

```bash
npm install -g @ast-grep/cli
```

## Configuration

EasyCode reads `easycode.json` from up to three locations, in decreasing precedence:

| Priority | Path | Scope |
|----------|------|-------|
| 1 (highest) | `<worktree>/.opencode/easycode.json` | Worktree-local |
| 2 | `<project>/.opencode/easycode.json` | Project-local |
| 3 (lowest) | `~/.config/opencode/easycode.json` | Global |

When both local and global configs exist, local config takes precedence for each top-level section. Agent entries in higher-precedence config fully replace (not deep-merge) fallback entries for plugin-owned fields (`model`, `variant`, `color`, `temperature`, `permission`). An empty object `{}` for an agent in the higher-precedence config clears all fallback values for that agent's plugin-owned fields.

### Minimal config

```jsonc
// ~/.config/opencode/easycode.json
{
  "mcp": {
    "websearch": {
      "enabled": true,
      "apiKey": "YOUR_EXA_API_KEY"
    }
  }
}
```

> **Note:** Do not commit `easycode.json` if it contains credentials. Add `.opencode/easycode.json` to `.gitignore`.

For the full config schema, see the [main README](README.md).

## Local development

If you are developing EasyCode itself (not installing it as a user):

```bash
git clone https://github.com/DevNewbie1826/easycode.git
cd easycode
bun install
bun run build:local
```

The `build:local` command builds `dist/index.js` and copies it to `.opencode/plugins/easycode.ts` for local testing. This is a developer-only step — GitHub installs do not need it.
