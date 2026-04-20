import { describe, expect, it } from "bun:test"
import { cpSync, existsSync, mkdtempSync, rmSync, statSync } from "node:fs"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { spawnSync } from "node:child_process"
import { tmpdir } from "node:os"
import type { Config, Hooks, PluginInput } from "@opencode-ai/plugin"
import { SKILL_BOOTSTRAP_MARKER } from "../hooks/skill-bootstrap"

const worktreeRoot = join(import.meta.dir, "..", "..")

function readPackageJson(): Record<string, unknown> {
  return JSON.parse(require("node:fs").readFileSync(resolve(worktreeRoot, "package.json"), "utf-8")) as Record<string, unknown>
}

function resolvePackageEntry(packageJson: Record<string, unknown>): string {
  const exports = packageJson.exports as Record<string, Record<string, string>> | undefined
  const main = typeof packageJson.main === "string"
    ? packageJson.main
    : typeof exports?.["."]?.import === "string"
      ? exports["."].import
      : undefined

  if (!main) {
    throw new Error("Package entry not found in package.json")
  }

  return resolve(worktreeRoot, main)
}

function createFakePluginInput(directory = "/tmp/easycode-project", worktree = "/tmp/easycode-worktree"): PluginInput {
  return {
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
  } as unknown as PluginInput
}

/** Create an isolated temp sandbox with a shallow copy of the worktree source tree. */
function createSandbox(): string {
  const sandbox = mkdtempSync(join(tmpdir(), "easycode-sandbox-"))
  // Copy only what npm pack would include plus package.json for builds
  cpSync(resolve(worktreeRoot, "package.json"), join(sandbox, "package.json"))
  cpSync(resolve(worktreeRoot, "tsconfig.json"), join(sandbox, "tsconfig.json"))
  cpSync(resolve(worktreeRoot, "src"), join(sandbox, "src"), { recursive: true })
  return sandbox
}

describe("package entry", () => {
  it("declares a runtime entry that exists in a clean checkout", () => {
    const packageJson = readPackageJson()
    const entryPath = resolvePackageEntry(packageJson)

    expect(existsSync(entryPath)).toBeTrue()
  })

  it("can be imported and produces a working plugin", async () => {
    const packageJson = readPackageJson()
    const entryPath = resolvePackageEntry(packageJson)
    const entryUrl = pathToFileURL(entryPath).href

    const { default: EasyCodePlugin } = (await import(entryUrl)) as {
      default: (input: PluginInput, options?: Record<string, unknown>) => Promise<Hooks>
    }

    const hooks = await EasyCodePlugin(createFakePluginInput())

    expect(hooks.config).toBeFunction()

    const config: Record<string, unknown> = {}

    await hooks.config?.(config as Config)

    const skills = config.skills as Record<string, unknown> | undefined
    const paths = skills?.paths as string[] | undefined

    expect(Array.isArray(paths)).toBeTrue()
    expect(paths!.length).toBeGreaterThan(0)
    expect(paths!.some((p) => p.endsWith(join("src", "skills")))).toBeTrue()
  })

  it("registers at least one builtin agent through the config hook", async () => {
    const packageJson = readPackageJson()
    const entryPath = resolvePackageEntry(packageJson)
    const entryUrl = pathToFileURL(entryPath).href

    const { default: EasyCodePlugin } = (await import(entryUrl)) as {
      default: (input: PluginInput, options?: Record<string, unknown>) => Promise<Hooks>
    }

    const hooks = await EasyCodePlugin(createFakePluginInput())
    const config: Record<string, unknown> = {}

    await hooks.config?.(config as Config)

    const agent = config.agent as Record<string, unknown> | undefined

    expect(agent).toBeDefined()
    expect(typeof agent).toBe("object")
    expect((agent as Record<string, unknown>)!.orchestrator).toBeDefined()
  })

  it("injects bootstrap markdown containing the mandatory marker", async () => {
    const packageJson = readPackageJson()
    const entryPath = resolvePackageEntry(packageJson)
    const entryUrl = pathToFileURL(entryPath).href

    const { default: EasyCodePlugin } = (await import(entryUrl)) as {
      default: (input: PluginInput, options?: Record<string, unknown>) => Promise<Hooks>
    }

    const hooks = await EasyCodePlugin(createFakePluginInput())

    const transformOutput: Parameters<NonNullable<Hooks["experimental.chat.messages.transform"]>>[1] = {
      messages: [
        {
          info: {
            id: "user-1",
            sessionID: "session-1",
            role: "user",
            time: { created: 1 },
            agent: "coder",
            model: { providerID: "test-provider", modelID: "test-model" },
          },
          parts: [{ id: "user-1-hello", sessionID: "session-1", messageID: "user-1", type: "text", text: "hello" }],
        },
      ],
    }

    await hooks["experimental.chat.messages.transform"]?.({}, transformOutput)

    expect(transformOutput.messages[0]?.parts[0]).toMatchObject({
      type: "text",
      synthetic: true,
    })

    const firstPartText = (transformOutput.messages[0]?.parts[0] as { text: string }).text

    expect(firstPartText).toContain(SKILL_BOOTSTRAP_MARKER)
  })
})

describe("package manifest consistency", () => {
  function readPackageJsonForManifest(): Record<string, unknown> {
    return JSON.parse(require("node:fs").readFileSync(resolve(worktreeRoot, "package.json"), "utf-8")) as Record<string, unknown>
  }

  it("declares main and exports[\".\"].import pointing to the same source entry", () => {
    const packageJson = readPackageJsonForManifest()
    const main = packageJson.main
    const exportsEntry = (packageJson.exports as Record<string, Record<string, string>> | undefined)?.["."]

    expect(typeof main).toBe("string")
    expect(typeof exportsEntry?.import).toBe("string")
    expect(main).toEqual(exportsEntry!.import)
  })

  it("does not declare types pointing outside the files array", () => {
    const packageJson = readPackageJsonForManifest()
    const files = packageJson.files as string[] | undefined

    expect(Array.isArray(files)).toBeTrue()

    const topTypes = typeof packageJson.types === "string" ? (packageJson.types as string) : undefined
    const exportsTypes = (packageJson.exports as Record<string, Record<string, string>> | undefined)?.["."]?.types

    for (const typesPath of [topTypes, exportsTypes]) {
      if (typesPath === undefined) {
        continue
      }

      const normalized = typesPath.startsWith("./") ? typesPath.slice(2) : typesPath
      const rootSegment = normalized.split("/")[0]
      const covered = files!.some((f) => f === rootSegment || f.startsWith(rootSegment + "/"))

      expect(covered).toBeTrue()
    }
  })

  it("every declared file entry exists in the working tree", () => {
    const packageJson = readPackageJsonForManifest()
    const files = packageJson.files as string[]

    for (const entry of files) {
      expect(existsSync(resolve(worktreeRoot, entry))).toBeTrue()
    }
  })

  it("declares files covering runtime source only", () => {
    const packageJson = readPackageJsonForManifest()
    const files = packageJson.files as string[]

    expect(files.length).toBeGreaterThan(0)
    expect(files.every((f) => typeof f === "string")).toBeTrue()
    expect(files.some((f) => f === "src" || f.startsWith("src/"))).toBeTrue()
    expect(files).not.toContain("dist")
    expect(files).not.toContain("__tests__")
  })

  it("main entry is covered by a declared files entry", () => {
    const packageJson = readPackageJsonForManifest()
    const main = packageJson.main as string
    const files = packageJson.files as string[]
    const normalized = main.startsWith("./") ? main.slice(2) : main

    const covered = files.some((f) => normalized === f || normalized.startsWith(f + "/"))
    expect(covered).toBeTrue()
  })

  it("packed tarball excludes test files and includes runtime assets", () => {
    const sandbox = createSandbox()

    try {
      const tarballResult = spawnSync(
        "npm",
        ["pack", "--silent"],
        { cwd: sandbox, encoding: "utf-8" },
      )
      expect(tarballResult.status).toBe(0)

      const tarballName = tarballResult.stdout.trim().split("\n").pop()!
      const tarballPath = resolve(sandbox, tarballName)

      try {
        const listResult = spawnSync("tar", ["tf", tarballPath], { encoding: "utf-8" })
        expect(listResult.status).toBe(0)

        const entries = listResult.stdout.split("\n").filter(Boolean)

        const testEntries = entries.filter((e) => e.includes("__tests__"))
        expect(testEntries).toHaveLength(0)

        const srcEntries = entries.filter((e) => e.startsWith("package/src/") && !e.includes("__tests__"))
        expect(srcEntries.length).toBeGreaterThan(0)

        const hasIndex = entries.some((e) => e === "package/src/index.ts")
        expect(hasIndex).toBeTrue()

        const hasAgents = entries.some((e) => e.includes("package/src/agents/"))
        expect(hasAgents).toBeTrue()

        const hasSkills = entries.some((e) => e.includes("package/src/skills/"))
        expect(hasSkills).toBeTrue()

        const hasBootstrap = entries.some((e) => e.includes("skill-bootstrap.md"))
        expect(hasBootstrap).toBeTrue()
      } finally {
        rmSync(tarballPath, { force: true })
      }
    } finally {
      rmSync(sandbox, { recursive: true, force: true })
    }
  })

  it("packed tarball installs and runs correctly", () => {
    const sandbox = createSandbox()

    try {
      const tarballResult = spawnSync(
        "npm",
        ["pack", "--silent"],
        { cwd: sandbox, encoding: "utf-8" },
      )
      expect(tarballResult.status).toBe(0)

      const tarballName = tarballResult.stdout.trim().split("\n").pop()!
      const tarballPath = resolve(sandbox, tarballName)

      const consumer = mkdtempSync(join(tmpdir(), "easycode-packed-install-"))

      try {
        spawnSync("npm", ["init", "-y", "--prefix", consumer], { encoding: "utf-8" })
        const installResult = spawnSync(
          "npm",
          ["install", tarballPath],
          { cwd: consumer, encoding: "utf-8" },
        )
        expect(installResult.status).toBe(0)

        const runResult = spawnSync(
          "bun",
          ["-e", `
            const { default: P } = await import("easycode-plugin");
            const h = await P({ client:{app:{log(){return Promise.resolve()}}}, project:"t", directory:process.cwd(), worktree:process.cwd(), serverUrl:new URL("https://example.com"), $:{} },{});
            const c = {};
            await h.config?.(c);
            if (!c.agent?.orchestrator) throw new Error("agent missing");
            if (!Array.isArray(c.skills?.paths) || c.skills.paths.length === 0) throw new Error("skills missing");
            const out = { messages: [{ info: { id: "u1", sessionID: "s1", role: "user", time: { created: 1 }, agent: "coder", model: { providerID: "p", modelID: "m" } }, parts: [{ id: "p1", sessionID: "s1", messageID: "u1", type: "text", text: "hi" }] }] };
            await h["experimental.chat.messages.transform"]?.({}, out);
            const injected = out.messages[0]?.parts[0];
            if (!injected?.synthetic || !injected?.text?.includes("<SESSION_BOOTSTRAP_MANDATORY>")) throw new Error("bootstrap missing");
            console.log("OK");
          `],
          { cwd: consumer, encoding: "utf-8" },
        )
        expect(runResult.status).toBe(0)
        expect(runResult.stdout.trim()).toContain("OK")
      } finally {
        rmSync(consumer, { recursive: true, force: true })
      }
    } finally {
      rmSync(sandbox, { recursive: true, force: true })
    }
  })

  it("install:local produces a working plugin file from the built output", () => {
    const sandbox = createSandbox()

    try {
      // Build in sandbox
      spawnSync("bun", ["install"], { cwd: sandbox, encoding: "utf-8" })
      const buildResult = spawnSync("bun", ["run", "build"], { cwd: sandbox, encoding: "utf-8" })
      expect(buildResult.status).toBe(0)
      expect(existsSync(resolve(sandbox, "dist", "index.js"))).toBeTrue()

      // Run install:local in sandbox
      const pluginDir = resolve(sandbox, ".opencode", "plugins")
      const pluginFile = resolve(pluginDir, "easycode.ts")

      const installResult = spawnSync("bun", ["run", "install:local"], { cwd: sandbox, encoding: "utf-8" })
      expect(installResult.status).toBe(0)
      expect(existsSync(pluginFile)).toBeTrue()

      // The installed file must be non-empty
      const stat = statSync(pluginFile)
      expect(stat.size).toBeGreaterThan(0)

      // Verify the installed plugin works end-to-end via subprocess
      const runResult = spawnSync(
        "bun",
        ["-e", `
          const { default: P } = await import("${pluginFile}");
          const h = await P({ client:{app:{log(){return Promise.resolve()}}}, project:"t", directory:process.cwd(), worktree:process.cwd(), serverUrl:new URL("https://example.com"), $:{} },{});
          const c = {};
          await h.config?.(c);
          if (!c.agent?.orchestrator) throw new Error("agent missing");
          if (!Array.isArray(c.skills?.paths) || c.skills.paths.length === 0) throw new Error("skills missing");
          const out = { messages: [{ info: { id: "u1", sessionID: "s1", role: "user", time: { created: 1 }, agent: "coder", model: { providerID: "p", modelID: "m" } }, parts: [{ id: "p1", sessionID: "s1", messageID: "u1", type: "text", text: "hi" }] }] };
          await h["experimental.chat.messages.transform"]?.({}, out);
          const injected = out.messages[0]?.parts[0];
          if (!injected?.synthetic || !injected?.text?.includes("<SESSION_BOOTSTRAP_MANDATORY>")) throw new Error("bootstrap missing");
          console.log("OK");
        `],
        { cwd: sandbox, encoding: "utf-8" },
      )
      expect(runResult.status).toBe(0)
      expect(runResult.stdout.trim()).toContain("OK")
    } finally {
      rmSync(sandbox, { recursive: true, force: true })
    }
  })
})
