import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { builtinAgentDisablePolicy } from "./agents/builtin-policy"
import type { AgentPermission, AgentPermissionRule, AgentPermissionValue } from "./agents/types"
import { loadBuiltinAgentRegistry } from "./agents/registry"
import { createBuiltinMcpServers, type BuiltinMcpServer } from "./mcp"
import { loadEasyCodeConfig } from "./easycode-config"
import { registerSkillPath, resolvePluginSkillPath } from "./skills/path-registration"

type CreateConfigHandlerOptions = {
  moduleDir?: string
}

const defaultModuleDir = dirname(fileURLToPath(import.meta.url))

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function createSafeRecord(): Record<string, unknown> {
  return Object.create(null) as Record<string, unknown>
}

function cloneBuiltinMcpEntry(entry: BuiltinMcpServer): BuiltinMcpServer {
  if (entry.type === "local") {
    return {
      ...entry,
      command: [...entry.command],
    }
  }

  return { ...entry }
}

function cloneBuiltinMcpServers(mcpServers: Record<string, BuiltinMcpServer>): Record<string, BuiltinMcpServer> {
  const cloned = createSafeRecord() as Record<string, BuiltinMcpServer>

  for (const [name, entry] of Object.entries(mcpServers)) {
    cloned[name] = cloneBuiltinMcpEntry(entry)
  }

  return cloned
}

function cloneAgentPermissionRule(rule: AgentPermissionRule): AgentPermissionRule {
  if (typeof rule === "string") {
    return rule
  }

  const cloned = createSafeRecord() as Record<string, AgentPermissionValue>

  for (const [key, value] of Object.entries(rule)) {
    cloned[key] = value
  }

  return cloned
}

function cloneAgentPermission(permission: AgentPermission): AgentPermission {
  const cloned = createSafeRecord() as AgentPermission

  for (const [key, value] of Object.entries(permission)) {
    cloned[key] = cloneAgentPermissionRule(value)
  }

  return cloned
}

function mergePluginOwnedAgentFields(
  existingEntry: unknown,
  configEntry: Record<string, unknown> | undefined,
  ownedFields: Record<string, unknown>,
  ownedFieldNames: string[] = ["model", "variant", "temperature", "permission"],
): Record<string, unknown> {
  const safeExistingEntry = isRecord(existingEntry) ? existingEntry : {}
  const preservedEntry = createSafeRecord()

  for (const [key, value] of Object.entries(safeExistingEntry)) {
    if (ownedFieldNames.includes(key)) {
      continue
    }

    preservedEntry[key] = value
  }

  return {
    ...preservedEntry,
    ...ownedFields,
    ...(configEntry ?? {}),
  }
}

export function createConfigHandler(
  directory: string,
  fallbackDirectory?: string,
  options: CreateConfigHandlerOptions = {},
) {
  const moduleDir = options.moduleDir ?? defaultModuleDir
  const skillPath = resolvePluginSkillPath(moduleDir)
  const builtinAgentRegistryPromise = loadBuiltinAgentRegistry(moduleDir)

  return async (config: Record<string, unknown>) => {
    const builtinAgentRegistry = await builtinAgentRegistryPromise
    const userConfig = loadEasyCodeConfig(fallbackDirectory && fallbackDirectory !== directory ? [directory, fallbackDirectory] : directory)
    const builtinMcpServers = createBuiltinMcpServers(userConfig.mcp?.websearch)
    const existingMcp = isRecord(config.mcp) ? config.mcp : {}
    const mergedMcp: Record<string, unknown> = cloneBuiltinMcpServers(builtinMcpServers)
    const existingAgent = isRecord(config.agent) ? config.agent : {}
    const mergedAgent = createSafeRecord()

    for (const [name, value] of Object.entries(existingMcp)) {
      mergedMcp[name] = value
    }

    for (const [name, value] of Object.entries(existingAgent)) {
      mergedAgent[name] = value
    }

    for (const agent of builtinAgentRegistry) {
      const agentConfigEntry = userConfig.agent?.[agent.name]
      const ownsColor = typeof agent.defaults?.color === "string"
        || typeof agentConfigEntry?.color === "string"
        || ((agentConfigEntry ? Object.keys(agentConfigEntry).length : 0) > 0)

      mergedAgent[agent.name] = mergePluginOwnedAgentFields(mergedAgent[agent.name], agentConfigEntry, {
        prompt: agent.prompt,
        description: agent.description,
        mode: agent.mode,
        ...(typeof agent.defaults?.color === "string" ? { color: agent.defaults.color } : {}),
        ...(typeof agent.defaults?.temperature === "number" ? { temperature: agent.defaults.temperature } : {}),
        ...(agent.defaults?.permission ? { permission: cloneAgentPermission(agent.defaults.permission) } : {}),
      }, ["model", "variant", ...(ownsColor ? ["color"] : []), "temperature", "permission"])
    }

    for (const [name, disable] of Object.entries(builtinAgentDisablePolicy)) {
      const agentConfigEntry = userConfig.agent?.[name]
      const ownsColor = typeof agentConfigEntry?.color === "string" || ((agentConfigEntry ? Object.keys(agentConfigEntry).length : 0) > 0)

      mergedAgent[name] = mergePluginOwnedAgentFields(mergedAgent[name], agentConfigEntry, {
        disable,
      }, ["model", "variant", ...(ownsColor ? ["color"] : []), "temperature", "permission"])
    }

    config.mcp = mergedMcp
    config.agent = mergedAgent
    registerSkillPath(config, skillPath)
  }
}
