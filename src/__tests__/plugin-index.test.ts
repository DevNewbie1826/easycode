import { describe, expect, it } from "bun:test"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import type { Config, Hooks, PluginInput } from "@opencode-ai/plugin"
import { TODO_REQUIRED_BLOCK_MESSAGE, TODO_STALE_REMINDER } from "../hooks/todo-tool-guard/constants"
import { SKILL_BOOTSTRAP_MARKER } from "../hooks/skill-bootstrap"
import { EasyCodePlugin } from "../index"

const worktreeRoot = join(import.meta.dir, "..", "..")
const pluginRoot = resolve(worktreeRoot, "src", "index.ts")
const bootstrapMarkdown = readFileSync(
  join(worktreeRoot, "src", "hooks", "skill-bootstrap", "skill-bootstrap.md"),
  "utf8",
)

function createDirectoryWithEasyCodeConfig(content: string) {
  const directory = mkdtempSync(join(tmpdir(), "easycode-plugin-config-"))
  const configDirectory = join(directory, ".opencode")

  mkdirSync(configDirectory, { recursive: true })
  writeFileSync(join(configDirectory, "easycode.json"), content)

  return directory
}

describe("EasyCodePlugin", () => {
  it("wires the config handler and logs startup", async () => {
    const logEntries: Array<Record<string, unknown>> = []
    const input = {
      client: {
        app: {
          log(entry: Record<string, unknown>) {
            logEntries.push(entry)
            return Promise.resolve()
          },
        },
      },
      project: "test-project",
      directory: "/tmp/easycode-project",
      worktree: "/tmp/easycode-worktree",
      serverUrl: new URL("https://example.com"),
      $: {} as PluginInput["$"],
    } as unknown as PluginInput

    const hooks = await EasyCodePlugin(input)
    const config: Config = {
      mcp: {
        custom_server: {
          type: "remote",
          url: "https://example.com/custom-server",
        },
      },
    }

    expect(hooks.config).toBeFunction()

    await hooks.config?.(config)

    expect(config.mcp as Record<string, unknown>).toEqual({
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
      custom_server: {
        type: "remote",
        url: "https://example.com/custom-server",
      },
    })
    expect((config.agent as Record<string, unknown>).explorer).toMatchObject({
      permission: {
        edit: "deny",
        task: "deny",
      },
    })
    expect(hooks.tool).toBeDefined()
    expect(Object.keys(hooks.tool ?? {})).not.toHaveLength(0)
    expect(hooks["tool.execute.before"]).toBeFunction()
    expect(hooks["tool.execute.after"]).toBeFunction()
    expect(hooks.event).toBeFunction()
    expect(hooks["experimental.chat.messages.transform"]).toBeFunction()

    const transformOutput: Parameters<NonNullable<Hooks["experimental.chat.messages.transform"]>>[1] = {
      messages: [
        {
          info: {
            id: "user-1",
            sessionID: "session-1",
            role: "user",
            time: {
              created: 1,
            },
            agent: "coder",
            model: {
              providerID: "test-provider",
              modelID: "test-model",
            },
          },
          parts: [{ id: "user-1-hello", sessionID: "session-1", messageID: "user-1", type: "text", text: "hello" }],
        },
      ],
    }

    await hooks["experimental.chat.messages.transform"]?.({}, transformOutput)

    expect(transformOutput.messages[0]?.parts).toHaveLength(2)
    expect(transformOutput.messages[0]?.parts[0]).toMatchObject({
      type: "text",
      text: bootstrapMarkdown,
      synthetic: true,
    })
    expect(transformOutput.messages[0]?.parts[1]).toMatchObject({
      type: "text",
      text: "hello",
    })
    expect(logEntries).toHaveLength(1)
  })

  it("wires agent permission overrides from easycode.json through the plugin config hook", async () => {
    const directory = createDirectoryWithEasyCodeConfig(
      JSON.stringify({
        agent: {
          explorer: {
            permission: {
              edit: "deny",
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
      const hooks = await EasyCodePlugin(
        {
          client: {
            app: {
              log() {
                return Promise.resolve()
              },
            },
          },
          project: "test-project",
          directory,
          worktree: directory,
          serverUrl: new URL("https://example.com"),
          $: {} as PluginInput["$"],
        } as unknown as PluginInput,
      )
      const config: Config = {}

      await hooks.config?.(config)

      expect((config.agent as Record<string, unknown>).explorer).toMatchObject({
        permission: {
          webfetch: "allow",
        },
      })
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("loads bootstrap markdown from the copied plugin layout", async () => {
    const sandbox = mkdtempSync(join(tmpdir(), "easycode-plugin-copied-bootstrap-"))
    const moduleDir = join(sandbox, ".opencode", "plugins")
    const markdownPath = join(sandbox, "src", "hooks", "skill-bootstrap", "skill-bootstrap.md")

    mkdirSync(moduleDir, { recursive: true })
    mkdirSync(join(markdownPath, ".."), { recursive: true })
    writeFileSync(markdownPath, bootstrapMarkdown)

    try {
      const hooks = await EasyCodePlugin(
        {
          client: {
            app: {
              log() {
                return Promise.resolve()
              },
            },
          },
          project: "test-project",
          directory: "/tmp/easycode-project",
          worktree: "/tmp/easycode-worktree",
          serverUrl: new URL("https://example.com"),
          $: {} as PluginInput["$"],
        } as unknown as PluginInput,
        { moduleDir },
      )

      const transformOutput: Parameters<NonNullable<Hooks["experimental.chat.messages.transform"]>>[1] = {
        messages: [
          {
            info: {
              id: "user-1",
              sessionID: "session-1",
              role: "user",
              time: {
                created: 1,
              },
              agent: "coder",
              model: {
                providerID: "test-provider",
                modelID: "test-model",
              },
            },
            parts: [{ id: "user-1-hello", sessionID: "session-1", messageID: "user-1", type: "text", text: "hello" }],
          },
        ],
      }

      await hooks["experimental.chat.messages.transform"]?.({}, transformOutput)

      expect(transformOutput.messages[0]?.parts[0]).toMatchObject({
        type: "text",
        text: bootstrapMarkdown,
        synthetic: true,
      })
    } finally {
      rmSync(sandbox, { recursive: true, force: true })
    }
  })

  it("does not inject bootstrap text when the markdown asset is unavailable", async () => {
    const sandbox = mkdtempSync(join(tmpdir(), "easycode-plugin-no-bootstrap-markdown-"))
    const moduleDir = join(sandbox, "dist")

    mkdirSync(moduleDir, { recursive: true })

    try {
      const hooks = await EasyCodePlugin(
        {
          client: {
            app: {
              log() {
                return Promise.resolve()
              },
            },
          },
          project: "test-project",
          directory: "/tmp/easycode-project",
          worktree: "/tmp/easycode-worktree",
          serverUrl: new URL("https://example.com"),
          $: {} as PluginInput["$"],
        } as unknown as PluginInput,
        { moduleDir },
      )

      const transformOutput: Parameters<NonNullable<Hooks["experimental.chat.messages.transform"]>>[1] = {
        messages: [
          {
            info: {
              id: "user-1",
              sessionID: "session-1",
              role: "user",
              time: {
                created: 1,
              },
              agent: "coder",
              model: {
                providerID: "test-provider",
                modelID: "test-model",
              },
            },
            parts: [{ id: "user-1-hello", sessionID: "session-1", messageID: "user-1", type: "text", text: "hello" }],
          },
        ],
      }

      await hooks["experimental.chat.messages.transform"]?.({}, transformOutput)

      expect(transformOutput.messages[0]?.parts).toEqual([
        { id: "user-1-hello", sessionID: "session-1", messageID: "user-1", type: "text", text: "hello" },
      ])
    } finally {
      rmSync(sandbox, { recursive: true, force: true })
    }
  })

  it("blocks missing todos even before a session is explicitly classified as main", async () => {
    const input = {
      client: {
        session: {
          todo: async () => ({ data: [] }),
          prompt: async () => ({}),
        },
        app: {
          log() {
            return Promise.resolve()
          },
        },
      },
      project: "test-project",
      directory: "/tmp/easycode-project",
      worktree: "/tmp/easycode-worktree",
      serverUrl: new URL("https://example.com"),
      $: {} as PluginInput["$"],
    } as unknown as PluginInput

    const hooks = await EasyCodePlugin(input, {
      todoContinuationCountdownSeconds: 0,
    })

    await expect(
      hooks["tool.execute.before"]?.(
        { tool: "search_code", sessionID: "session-1", callID: "call-1" },
        { args: {} },
      ),
    ).rejects.toThrow(TODO_REQUIRED_BLOCK_MESSAGE)

    await hooks.event?.({
      event: {
        type: "session.updated",
        properties: {
          sessionID: "session-1",
          info: { id: "session-1", mode: "primary" },
        },
      },
    } as any)

    await expect(
      hooks["tool.execute.before"]?.(
        { tool: "search_code", sessionID: "session-1", callID: "call-2" },
        { args: {} },
      ),
    ).rejects.toThrow(TODO_REQUIRED_BLOCK_MESSAGE)
  })

  it("treats orchestrator-tagged sessions as main for todo enforcement", async () => {
    const input = {
      client: {
        session: {
          todo: async () => ({ data: [] }),
          prompt: async () => ({}),
        },
        app: {
          log() {
            return Promise.resolve()
          },
        },
      },
      project: "test-project",
      directory: "/tmp/easycode-project",
      worktree: "/tmp/easycode-worktree",
      serverUrl: new URL("https://example.com"),
      $: {} as PluginInput["$"],
    } as unknown as PluginInput

    const hooks = await EasyCodePlugin(input)

    await hooks.event?.({
      event: {
        type: "message.updated",
        properties: {
          sessionID: "session-orchestrator",
          info: { id: "session-orchestrator", agent: "orchestrator" },
        },
      },
    } as any)

    await expect(
      hooks["tool.execute.before"]?.(
        { tool: "search_code", sessionID: "session-orchestrator", callID: "call-1" },
        { args: {} },
      ),
    ).rejects.toThrow(TODO_REQUIRED_BLOCK_MESSAGE)
  })

  it("keeps idle continuation prompts active for subagent sessions", async () => {
    const promptCalls: Array<unknown> = []
    const input = {
      client: {
        session: {
          todo: async () => ({ data: [{ content: "task", status: "pending" }] }),
          prompt(payload: unknown) {
            promptCalls.push(payload)
            return Promise.resolve({})
          },
        },
        app: {
          log() {
            return Promise.resolve()
          },
        },
      },
      project: "test-project",
      directory: "/tmp/easycode-project",
      worktree: "/tmp/easycode-worktree",
      serverUrl: new URL("https://example.com"),
      $: {} as PluginInput["$"],
    } as unknown as PluginInput

    const hooks = await EasyCodePlugin(input, {
      todoContinuationCountdownSeconds: 0,
    })

    await hooks.event?.({
      event: {
        type: "session.updated",
        properties: {
          sessionID: "child-1",
          info: { id: "child-1", parentID: "ses_main_1" },
        },
      },
    } as any)

    await expect(
      hooks["tool.execute.before"]?.(
        { tool: "search_code", sessionID: "child-1", callID: "call-1" },
        { args: {} },
      ),
    ).resolves.toBeUndefined()

    const output = { title: "", output: "ok", metadata: {} }
    for (let i = 0; i < 20; i += 1) {
      await hooks["tool.execute.after"]?.(
        { tool: "search_code", sessionID: "child-1", callID: `call-${i}`, args: {} },
        output,
      )
    }

    expect(output.output).not.toContain(TODO_STALE_REMINDER)

    await hooks.event?.({
      event: {
        type: "session.idle",
        properties: { sessionID: "child-1" },
      },
    } as any)

    expect(promptCalls).toHaveLength(1)
  })

  it("keeps todo reminders active for unclassified resumed sessions", async () => {
    const input = {
      client: {
        session: {
          todo: async () => ({ data: [{ content: "task", status: "pending" }] }),
          prompt: async () => ({}),
        },
        app: {
          log() {
            return Promise.resolve()
          },
        },
      },
      project: "test-project",
      directory: "/tmp/easycode-project",
      worktree: "/tmp/easycode-worktree",
      serverUrl: new URL("https://example.com"),
      $: {} as PluginInput["$"],
    } as unknown as PluginInput

    const hooks = await EasyCodePlugin(input)
    const output = { title: "", output: "ok", metadata: {} }

    for (let i = 0; i < 20; i += 1) {
      await hooks["tool.execute.after"]?.(
        { tool: "search_code", sessionID: "session-resumed", callID: `call-${i}`, args: {} },
        output,
      )
    }

    expect(output.output).toContain(TODO_STALE_REMINDER)
  })

  it("keeps idle continuation active for unclassified resumed sessions", async () => {
    const promptCalls: Array<unknown> = []
    const input = {
      client: {
        session: {
          todo: async () => ({ data: [{ content: "task", status: "pending" }] }),
          prompt(payload: unknown) {
            promptCalls.push(payload)
            return Promise.resolve({})
          },
        },
        app: {
          log() {
            return Promise.resolve()
          },
        },
      },
      project: "test-project",
      directory: "/tmp/easycode-project",
      worktree: "/tmp/easycode-worktree",
      serverUrl: new URL("https://example.com"),
      $: {} as PluginInput["$"],
    } as unknown as PluginInput

    const hooks = await EasyCodePlugin(input, {
      todoContinuationCountdownSeconds: 0,
    })

    await hooks.event?.({
      event: {
        type: "session.idle",
        properties: { sessionID: "session-resumed" },
      },
    } as any)

    expect(promptCalls).toHaveLength(1)
  })

  it("prefers worktree-local easycode.json when directory and worktree both have config", async () => {
    const directory = mkdtempSync(join(tmpdir(), "easycode-plugin-directory-"))
    const worktree = mkdtempSync(join(tmpdir(), "easycode-plugin-worktree-"))

    mkdirSync(join(directory, ".opencode"))
    mkdirSync(join(worktree, ".opencode"))
    writeFileSync(join(directory, ".opencode", "easycode.json"), JSON.stringify({ mcp: { websearch: { enabled: false } } }))
    writeFileSync(join(worktree, ".opencode", "easycode.json"), JSON.stringify({ mcp: { websearch: { enabled: true } } }))

    try {
      const hooks = await EasyCodePlugin({
        client: {
          app: {
            log() {
              return Promise.resolve()
            },
          },
        },
        project: "test-project",
        directory,
        worktree,
        serverUrl: new URL("https://example.com"),
        $: {} as PluginInput["$"],
      } as unknown as PluginInput)
      const config: Config = { mcp: {} }

      await hooks.config?.(config)

      expect(config.mcp as Record<string, unknown>).toEqual({
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
        websearch: {
          type: "remote",
          url: "https://mcp.exa.ai/mcp",
        },
      })
    } finally {
      rmSync(directory, { recursive: true, force: true })
      rmSync(worktree, { recursive: true, force: true })
    }
  })

  it("falls back to directory easycode.json when worktree config is absent", async () => {
    const directory = mkdtempSync(join(tmpdir(), "easycode-plugin-directory-"))
    const worktree = mkdtempSync(join(tmpdir(), "easycode-plugin-worktree-"))

    mkdirSync(join(directory, ".opencode"))
    writeFileSync(join(directory, ".opencode", "easycode.json"), JSON.stringify({ mcp: { websearch: { enabled: true } } }))

    try {
      const hooks = await EasyCodePlugin({
        client: {
          app: {
            log() {
              return Promise.resolve()
            },
          },
        },
        project: "test-project",
        directory,
        worktree,
        serverUrl: new URL("https://example.com"),
        $: {} as PluginInput["$"],
      } as unknown as PluginInput)
      const config: Config = { mcp: {} }

      await hooks.config?.(config)

      expect(config.mcp as Record<string, unknown>).toEqual({
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
        websearch: {
          type: "remote",
          url: "https://mcp.exa.ai/mcp",
        },
      })
    } finally {
      rmSync(directory, { recursive: true, force: true })
      rmSync(worktree, { recursive: true, force: true })
    }
  })

  it("falls back to directory easycode.json when worktree config is invalid", async () => {
    const directory = mkdtempSync(join(tmpdir(), "easycode-plugin-directory-"))
    const worktree = mkdtempSync(join(tmpdir(), "easycode-plugin-worktree-"))

    mkdirSync(join(directory, ".opencode"))
    mkdirSync(join(worktree, ".opencode"))
    writeFileSync(join(directory, ".opencode", "easycode.json"), JSON.stringify({ mcp: { websearch: { enabled: true } } }))
    writeFileSync(join(worktree, ".opencode", "easycode.json"), "{ invalid json")

    try {
      const hooks = await EasyCodePlugin({
        client: {
          app: {
            log() {
              return Promise.resolve()
            },
          },
        },
        project: "test-project",
        directory,
        worktree,
        serverUrl: new URL("https://example.com"),
        $: {} as PluginInput["$"],
      } as unknown as PluginInput)
      const config: Config = { mcp: {} }

      await hooks.config?.(config)

      expect(config.mcp as Record<string, unknown>).toEqual({
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
        websearch: {
          type: "remote",
          url: "https://mcp.exa.ai/mcp",
        },
      })
    } finally {
      rmSync(directory, { recursive: true, force: true })
      rmSync(worktree, { recursive: true, force: true })
    }
  })

  it("falls back to global easycode.json when local config is absent", async () => {
    const fakeHome = mkdtempSync(join(tmpdir(), "easycode-plugin-fake-home-"))
    const globalConfigDir = join(fakeHome, ".config", "opencode")
    const directory = mkdtempSync(join(tmpdir(), "easycode-plugin-no-local-"))
    const worktree = mkdtempSync(join(tmpdir(), "easycode-plugin-no-local-wt-"))

    mkdirSync(globalConfigDir, { recursive: true })
    writeFileSync(join(globalConfigDir, "easycode.json"), JSON.stringify({ mcp: { websearch: { enabled: true } } }))

    try {
      const result = spawnSync(
        "bun",
        ["-e", `
          const { EasyCodePlugin } = await import("${pluginRoot}");
          const hooks = await EasyCodePlugin({
            client: { app: { log() { return Promise.resolve() } } },
            project: "test-project",
            directory: "${directory}",
            worktree: "${worktree}",
            serverUrl: new URL("https://example.com"),
            $: {},
          });
          const config = { mcp: {} };
          await hooks.config?.(config);
          console.log(JSON.stringify(config.mcp));
        `],
        { env: { ...process.env, HOME: fakeHome }, encoding: "utf-8" },
      )

      expect(result.status).toBe(0)
      const mcp = JSON.parse(result.stdout.trim())

      expect(mcp).toEqual({
        context7: { type: "remote", url: "https://mcp.context7.com/mcp" },
        grep_app: { type: "remote", url: "https://mcp.grep.app" },
        sequential_thinking: { type: "local", command: ["npx", "-y", "@modelcontextprotocol/server-sequential-thinking"] },
        websearch: { type: "remote", url: "https://mcp.exa.ai/mcp" },
      })
    } finally {
      rmSync(fakeHome, { recursive: true, force: true })
      rmSync(directory, { recursive: true, force: true })
      rmSync(worktree, { recursive: true, force: true })
    }
  })

  it("prefers local easycode.json over global through the real config hook path", async () => {
    const fakeHome = mkdtempSync(join(tmpdir(), "easycode-plugin-fake-home-prio-"))
    const globalConfigDir = join(fakeHome, ".config", "opencode")
    const localDir = mkdtempSync(join(tmpdir(), "easycode-plugin-local-prio-"))
    const localConfigDir = join(localDir, ".opencode")

    mkdirSync(localConfigDir, { recursive: true })
    writeFileSync(join(localConfigDir, "easycode.json"), JSON.stringify({ mcp: { websearch: { enabled: false } } }))
    mkdirSync(globalConfigDir, { recursive: true })
    writeFileSync(join(globalConfigDir, "easycode.json"), JSON.stringify({ mcp: { websearch: { enabled: true, apiKey: "global-key" } } }))

    try {
      const result = spawnSync(
        "bun",
        ["-e", `
          const { EasyCodePlugin } = await import("${pluginRoot}");
          const hooks = await EasyCodePlugin({
            client: { app: { log() { return Promise.resolve() } } },
            project: "test-project",
            directory: "${localDir}",
            worktree: "${localDir}",
            serverUrl: new URL("https://example.com"),
            $: {},
          });
          const config = { mcp: {} };
          await hooks.config?.(config);
          console.log(JSON.stringify(config.mcp));
        `],
        { env: { ...process.env, HOME: fakeHome }, encoding: "utf-8" },
      )

      expect(result.status).toBe(0)
      const mcp = JSON.parse(result.stdout.trim())

      expect(mcp).toEqual({
        context7: { type: "remote", url: "https://mcp.context7.com/mcp" },
        grep_app: { type: "remote", url: "https://mcp.grep.app" },
        sequential_thinking: { type: "local", command: ["npx", "-y", "@modelcontextprotocol/server-sequential-thinking"] },
        websearch: { type: "remote", url: "https://mcp.exa.ai/mcp", enabled: false },
      })
    } finally {
      rmSync(fakeHome, { recursive: true, force: true })
      rmSync(localDir, { recursive: true, force: true })
    }
  })
})
