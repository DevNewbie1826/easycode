import { describe, expect, it } from "bun:test"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { Hooks } from "@opencode-ai/plugin"
import { createSkillBootstrapTransform } from "../hooks/skill-bootstrap"

const SKILL_BOOTSTRAP_SENTINEL = "<SESSION_BOOTSTRAP_MANDATORY>"

type SkillBootstrapTransform = NonNullable<Hooks["experimental.chat.messages.transform"]>
type HookOutput = Parameters<SkillBootstrapTransform>[1]

const worktreeRoot = join(import.meta.dir, "..", "..")
const bootstrapMarkdown = readFileSync(
  join(worktreeRoot, "src", "hooks", "skill-bootstrap", "skill-bootstrap.md"),
  "utf8",
)

function createTextPart(messageID: string, text: string) {
  return {
    id: `${messageID}-${text}`,
    sessionID: "session-1",
    messageID,
    type: "text" as const,
    text,
  }
}

function createAssistantMessage(): HookOutput["messages"][number] {
  return {
    info: {
      id: "assistant-1",
      sessionID: "session-1",
      role: "assistant",
      time: {
        created: 1,
      },
      parentID: "user-0",
      modelID: "test-model",
      providerID: "test-provider",
      mode: "chat",
      path: {
        cwd: "/tmp",
        root: "/tmp",
      },
      cost: 0,
      tokens: {
        input: 0,
        output: 0,
        reasoning: 0,
        cache: {
          read: 0,
          write: 0,
        },
      },
    },
    parts: [createTextPart("assistant-1", "system prompt")],
  }
}

function createUserMessageWithId(messageID: string, text: string): HookOutput["messages"][number] {
  return {
    info: {
      id: messageID,
      sessionID: "session-1",
      role: "user",
      time: {
        created: 2,
      },
      agent: "coder",
      model: {
        providerID: "test-provider",
        modelID: "test-model",
      },
    },
    parts: [createTextPart(messageID, text)],
  }
}

function createPackagedPluginLayout() {
  const sandboxDir = mkdtempSync(join(tmpdir(), "easycode-skill-bootstrap-packaged-"))
  const pluginDir = join(sandboxDir, "plugin")
  const moduleDir = join(pluginDir, "dist")
  const markdownPath = join(pluginDir, "src", "hooks", "skill-bootstrap", "skill-bootstrap.md")

  mkdirSync(join(markdownPath, ".."), { recursive: true })
  writeFileSync(markdownPath, bootstrapMarkdown)

  return { sandboxDir, moduleDir }
}

function createCopiedPluginLayout() {
  const sandboxDir = mkdtempSync(join(tmpdir(), "easycode-skill-bootstrap-copied-"))
  const moduleDir = join(sandboxDir, ".opencode", "plugins")
  const markdownPath = join(sandboxDir, "src", "hooks", "skill-bootstrap", "skill-bootstrap.md")

  mkdirSync(join(markdownPath, ".."), { recursive: true })
  writeFileSync(markdownPath, bootstrapMarkdown)

  return { sandboxDir, moduleDir }
}

describe("createSkillBootstrapTransform", () => {
  it("loads markdown from the packaged plugin layout and prepends it to the first user message", async () => {
    const { sandboxDir, moduleDir } = createPackagedPluginLayout()
    const transform: SkillBootstrapTransform = createSkillBootstrapTransform({ moduleDir })
    const output: HookOutput = {
      messages: [createAssistantMessage(), createUserMessageWithId("user-1", "hello")],
    }

    try {
      const result = transform({}, output)

      expect(result).toBeInstanceOf(Promise)

      await result

      expect(output.messages[1]?.parts).toEqual([
        {
          id: "user-1-easycode-skill-bootstrap",
          sessionID: "session-1",
          messageID: "user-1",
          type: "text",
          text: bootstrapMarkdown,
          synthetic: true,
        },
        createTextPart("user-1", "hello"),
      ])
      expect(bootstrapMarkdown).toContain(SKILL_BOOTSTRAP_SENTINEL)
    } finally {
      rmSync(sandboxDir, { recursive: true, force: true })
    }
  })

  it("loads markdown from the copied plugin layout", async () => {
    const { sandboxDir, moduleDir } = createCopiedPluginLayout()
    const transform: SkillBootstrapTransform = createSkillBootstrapTransform({ moduleDir })
    const output: HookOutput = {
      messages: [createAssistantMessage(), createUserMessageWithId("user-1", "hello")],
    }

    try {
      await transform({}, output)

      expect(output.messages[1]?.parts[0]).toMatchObject({
        id: "user-1-easycode-skill-bootstrap",
        type: "text",
        text: bootstrapMarkdown,
        synthetic: true,
      })
    } finally {
      rmSync(sandboxDir, { recursive: true, force: true })
    }
  })

  it("targets the first user message instead of the latest one", async () => {
    const transform: SkillBootstrapTransform = createSkillBootstrapTransform()
    const output: HookOutput = {
      messages: [
        createUserMessageWithId("user-old", "original task"),
        createAssistantMessage(),
        createUserMessageWithId("user-new", "continued task"),
      ],
    }

    await transform({}, output)

    expect(output.messages[0]?.parts[0]).toMatchObject({
      id: "user-old-easycode-skill-bootstrap",
      text: bootstrapMarkdown,
      synthetic: true,
    })
    expect(output.messages[2]?.parts).toEqual([createTextPart("user-new", "continued task")])
  })

  it("does not inject bootstrap into later messages after the first user message was already bootstrapped", async () => {
    const transform: SkillBootstrapTransform = createSkillBootstrapTransform()
    const output: HookOutput = {
      messages: [
        {
          ...createUserMessageWithId("user-old", "original task"),
          parts: [
            {
              id: "user-old-easycode-skill-bootstrap",
              sessionID: "session-1",
              messageID: "user-old",
              type: "text",
              text: bootstrapMarkdown,
              synthetic: true,
            },
            createTextPart("user-old", "original task"),
          ],
        },
        createAssistantMessage(),
        createUserMessageWithId("user-new", "continued task"),
      ],
    }

    await transform({}, output)

    expect(output.messages[0]?.parts).toEqual([
      {
        id: "user-old-easycode-skill-bootstrap",
        sessionID: "session-1",
        messageID: "user-old",
        type: "text",
        text: bootstrapMarkdown,
        synthetic: true,
      },
      createTextPart("user-old", "original task"),
    ])
    expect(output.messages[2]?.parts).toEqual([createTextPart("user-new", "continued task")])
  })

  it("does not reinject when an older bootstrap part uses the new sentinel with different wording", async () => {
    const transform: SkillBootstrapTransform = createSkillBootstrapTransform()
    const output: HookOutput = {
      messages: [
        {
          ...createUserMessageWithId("user-old", "original task"),
          parts: [
            {
              id: "user-old-easycode-skill-bootstrap",
              sessionID: "session-1",
              messageID: "user-old",
              type: "text",
              text: `${SKILL_BOOTSTRAP_SENTINEL}\n\nOlder bootstrap copy with slightly different wording.`,
              synthetic: true,
            },
            createTextPart("user-old", "original task"),
          ],
        },
        createAssistantMessage(),
        createUserMessageWithId("user-new", "continued task"),
      ],
    }

    await transform({}, output)

    expect(output.messages[0]?.parts).toEqual([
      {
        id: "user-old-easycode-skill-bootstrap",
        sessionID: "session-1",
        messageID: "user-old",
        type: "text",
        text: `${SKILL_BOOTSTRAP_SENTINEL}\n\nOlder bootstrap copy with slightly different wording.`,
        synthetic: true,
      },
      createTextPart("user-old", "original task"),
    ])
    expect(output.messages[2]?.parts).toEqual([createTextPart("user-new", "continued task")])
  })

  it("still injects bootstrap when user text mentions the old broad marker prefix", async () => {
    const transform: SkillBootstrapTransform = createSkillBootstrapTransform()
    const output: HookOutput = {
      messages: [
        createUserMessageWithId(
          "user-1",
          "Please literally include [SESSION BOOTSTRAP in the generated documentation.",
        ),
      ],
    }

    await transform({}, output)

    expect(output.messages[0]?.parts).toEqual([
      {
        id: "user-1-easycode-skill-bootstrap",
        sessionID: "session-1",
        messageID: "user-1",
        type: "text",
        text: bootstrapMarkdown,
        synthetic: true,
      },
      createTextPart("user-1", "Please literally include [SESSION BOOTSTRAP in the generated documentation."),
    ])
  })

  it("does nothing when the hook output has no user message", async () => {
    const transform: SkillBootstrapTransform = createSkillBootstrapTransform()
    const output: HookOutput = {
      messages: [createAssistantMessage()],
    }

    await transform({}, output)

    expect(output.messages[0]?.parts).toEqual([createTextPart("assistant-1", "system prompt")])
  })

  it("does nothing when bootstrap is disabled", async () => {
    const transform: SkillBootstrapTransform = createSkillBootstrapTransform({ enabled: false })
    const output: HookOutput = {
      messages: [createAssistantMessage(), createUserMessageWithId("user-1", "hello")],
    }

    await transform({}, output)

    expect(output.messages[1]?.parts).toEqual([createTextPart("user-1", "hello")])
  })

  it("does nothing when the bootstrap markdown asset cannot be resolved", async () => {
    const sandboxDir = mkdtempSync(join(tmpdir(), "easycode-skill-bootstrap-missing-"))
    const moduleDir = join(sandboxDir, "dist")

    mkdirSync(moduleDir, { recursive: true })

    const transform: SkillBootstrapTransform = createSkillBootstrapTransform({ moduleDir })
    const output: HookOutput = {
      messages: [createAssistantMessage(), createUserMessageWithId("user-1", "hello")],
    }

    try {
      await transform({}, output)

      expect(output.messages[1]?.parts).toEqual([createTextPart("user-1", "hello")])
    } finally {
      rmSync(sandboxDir, { recursive: true, force: true })
    }
  })
})
