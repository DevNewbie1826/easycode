import { createOpencode } from "@opencode-ai/sdk"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

type RuntimePermissionAction = "allow" | "ask" | "deny"

type RuntimePermissionRule = {
  permission: string
  pattern: string
  action: RuntimePermissionAction
}

const pinnedPluginPath = "/Users/mirage/go/src/easycode/.worktrees/feature-restore-orchestrator-skill-visibility"

const expectedSkillRules: RuntimePermissionRule[] = []

function unwrapAgentsPayload(value: unknown) {
  if (Array.isArray(value)) {
    return value
  }

  if (value && typeof value === "object" && Array.isArray((value as { data?: unknown }).data)) {
    return (value as { data: unknown[] }).data
  }

  const keys = value && typeof value === "object" ? Object.keys(value as Record<string, unknown>) : []
  throw new Error(`Unexpected client.app.agents() payload shape: ${JSON.stringify(keys)}`)
}

function assertPinnedPluginPath() {
  const pluginPath = realpathSync(pinnedPluginPath)

  if (!existsSync(join(pluginPath, "package.json"))) {
    throw new Error(`Pinned plugin path is missing package.json: ${pluginPath}`)
  }

  if (!existsSync(join(pluginPath, "src", "index.ts"))) {
    throw new Error(`Pinned plugin path is missing src/index.ts: ${pluginPath}`)
  }

  if (!existsSync(join(pluginPath, "src", "agents", "definitions", "orchestrator.agent.ts"))) {
    throw new Error(`Pinned plugin path is missing orchestrator agent definition: ${pluginPath}`)
  }

  const packageJson = JSON.parse(readFileSync(join(pluginPath, "package.json"), "utf8")) as {
    name?: unknown
  }

  if (packageJson.name !== "easycode-plugin") {
    throw new Error(`Pinned plugin path is not the easycode-plugin package: ${JSON.stringify(packageJson.name)}`)
  }

  return pluginPath
}

function assertZeroSkillRules(permission: unknown): RuntimePermissionRule[] {
  if (!Array.isArray(permission)) {
    throw new Error("Runtime probe returned non-array orchestrator.permission")
  }

  const skillRules = permission.filter(
    (rule): rule is RuntimePermissionRule =>
      Boolean(rule)
      && typeof rule === "object"
      && (rule as { permission?: unknown }).permission === "skill"
      && typeof (rule as { pattern?: unknown }).pattern === "string"
      && typeof (rule as { action?: unknown }).action === "string",
  )

  if (skillRules.length !== 0) {
    throw new Error(
      `Expected zero orchestrator skill rules, received ${JSON.stringify(skillRules)}`,
    )
  }

  return skillRules
}

const pluginPath = assertPinnedPluginPath()
const fakeHome = mkdtempSync(join(tmpdir(), "easycode-runtime-home-"))
const runtimeDir = mkdtempSync(join(tmpdir(), "easycode-runtime-dir-"))
const xdgConfigHome = join(fakeHome, ".config")

mkdirSync(xdgConfigHome, { recursive: true })

process.env.HOME = fakeHome
process.env.XDG_CONFIG_HOME = xdgConfigHome

const { client, server } = await createOpencode({
  port: 0,
  timeout: 20000,
  config: { plugin: [pluginPath] },
})

try {
  const response = await client.app.agents({ directory: runtimeDir })
  const wrapperKeys = Array.isArray(response) ? [] : Object.keys(response as Record<string, unknown>)
  const agents = unwrapAgentsPayload(response)
  const orchestrator = agents.find(
    (agent) =>
      agent
      && typeof agent === "object"
      && (agent as { name?: unknown }).name === "orchestrator",
  ) as {
    name: string
    mode?: unknown
    color?: unknown
    description?: unknown
    permission?: unknown
  } | undefined

  if (!orchestrator) {
    throw new Error("Runtime probe did not return orchestrator")
  }

  if (orchestrator.mode !== "primary") {
    throw new Error(`Expected plugin-managed orchestrator mode 'primary', received ${JSON.stringify(orchestrator.mode)}`)
  }

  if (orchestrator.color !== "#6A5CFF") {
    throw new Error(`Expected plugin-managed orchestrator color '#6A5CFF', received ${JSON.stringify(orchestrator.color)}`)
  }

  if (typeof orchestrator.description !== "string" || !orchestrator.description.startsWith("Primary coordination agent")) {
    throw new Error("Returned orchestrator does not match the plugin-managed agent under test")
  }

  const skillRules = assertZeroSkillRules(orchestrator.permission)

  console.log(
    JSON.stringify({
      ok: true,
      pluginPath,
      wrapperKeys,
      skillRules,
    }),
  )
} finally {
  server.close()
  rmSync(fakeHome, { recursive: true, force: true })
  rmSync(runtimeDir, { recursive: true, force: true })
}

process.exit(0)
