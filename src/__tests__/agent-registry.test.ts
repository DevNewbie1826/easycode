import { describe, expect, it } from "bun:test"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { createBuiltinAgentRegistry, loadAgentRegistry, loadBuiltinAgentRegistry } from "../agents/registry"
import explorerAgent from "../agents/definitions/explorer.agent"
import librarianAgent from "../agents/definitions/librarian.agent"
import orchestratorAgent from "../agents/definitions/orchestrator.agent"
import { loadAgentPrompt } from "../agents/prompt-loader"

function createPluginLayout(moduleDirSegments: string[]) {
  const sandboxDir = mkdtempSync(join(tmpdir(), "easycode-agent-registry-"))
  const moduleDir = join(sandboxDir, ...moduleDirSegments)
  const definitionsDir = join(
    moduleDir,
    ...(moduleDirSegments.length === 1 ? ["..", "src", "agents", "definitions"] : ["..", "..", "src", "agents", "definitions"]),
  )

  mkdirSync(moduleDir, { recursive: true })
  mkdirSync(definitionsDir, { recursive: true })

  return { sandboxDir, moduleDir, definitionsDir }
}

function writeAgentFile(definitionsDir: string, fileName: string, agentName: string) {
  writeFileSync(
    join(definitionsDir, fileName),
    `export default {
  name: ${JSON.stringify(agentName)},
  description: ${JSON.stringify(`${agentName} description`)},
  prompt: ${JSON.stringify(`${agentName} prompt`)},
  mode: "subagent",
}\n`,
  )
}

describe("loadAgentRegistry", () => {
  it("sorts agent names alphabetically", () => {
    const registry = loadAgentRegistry([
      {
        default: {
          name: "writer",
          description: "Writer agent",
          prompt: "Write clearly.",
          mode: "subagent",
        },
      },
      {
        default: {
          name: "analyst",
          description: "Analyst agent",
          prompt: "Analyze carefully.",
          mode: "subagent",
        },
      },
      {
        default: {
          name: "explorer",
          description: "Explorer agent",
          prompt: "Explore carefully.",
          mode: "subagent",
        },
      },
    ])

    expect(registry.map((agent) => agent.name)).toEqual(["analyst", "explorer", "writer"])
  })

  it("throws when two modules declare the same name", () => {
    expect(() =>
      loadAgentRegistry([
        {
          default: {
            name: "explorer",
            description: "First explorer",
            prompt: "Explore once.",
            mode: "subagent",
          },
        },
        {
          default: {
            name: "explorer",
            description: "Second explorer",
            prompt: "Explore twice.",
            mode: "subagent",
          },
        },
      ]),
    ).toThrow('Duplicate agent name: "explorer"')
  })

  it("throws when a module does not export a valid agent definition", () => {
    expect(() => loadAgentRegistry([{ default: { name: "broken" } }])).toThrow("Invalid agent module at index 0")
  })

  it("accepts agents with primary mode", () => {
    const registry = loadAgentRegistry([
      {
        default: {
          name: "lead",
          description: "Lead agent",
          prompt: "Coordinate the session.",
          mode: "primary",
        },
      },
    ])

    expect(registry).toEqual([
      {
        name: "lead",
        description: "Lead agent",
        prompt: "Coordinate the session.",
        mode: "primary",
      },
    ])
  })
})

describe("explorer agent definition", () => {
  it("loads its prompt from the markdown asset", () => {
    const promptPath = join(
      dirname(fileURLToPath(import.meta.url)),
      "..",
      "agents",
      "prompt-text",
      "explorer-prompt.md",
    )

    expect(explorerAgent.prompt).toBe(readFileSync(promptPath, "utf8").trim())
  })

  it("loads prompt text without needing the caller module url", () => {
    expect(loadAgentPrompt("explorer-prompt.md")).toBe(explorerAgent.prompt)
  })

  it("exposes builtin default temperature", () => {
    expect(explorerAgent.defaults).toEqual({
      temperature: 0.1,
      permission: {
        apply_patch: "deny",
        ast_grep_replace: "deny",
        bash: "deny",
        edit: "deny",
        lsp_rename: "deny",
        task: "deny",
      },
    })
  })

  it("exposes builtin default permissions for read-only investigation", () => {
    expect(explorerAgent.defaults?.permission).toEqual({
      apply_patch: "deny",
      ast_grep_replace: "deny",
      bash: "deny",
      edit: "deny",
      lsp_rename: "deny",
      task: "deny",
    })
  })
})

describe("librarian agent definition", () => {
  it("exposes builtin default permissions for external research", () => {
    expect(librarianAgent.defaults?.permission).toEqual({
      apply_patch: "deny",
      ast_grep_replace: "deny",
      bash: "deny",
      edit: "deny",
      lsp_rename: "deny",
      task: "deny",
    })
  })
})

describe("orchestrator agent definition", () => {
  it("loads its prompt from the markdown asset", () => {
    const promptPath = join(
      dirname(fileURLToPath(import.meta.url)),
      "..",
      "agents",
      "prompt-text",
      "orchestrator-prompt.md",
    )

    expect(orchestratorAgent.prompt).toBe(readFileSync(promptPath, "utf8").trim())
  })

  it("loads prompt text without needing the caller module url", () => {
    expect(loadAgentPrompt("orchestrator-prompt.md")).toBe(orchestratorAgent.prompt)
  })

  it("exposes deny-first todo-sync skill defaults for orchestrator", () => {
    expect(orchestratorAgent.mode).toBe("primary")
    expect(orchestratorAgent.defaults).toEqual({
      color: "#6A5CFF",
      permission: {
        apply_patch: "deny",
        question: "allow",
        skill: {
          "*": "deny",
          "todo-sync": "allow",
        },
      },
    })

    expect(Object.entries(orchestratorAgent.defaults?.permission?.skill ?? {})).toEqual([
      ["*", "deny"],
      ["todo-sync", "allow"],
    ])
  })
})

describe("builtin agent discovery", () => {
  it("loads builtin agents from a definitions module map with alphabetical ordering", () => {
    const registry = createBuiltinAgentRegistry({
      "./definitions/writer.agent.ts": {
        default: {
          name: "writer",
          description: "Writer agent",
          prompt: "Write clearly.",
          mode: "subagent",
        },
      },
      "./definitions/analyst.agent.ts": {
        default: {
          name: "analyst",
          description: "Analyst agent",
          prompt: "Analyze carefully.",
          mode: "primary",
        },
      },
      "./definitions/explorer.agent.ts": {
        default: {
          name: "explorer",
          description: "Explorer agent",
          prompt: "Explore carefully.",
          mode: "subagent",
        },
      },
    })

    expect(registry.map((agent) => agent.name)).toEqual(["analyst", "explorer", "writer"])
  })

  it("loads builtin agent files from the packaged plugin layout", async () => {
    const { sandboxDir, moduleDir, definitionsDir } = createPluginLayout(["dist"])

    writeAgentFile(definitionsDir, "explorer.agent.ts", "explorer")
    writeAgentFile(definitionsDir, "analyst.agent.ts", "analyst")

    try {
      expect((await loadBuiltinAgentRegistry(moduleDir)).map((agent) => agent.name)).toEqual(["analyst", "explorer"])
    } finally {
      rmSync(sandboxDir, { recursive: true, force: true })
    }
  })

  it("loads builtin agent files from the local copied-plugin layout", async () => {
    const { sandboxDir, moduleDir, definitionsDir } = createPluginLayout([".opencode", "plugins"])

    writeAgentFile(definitionsDir, "explorer.agent.ts", "explorer")
    writeAgentFile(definitionsDir, "builder.agent.ts", "builder")

    try {
      expect((await loadBuiltinAgentRegistry(moduleDir)).map((agent) => agent.name)).toEqual(["builder", "explorer"])
    } finally {
      rmSync(sandboxDir, { recursive: true, force: true })
    }
  })
})
