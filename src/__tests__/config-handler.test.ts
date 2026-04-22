import { afterAll, describe, expect, it } from "bun:test"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, normalize } from "node:path"
import { builtinAgentDisablePolicy } from "../agents/builtin-policy"
import codeBuilderAgent from "../agents/definitions/code-builder.agent"
import codeQualityReviewerAgent from "../agents/definitions/code-quality-reviewer.agent"
import codeSpecReviewerAgent from "../agents/definitions/code-spec-reviewer.agent"
import completionVerifierAgent from "../agents/definitions/completion-verifier.agent"
import debuggerAgent from "../agents/definitions/debugger.agent"
import explorerAgent from "../agents/definitions/explorer.agent"
import finalReviewerAgent from "../agents/definitions/final-reviewer.agent"
import librarianAgent from "../agents/definitions/librarian.agent"
import orchestratorAgent from "../agents/definitions/orchestrator.agent"
import planChallengerAgent from "../agents/definitions/plan-challenger.agent"
import planCheckerAgent from "../agents/definitions/plan-checker.agent"
import plannerAgent from "../agents/definitions/planner.agent"
import { loadBuiltinAgentRegistry } from "../agents/registry"
import { createConfigHandler } from "../config-handler"

function builtinMcp() {
  return {
    context7: {
      type: "remote",
      url: "https://mcp.context7.com/mcp",
    },
    grep_app: {
      type: "remote",
      url: "https://mcp.grep.app",
    },
    sequential_thinking: {
      type: "local",
      command: ["npx", "-y", "@modelcontextprotocol/server-sequential-thinking"],
    },
  }
}

function builtinMcpWithWebsearch(overrides: Record<string, unknown> = {}) {
  return {
    ...builtinMcp(),
    websearch: {
      type: "remote",
      url: "https://mcp.exa.ai/mcp",
      ...overrides,
    },
  }
}

function builtinExplorerAgent(overrides: Record<string, unknown> = {}) {
  return {
    description: explorerAgent.description,
    prompt: explorerAgent.prompt,
    mode: explorerAgent.mode,
    ...(typeof explorerAgent.defaults?.color === "string" ? { color: explorerAgent.defaults.color } : {}),
    ...(typeof explorerAgent.defaults?.temperature === "number"
      ? { temperature: explorerAgent.defaults.temperature }
      : {}),
    ...(explorerAgent.defaults?.permission ? { permission: explorerAgent.defaults.permission } : {}),
    ...overrides,
  }
}

function builtinCodeBuilderAgent(overrides: Record<string, unknown> = {}) {
  return {
    description: codeBuilderAgent.description,
    prompt: codeBuilderAgent.prompt,
    mode: codeBuilderAgent.mode,
    ...(typeof codeBuilderAgent.defaults?.color === "string" ? { color: codeBuilderAgent.defaults.color } : {}),
    ...(typeof codeBuilderAgent.defaults?.temperature === "number"
      ? { temperature: codeBuilderAgent.defaults.temperature }
      : {}),
    ...(codeBuilderAgent.defaults?.permission ? { permission: codeBuilderAgent.defaults.permission } : {}),
    ...overrides,
  }
}

function builtinCodeSpecReviewerAgent(overrides: Record<string, unknown> = {}) {
  return {
    description: codeSpecReviewerAgent.description,
    prompt: codeSpecReviewerAgent.prompt,
    mode: codeSpecReviewerAgent.mode,
    ...(typeof codeSpecReviewerAgent.defaults?.color === "string"
      ? { color: codeSpecReviewerAgent.defaults.color }
      : {}),
    ...(typeof codeSpecReviewerAgent.defaults?.temperature === "number"
      ? { temperature: codeSpecReviewerAgent.defaults.temperature }
      : {}),
    ...(codeSpecReviewerAgent.defaults?.permission ? { permission: codeSpecReviewerAgent.defaults.permission } : {}),
    ...overrides,
  }
}

function builtinCodeQualityReviewerAgent(overrides: Record<string, unknown> = {}) {
  return {
    description: codeQualityReviewerAgent.description,
    prompt: codeQualityReviewerAgent.prompt,
    mode: codeQualityReviewerAgent.mode,
    ...(typeof codeQualityReviewerAgent.defaults?.color === "string"
      ? { color: codeQualityReviewerAgent.defaults.color }
      : {}),
    ...(typeof codeQualityReviewerAgent.defaults?.temperature === "number"
      ? { temperature: codeQualityReviewerAgent.defaults.temperature }
      : {}),
    ...(codeQualityReviewerAgent.defaults?.permission
      ? { permission: codeQualityReviewerAgent.defaults.permission }
      : {}),
    ...overrides,
  }
}

function builtinLibrarianAgent(overrides: Record<string, unknown> = {}) {
  return {
    description: librarianAgent.description,
    prompt: librarianAgent.prompt,
    mode: librarianAgent.mode,
    ...(typeof librarianAgent.defaults?.color === "string" ? { color: librarianAgent.defaults.color } : {}),
    ...(typeof librarianAgent.defaults?.temperature === "number"
      ? { temperature: librarianAgent.defaults.temperature }
      : {}),
    ...(librarianAgent.defaults?.permission ? { permission: librarianAgent.defaults.permission } : {}),
    ...overrides,
  }
}

function builtinOrchestratorAgent(overrides: Record<string, unknown> = {}) {
  return {
    description: orchestratorAgent.description,
    prompt: orchestratorAgent.prompt,
    mode: orchestratorAgent.mode,
    ...(typeof orchestratorAgent.defaults?.color === "string" ? { color: orchestratorAgent.defaults.color } : {}),
    ...(typeof orchestratorAgent.defaults?.temperature === "number"
      ? { temperature: orchestratorAgent.defaults.temperature }
      : {}),
    ...(orchestratorAgent.defaults?.permission ? { permission: orchestratorAgent.defaults.permission } : {}),
    ...overrides,
  }
}

function builtinPlannerAgent(overrides: Record<string, unknown> = {}) {
  return {
    description: plannerAgent.description,
    prompt: plannerAgent.prompt,
    mode: plannerAgent.mode,
    ...(typeof plannerAgent.defaults?.color === "string" ? { color: plannerAgent.defaults.color } : {}),
    ...(typeof plannerAgent.defaults?.temperature === "number"
      ? { temperature: plannerAgent.defaults.temperature }
      : {}),
    ...(plannerAgent.defaults?.permission ? { permission: plannerAgent.defaults.permission } : {}),
    ...overrides,
  }
}

function builtinPlanCheckerAgent(overrides: Record<string, unknown> = {}) {
  return {
    description: planCheckerAgent.description,
    prompt: planCheckerAgent.prompt,
    mode: planCheckerAgent.mode,
    ...(typeof planCheckerAgent.defaults?.color === "string" ? { color: planCheckerAgent.defaults.color } : {}),
    ...(typeof planCheckerAgent.defaults?.temperature === "number"
      ? { temperature: planCheckerAgent.defaults.temperature }
      : {}),
    ...(planCheckerAgent.defaults?.permission ? { permission: planCheckerAgent.defaults.permission } : {}),
    ...overrides,
  }
}

function builtinPlanChallengerAgent(overrides: Record<string, unknown> = {}) {
  return {
    description: planChallengerAgent.description,
    prompt: planChallengerAgent.prompt,
    mode: planChallengerAgent.mode,
    ...(typeof planChallengerAgent.defaults?.color === "string"
      ? { color: planChallengerAgent.defaults.color }
      : {}),
    ...(typeof planChallengerAgent.defaults?.temperature === "number"
      ? { temperature: planChallengerAgent.defaults.temperature }
      : {}),
    ...(planChallengerAgent.defaults?.permission
      ? { permission: planChallengerAgent.defaults.permission }
      : {}),
    ...overrides,
  }
}

function builtinCompletionVerifierAgent(overrides: Record<string, unknown> = {}) {
  return {
    description: completionVerifierAgent.description,
    prompt: completionVerifierAgent.prompt,
    mode: completionVerifierAgent.mode,
    ...(typeof completionVerifierAgent.defaults?.color === "string"
      ? { color: completionVerifierAgent.defaults.color }
      : {}),
    ...(typeof completionVerifierAgent.defaults?.temperature === "number"
      ? { temperature: completionVerifierAgent.defaults.temperature }
      : {}),
    ...(completionVerifierAgent.defaults?.permission
      ? { permission: completionVerifierAgent.defaults.permission }
      : {}),
    ...overrides,
  }
}

function builtinDebuggerAgent(overrides: Record<string, unknown> = {}) {
  return {
    description: debuggerAgent.description,
    prompt: debuggerAgent.prompt,
    mode: debuggerAgent.mode,
    ...(typeof debuggerAgent.defaults?.color === "string" ? { color: debuggerAgent.defaults.color } : {}),
    ...(typeof debuggerAgent.defaults?.temperature === "number"
      ? { temperature: debuggerAgent.defaults.temperature }
      : {}),
    ...(debuggerAgent.defaults?.permission ? { permission: debuggerAgent.defaults.permission } : {}),
    ...overrides,
  }
}

function builtinFinalReviewerAgent(overrides: Record<string, unknown> = {}) {
  return {
    description: finalReviewerAgent.description,
    prompt: finalReviewerAgent.prompt,
    mode: finalReviewerAgent.mode,
    ...(typeof finalReviewerAgent.defaults?.color === "string"
      ? { color: finalReviewerAgent.defaults.color }
      : {}),
    ...(typeof finalReviewerAgent.defaults?.temperature === "number"
      ? { temperature: finalReviewerAgent.defaults.temperature }
      : {}),
    ...(finalReviewerAgent.defaults?.permission ? { permission: finalReviewerAgent.defaults.permission } : {}),
    ...overrides,
  }
}

function builtinDisableAgents(
  overrides: Partial<Record<keyof typeof builtinAgentDisablePolicy, Record<string, unknown>>> = {},
) {
  return Object.fromEntries(
    Object.entries(builtinAgentDisablePolicy).map(([name, disable]) => [
      name,
      {
        disable,
        ...(overrides[name as keyof typeof builtinAgentDisablePolicy] ?? {}),
      },
    ]),
  )
}

function builtinManagedAgents(
  overrides: {
    "code-builder"?: Record<string, unknown>
    "code-quality-reviewer"?: Record<string, unknown>
    "code-spec-reviewer"?: Record<string, unknown>
    "completion-verifier"?: Record<string, unknown>
    Debugger?: Record<string, unknown>
    explorer?: Record<string, unknown>
    "final-reviewer"?: Record<string, unknown>
    librarian?: Record<string, unknown>
    orchestrator?: Record<string, unknown>
    planner?: Record<string, unknown>
    "plan-checker"?: Record<string, unknown>
    "plan-challenger"?: Record<string, unknown>
  } = {},
) {
  return {
    "code-builder": builtinCodeBuilderAgent(overrides["code-builder"]),
    "code-quality-reviewer": builtinCodeQualityReviewerAgent(overrides["code-quality-reviewer"]),
    "code-spec-reviewer": builtinCodeSpecReviewerAgent(overrides["code-spec-reviewer"]),
    "completion-verifier": builtinCompletionVerifierAgent(overrides["completion-verifier"]),
    Debugger: builtinDebuggerAgent(overrides.Debugger),
    explorer: builtinExplorerAgent(overrides.explorer),
    "final-reviewer": builtinFinalReviewerAgent(overrides["final-reviewer"]),
    librarian: builtinLibrarianAgent(overrides.librarian),
    orchestrator: builtinOrchestratorAgent(overrides.orchestrator),
    planner: builtinPlannerAgent(overrides.planner),
    "plan-checker": builtinPlanCheckerAgent(overrides["plan-checker"]),
    "plan-challenger": builtinPlanChallengerAgent(overrides["plan-challenger"]),
  }
}

function createDirectoryWithEasyCodeConfig(content: string) {
  const directory = mkdtempSync(join(tmpdir(), "easycode-config-handler-"))
  const configDirectory = join(directory, ".opencode")

  mkdirSync(configDirectory)
  writeFileSync(join(configDirectory, "easycode.json"), content)

  return directory
}

function createPluginLayout() {
  const sandboxDir = mkdtempSync(join(tmpdir(), "easycode-config-handler-skill-layout-"))
  const pluginDir = join(sandboxDir, "plugin")
  const moduleDir = join(pluginDir, "dist")
  const skillPath = normalize(join(pluginDir, "src/skills"))

  mkdirSync(moduleDir, { recursive: true })

  return { sandboxDir, moduleDir, skillPath }
}

const isolatedGlobalConfigRoot = mkdtempSync(join(tmpdir(), "easycode-config-handler-global-empty-"))
const isolatedGlobalConfigPath = join(isolatedGlobalConfigRoot, "easycode.json")

afterAll(() => {
  rmSync(isolatedGlobalConfigRoot, { recursive: true, force: true })
})

function createScopedConfigHandler(
  directory: string,
  fallbackDirectory?: string,
  options: { moduleDir?: string; globalConfigPath?: string } = {},
) {
  return createConfigHandler(directory, fallbackDirectory, {
    ...options,
    globalConfigPath: options.globalConfigPath ?? isolatedGlobalConfigPath,
  })
}

describe("createConfigHandler", () => {
  it("injects builtin MCP defaults when config.mcp is empty", async () => {
    const config: Record<string, unknown> = { mcp: {} }

    await createScopedConfigHandler("/test/directory")(config)

    expect(config.mcp).toEqual(builtinMcp())
  })

  it("adds websearch when easycode.json enables it", async () => {
    const directory = createDirectoryWithEasyCodeConfig(
      JSON.stringify({ mcp: { websearch: { enabled: true, apiKey: "exa key?/=" } } }),
    )

    try {
      const config: Record<string, unknown> = { mcp: {} }

      await createScopedConfigHandler(directory)(config)

      expect(config.mcp).toEqual(
        builtinMcpWithWebsearch({
          url: "https://mcp.exa.ai/mcp?exaApiKey=exa%20key%3F%2F%3D",
        }),
      )
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("marks websearch disabled when easycode.json sets enabled to false", async () => {
    const directory = createDirectoryWithEasyCodeConfig(JSON.stringify({ mcp: { websearch: { enabled: false } } }))

    try {
      const config: Record<string, unknown> = { mcp: {} }

      await createScopedConfigHandler(directory)(config)

      expect(config.mcp).toEqual(builtinMcpWithWebsearch({ enabled: false }))
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("does not embed the apiKey when websearch is disabled", async () => {
    const directory = createDirectoryWithEasyCodeConfig(
      JSON.stringify({ mcp: { websearch: { enabled: false, apiKey: "exa key?/=" } } }),
    )

    try {
      const config: Record<string, unknown> = { mcp: {} }

      await createScopedConfigHandler(directory)(config)

      expect(config.mcp).toEqual(builtinMcpWithWebsearch({ enabled: false }))
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("falls back to builtin defaults when easycode.json is invalid", async () => {
    const directory = createDirectoryWithEasyCodeConfig("{ invalid json")

    try {
      const config: Record<string, unknown> = { mcp: {} }

      await createScopedConfigHandler(directory)(config)

      expect(config.mcp).toEqual(builtinMcp())
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("falls back to builtin defaults when easycode.json root is null", async () => {
    const directory = createDirectoryWithEasyCodeConfig("null")

    try {
      const config: Record<string, unknown> = { mcp: {} }

      await createScopedConfigHandler(directory)(config)

      expect(config.mcp).toEqual(builtinMcp())
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("ignores non-object mcp.websearch values in easycode.json", async () => {
    const directory = createDirectoryWithEasyCodeConfig(JSON.stringify({ mcp: { websearch: true } }))

    try {
      const config: Record<string, unknown> = { mcp: {} }

      await createScopedConfigHandler(directory)(config)

      expect(config.mcp).toEqual(builtinMcp())
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("ignores empty websearch objects in easycode.json", async () => {
    const directory = createDirectoryWithEasyCodeConfig(JSON.stringify({ mcp: { websearch: {} } }))

    try {
      const config: Record<string, unknown> = { mcp: {} }

      await createScopedConfigHandler(directory)(config)

      expect(config.mcp).toEqual(builtinMcp())
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("ignores unknown-only websearch objects in easycode.json", async () => {
    const directory = createDirectoryWithEasyCodeConfig(JSON.stringify({ mcp: { websearch: { provider: "exa" } } }))

    try {
      const config: Record<string, unknown> = { mcp: {} }

      await createScopedConfigHandler(directory)(config)

      expect(config.mcp).toEqual(builtinMcp())
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("does not fill higher-precedence MCP config from fallbackDirectory", async () => {
    const directory = createDirectoryWithEasyCodeConfig(JSON.stringify({ mcp: { websearch: { enabled: true } } }))
    const fallbackDirectory = createDirectoryWithEasyCodeConfig(
      JSON.stringify({ mcp: { websearch: { apiKey: "fallback-key" } } }),
    )

    try {
      const config: Record<string, unknown> = { mcp: {} }

      await createScopedConfigHandler(directory, fallbackDirectory)(config)

      expect(config.mcp).toEqual(builtinMcpWithWebsearch())
    } finally {
      rmSync(directory, { recursive: true, force: true })
      rmSync(fallbackDirectory, { recursive: true, force: true })
    }
  })

  it("keeps existing config.mcp entries at highest precedence", async () => {
    const config: Record<string, unknown> = {
      mcp: {
        context7: {
          type: "remote",
          url: "https://example.com/custom-context7",
        },
        custom_server: {
          type: "remote",
          url: "https://example.com/custom-server",
        },
      },
    }

    await createScopedConfigHandler("/test/directory")(config)

    expect(config.mcp).toEqual({
      ...builtinMcp(),
      context7: {
        type: "remote",
        url: "https://example.com/custom-context7",
      },
      custom_server: {
        type: "remote",
        url: "https://example.com/custom-server",
      },
    })
  })

  it("existing config.mcp fully overrides builtin-named entries", async () => {
    const directory = createDirectoryWithEasyCodeConfig(JSON.stringify({ mcp: { websearch: { enabled: true } } }))

    try {
      const config: Record<string, unknown> = {
        mcp: {
          websearch: {
            type: "local",
            command: ["bunx", "custom-websearch"],
            note: "existing config wins completely",
          },
        },
      }

      await createScopedConfigHandler(directory)(config)

      expect(config.mcp).toEqual({
        ...builtinMcpWithWebsearch(),
        websearch: {
          type: "local",
          command: ["bunx", "custom-websearch"],
          note: "existing config wins completely",
        },
      })
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("preserves partial builtin-named entries from existing config without merging", async () => {
    const config: Record<string, unknown> = {
      mcp: {
        sequential_thinking: {
          command: ["bunx", "custom-sequential-thinking"],
        },
      },
    }

    await createScopedConfigHandler("/test/directory")(config)

    expect(config.mcp).toEqual({
      ...builtinMcp(),
      sequential_thinking: {
        command: ["bunx", "custom-sequential-thinking"],
      },
    })
  })

  it("ignores invalid non-object config.mcp values", async () => {
    const config: Record<string, unknown> = {
      mcp: ["not", "an", "object"],
    }

    await createScopedConfigHandler("/test/directory")(config)

    expect(config.mcp).toEqual(builtinMcp())
  })

  it("preserves scalar builtin-named entries from existing config", async () => {
    const config: Record<string, unknown> = {
      mcp: {
        context7: null,
        grep_app: "invalid",
        sequential_thinking: 123,
      },
    }

    await createScopedConfigHandler("/test/directory")(config)

    expect(config.mcp).toEqual({
      ...builtinMcp(),
      context7: null,
      grep_app: "invalid",
      sequential_thinking: 123,
    })
  })

  it("preserves malformed object overrides for builtin-named entries", async () => {
    const config: Record<string, unknown> = {
      mcp: {
        context7: {
          type: "local",
          url: 123,
        },
        sequential_thinking: {
          type: "remote",
          command: "bad",
        },
      },
    }

    await createScopedConfigHandler("/test/directory")(config)

    expect(config.mcp).toEqual({
      ...builtinMcp(),
      context7: {
        type: "local",
        url: 123,
      },
      sequential_thinking: {
        type: "remote",
        command: "bad",
      },
    })
  })

  it("does not leak builtin mutations across handler calls", async () => {
    const firstConfig: Record<string, unknown> = { mcp: {} }
    const secondConfig: Record<string, unknown> = { mcp: {} }
    const handler = createScopedConfigHandler("/test/directory")

    await handler(firstConfig)
    ;((firstConfig.mcp as Record<string, unknown>).sequential_thinking as { command: string[] }).command[0] =
      "bunx"

    await handler(secondConfig)

    expect(secondConfig.mcp).toEqual(builtinMcp())
  })

  it("registers the plugin skill path when the candidate directory exists", async () => {
    const { sandboxDir, moduleDir, skillPath } = createPluginLayout()

    mkdirSync(skillPath, { recursive: true })

    try {
      const config: Record<string, unknown> = { mcp: {} }

      await createScopedConfigHandler("/test/directory", undefined, { moduleDir })(config)

      expect(config.mcp).toEqual(builtinMcp())
      expect(config.skills).toEqual({
        paths: [skillPath],
      })
    } finally {
      rmSync(sandboxDir, { recursive: true, force: true })
    }
  })

  it("preserves existing user skill paths while appending the plugin path", async () => {
    const { sandboxDir, moduleDir, skillPath } = createPluginLayout()

    mkdirSync(skillPath, { recursive: true })

    try {
      const config: Record<string, unknown> = {
        mcp: {},
        skills: {
          paths: ["/user/skills"],
        },
      }

      await createScopedConfigHandler("/test/directory", undefined, { moduleDir })(config)

      expect(config.mcp).toEqual(builtinMcp())
      expect(config.skills).toEqual({
        paths: ["/user/skills", skillPath],
      })
    } finally {
      rmSync(sandboxDir, { recursive: true, force: true })
    }
  })

  it("ignores hostile special keys without mutating object prototypes", async () => {
    const config = JSON.parse('{"mcp":{"__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}}}}') as Record<
      string,
      unknown
    >

    await createScopedConfigHandler("/test/directory")(config)

    expect(config.mcp).toEqual({
      ...builtinMcp(),
      __proto__: {
        polluted: true,
      },
      constructor: {
        prototype: {
          polluted: true,
        },
      },
    })
    expect(Object.getPrototypeOf(config.mcp as object)).toBeNull()
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })

  it("registers builtin plugin-managed agents into config.agent including Debugger", async () => {
    const config: Record<string, unknown> = {}

    await createScopedConfigHandler("/test/directory")(config)

    expect(config.agent).toEqual({
      ...builtinManagedAgents(),
      ...builtinDisableAgents(),
    })
  })

  it("builtin managed agent keys match runtime builtin registry keys", async () => {
    const builtinRegistry = await loadBuiltinAgentRegistry(join(import.meta.dir, ".."))

    expect(Object.keys(builtinManagedAgents()).sort()).toEqual(builtinRegistry.map((agent) => agent.name).sort())
  })

  it("injects builtin default color for plugin-managed agents", async () => {
    const config: Record<string, unknown> = {}

    await createScopedConfigHandler("/test/directory")(config)

    expect((config.agent as Record<string, Record<string, unknown>>).orchestrator).toEqual(
      builtinOrchestratorAgent(),
    )
  })

  it("emits zero orchestrator skill rules in merged config", async () => {
    const config: Record<string, unknown> = {}

    await createScopedConfigHandler("/test/directory")(config)

    expect((config.agent as Record<string, Record<string, unknown>>).orchestrator).toEqual(
      builtinOrchestratorAgent(),
    )

    expect(
      ((config.agent as Record<string, { permission?: { skill?: Record<string, string> } }>).orchestrator?.permission
        ?.skill ?? {}) as Record<string, string>,
    ).toEqual({})
  })

  it("binds model, variant, and temperature for plugin-managed agents from easycode.json", async () => {
    const directory = createDirectoryWithEasyCodeConfig(
      JSON.stringify({
        agent: {
          explorer: {
            model: "gpt-5.4",
            variant: "fast",
            temperature: 0.6,
          },
        },
      }),
    )

    try {
      const config: Record<string, unknown> = {}

      await createScopedConfigHandler(directory)(config)

      expect(config.agent).toEqual({
        ...builtinManagedAgents({
          explorer: {
            model: "gpt-5.4",
            variant: "fast",
            temperature: 0.6,
          },
        }),
        ...builtinDisableAgents(),
      })
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("binds permission overrides for plugin-managed agents from easycode.json", async () => {
    const directory = createDirectoryWithEasyCodeConfig(
      JSON.stringify({
        agent: {
          explorer: {
            permission: {
              question: "allow",
              apply_patch: "deny",
              ast_grep_replace: "deny",
              edit: "deny",
              lsp_rename: "deny",
              task: "deny",
              bash: {
                "*": "ask",
                "git status*": "allow",
                "git push*": "deny",
              },
              webfetch: "allow",
            },
          },
        },
      }),
    )

    try {
      const config: Record<string, unknown> = {}

      await createScopedConfigHandler(directory)(config)

      expect((config.agent as Record<string, unknown>).explorer).toMatchObject({
        ...builtinExplorerAgent({
          permission: {
            question: "allow",
            apply_patch: "deny",
            ast_grep_replace: "deny",
            edit: "deny",
            lsp_rename: "deny",
            task: "deny",
            bash: {
              "*": "ask",
              "git status*": "allow",
              "git push*": "deny",
            },
            webfetch: "allow",
          },
        }),
      })
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("allows easycode.json to override builtin plugin-managed agent color", async () => {
    const directory = createDirectoryWithEasyCodeConfig(
      JSON.stringify({
        agent: {
          orchestrator: {
            color: "magenta",
          },
        },
      }),
    )

    try {
      const config: Record<string, unknown> = {}

      await createScopedConfigHandler(directory)(config)

      expect(config.agent).toEqual({
        ...builtinManagedAgents({
          orchestrator: {
            color: "magenta",
          },
        }),
        ...builtinDisableAgents(),
      })
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("preserves existing config.agent entries while registering plugin-managed agents", async () => {
    const config: Record<string, unknown> = {
      agent: {
        custom: {
          prompt: "user prompt",
          note: "keep me",
        },
      },
    }

    await createScopedConfigHandler("/test/directory")(config)

    expect(config.agent).toEqual({
      custom: {
        prompt: "user prompt",
        note: "keep me",
      },
      ...builtinManagedAgents(),
      ...builtinDisableAgents(),
    })
  })

  it("preserves unrelated fields on colliding plugin-managed agent entries while overriding temperature", async () => {
    const directory = createDirectoryWithEasyCodeConfig(
      JSON.stringify({
        agent: {
          explorer: {
            model: "claude-sonnet-4",
            variant: "balanced",
            temperature: 0.7,
          },
        },
      }),
    )

    try {
      const config: Record<string, unknown> = {
        agent: {
          explorer: {
            prompt: "user prompt",
            description: "user description",
            mode: "primary",
            temperature: 1.2,
            notes: ["keep", "existing"],
          },
        },
      }

      await createScopedConfigHandler(directory)(config)

      expect(config.agent).toEqual({
        ...builtinManagedAgents({
          explorer: {
            temperature: 0.7,
            notes: ["keep", "existing"],
            model: "claude-sonnet-4",
            variant: "balanced",
          },
        }),
        ...builtinDisableAgents(),
      })
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("clears stale model, variant, and temperature on colliding plugin-managed agent entries when config omits them", async () => {
    const directory = createDirectoryWithEasyCodeConfig(JSON.stringify({ agent: { explorer: {} } }))

    try {
      const config: Record<string, unknown> = {
        agent: {
          explorer: {
            prompt: "user prompt",
            description: "user description",
            mode: "primary",
            model: "stale-model",
            variant: "stale-variant",
            temperature: 1.4,
          },
        },
      }

      await createScopedConfigHandler(directory)(config)

      expect(config.agent).toEqual({
        ...builtinManagedAgents(),
        ...builtinDisableAgents(),
      })
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("preserves an existing plugin-managed agent color when no new color source exists", async () => {
    const directory = createDirectoryWithEasyCodeConfig(JSON.stringify({ agent: { explorer: {} } }))

    try {
      const config: Record<string, unknown> = {
        agent: {
          explorer: {
            prompt: "user prompt",
            description: "user description",
            mode: "primary",
            color: "cyan",
            model: "stale-model",
            variant: "stale-variant",
            temperature: 1.4,
          },
        },
      }

      await createScopedConfigHandler(directory)(config)

      expect(config.agent).toEqual({
        ...builtinManagedAgents({
          explorer: {
            color: "cyan",
          },
        }),
        ...builtinDisableAgents(),
      })
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("clears a stale plugin-managed agent color when easycode.json still manages the agent", async () => {
    const directory = createDirectoryWithEasyCodeConfig(
      JSON.stringify({ agent: { explorer: { model: "gpt-5.4-mini" } } }),
    )

    try {
      const config: Record<string, unknown> = {
        agent: {
          explorer: {
            prompt: "user prompt",
            description: "user description",
            mode: "primary",
            color: "cyan",
          },
        },
      }

      await createScopedConfigHandler(directory)(config)

      expect(config.agent).toEqual({
        ...builtinManagedAgents({
          explorer: {
            model: "gpt-5.4-mini",
          },
        }),
        ...builtinDisableAgents(),
      })
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("clears plugin-owned default permissions when easycode.json sets an explicit empty permission object", async () => {
    const directory = createDirectoryWithEasyCodeConfig(JSON.stringify({ agent: { explorer: { permission: {} } } }))

    try {
      const config: Record<string, unknown> = {
        agent: {
          explorer: {
            permission: {
              edit: "allow",
              bash: {
                "*": "allow",
              },
            },
            note: "keep me",
          },
        },
      }

      await createScopedConfigHandler(directory)(config)

      expect((config.agent as Record<string, unknown>).explorer).toMatchObject({
        ...builtinExplorerAgent({
          note: "keep me",
          permission: {},
        }),
      })
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("binds model and variant for disable-policy agents from easycode.json", async () => {
    const directory = createDirectoryWithEasyCodeConfig(
      JSON.stringify({
        agent: {
          explore: {
            model: "gpt-5.4-mini",
            variant: "fast",
          },
        },
      }),
    )

    try {
      const config: Record<string, unknown> = {}

      await createScopedConfigHandler(directory)(config)

      expect(config.agent).toEqual({
        ...builtinManagedAgents(),
        ...builtinDisableAgents({
          explore: {
          model: "gpt-5.4-mini",
          variant: "fast",
          },
        }),
      })
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("clears stale model and variant on disable-policy agents when config omits them", async () => {
    const directory = createDirectoryWithEasyCodeConfig(JSON.stringify({ agent: { explore: {} } }))

    try {
      const config: Record<string, unknown> = {
        agent: {
          explore: {
            disable: false,
            model: "stale-model",
            variant: "stale-variant",
            note: "keep me",
          },
        },
      }

      await createScopedConfigHandler(directory)(config)

      expect(config.agent).toEqual({
        ...builtinManagedAgents(),
        ...builtinDisableAgents({
          explore: {
          note: "keep me",
          },
        }),
      })
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("clears a stale color on disable-policy agents when easycode.json still manages the agent", async () => {
    const directory = createDirectoryWithEasyCodeConfig(
      JSON.stringify({ agent: { explore: { model: "gpt-5.4-mini" } } }),
    )

    try {
      const config: Record<string, unknown> = {
        agent: {
          explore: {
            disable: false,
            color: "cyan",
            note: "keep me",
          },
        },
      }

      await createScopedConfigHandler(directory)(config)

      expect(config.agent).toEqual({
        ...builtinManagedAgents(),
        ...builtinDisableAgents({
          explore: {
            model: "gpt-5.4-mini",
            note: "keep me",
          },
        }),
      })
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("applies the builtin disable policy while preserving other fields", async () => {
    const config: Record<string, unknown> = {
      agent: {
        explore: {
          prompt: "keep",
          color: "violet",
          disable: false,
        },
        build: {
          disable: true,
          note: "keep",
        },
        plan: "invalid existing entry",
        general: {
          disable: true,
          strategy: "existing",
        },
      },
    }

    await createScopedConfigHandler("/test/directory")(config)

    expect(config.agent).toEqual({
      ...builtinManagedAgents(),
      ...builtinDisableAgents({
        explore: {
          prompt: "keep",
          color: "violet",
        },
        build: {
          note: "keep",
        },
        general: {
          strategy: "existing",
        },
      }),
    })
  })

  it("falls back to global easycode.json when no local config exists", async () => {
    const emptyDirectory = mkdtempSync(join(tmpdir(), "easycode-config-handler-empty-"))
    const globalRoot = mkdtempSync(join(tmpdir(), "easycode-config-handler-global-"))
    const globalDir = join(globalRoot, ".config", "opencode")
    mkdirSync(globalDir, { recursive: true })
    writeFileSync(join(globalDir, "easycode.json"), JSON.stringify({ mcp: { websearch: { enabled: true } } }))

    try {
      const config: Record<string, unknown> = { mcp: {} }

      await createConfigHandler(emptyDirectory, undefined, { globalConfigPath: join(globalDir, "easycode.json") })(config)

      expect(config.mcp).toEqual(builtinMcpWithWebsearch())
    } finally {
      rmSync(emptyDirectory, { recursive: true, force: true })
      rmSync(globalRoot, { recursive: true, force: true })
    }
  })

  it("gives local easycode.json higher precedence than global for websearch config", async () => {
    const localDirectory = createDirectoryWithEasyCodeConfig(JSON.stringify({ mcp: { websearch: { enabled: false } } }))
    const globalRoot = mkdtempSync(join(tmpdir(), "easycode-config-handler-precedence-"))
    const globalDir = join(globalRoot, ".config", "opencode")
    mkdirSync(globalDir, { recursive: true })
    writeFileSync(join(globalDir, "easycode.json"), JSON.stringify({ mcp: { websearch: { enabled: true, apiKey: "global-key" } } }))

    try {
      const config: Record<string, unknown> = { mcp: {} }

      await createConfigHandler(localDirectory, undefined, { globalConfigPath: join(globalDir, "easycode.json") })(config)

      expect(config.mcp).toEqual(builtinMcpWithWebsearch({ enabled: false }))
    } finally {
      rmSync(localDirectory, { recursive: true, force: true })
      rmSync(globalRoot, { recursive: true, force: true })
    }
  })
})
