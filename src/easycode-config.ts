import { existsSync, readFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import type { AgentPermission, AgentPermissionRule, AgentPermissionValue } from "./agents/types"

export type EasyCodeConfig = {
  agent?: Record<
    string,
    {
      model?: string
      variant?: string
      color?: string
      temperature?: number
      permission?: AgentPermission
    }
  >
  mcp?: {
    websearch?: {
      enabled?: boolean
      apiKey?: string
    }
  }
}

const AGENT_PERMISSION_VALUES = new Set<AgentPermissionValue>(["allow", "ask", "deny"])
const ROOT_AGENT_PERMISSION_KEYS = new Set([
  "apply_patch",
  "ast_grep_replace",
  "bash",
  "doom_loop",
  "edit",
  "external_directory",
  "lsp_rename",
  "question",
  "task",
  "webfetch",
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function normalizeAgentPermissionRule(value: unknown): AgentPermissionRule | undefined {
  if (typeof value === "string") {
    return AGENT_PERMISSION_VALUES.has(value as AgentPermissionValue) ? (value as AgentPermissionValue) : undefined
  }

  if (!isRecord(value)) {
    return undefined
  }

  const normalizedRule: Record<string, AgentPermissionValue> = {}

  for (const [key, nestedValue] of Object.entries(value)) {
    if (typeof nestedValue === "string" && AGENT_PERMISSION_VALUES.has(nestedValue as AgentPermissionValue)) {
      normalizedRule[key] = nestedValue as AgentPermissionValue
    }
  }

  return Object.keys(normalizedRule).length > 0 || Object.keys(value).length === 0 ? normalizedRule : undefined
}

function normalizeAgentPermission(value: unknown): AgentPermission | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const normalizedPermission: AgentPermission = {}

  for (const [key, rule] of Object.entries(value)) {
    if (!ROOT_AGENT_PERMISSION_KEYS.has(key)) {
      continue
    }

    const normalizedRule = normalizeAgentPermissionRule(rule)

    if (normalizedRule) {
      normalizedPermission[key] = normalizedRule
    }
  }

  return Object.keys(normalizedPermission).length > 0 || Object.keys(value).length === 0
    ? normalizedPermission
    : undefined
}

function normalizeAgentBinding(entry: unknown): {
  model?: string
  variant?: string
  color?: string
  temperature?: number
  permission?: AgentPermission
} | undefined {
  if (!isRecord(entry)) {
    return undefined
  }

  const permission = normalizeAgentPermission(entry.permission)

  const normalizedEntry = {
    ...(typeof entry.model === "string" ? { model: entry.model } : {}),
    ...(typeof entry.variant === "string" ? { variant: entry.variant } : {}),
    ...(typeof entry.color === "string" ? { color: entry.color } : {}),
    ...(isFiniteNumber(entry.temperature) && entry.temperature >= 0 && entry.temperature <= 2
      ? { temperature: entry.temperature }
      : {}),
    ...(permission ? { permission } : {}),
  }

  if (Object.keys(normalizedEntry).length > 0 || Object.keys(entry).length === 0) {
    return normalizedEntry
  }

  return undefined
}

function normalizeEasyCodeConfig(value: unknown): EasyCodeConfig {
  if (!isRecord(value)) {
    return {}
  }

  const normalizedConfig: EasyCodeConfig = {}

  const agent = isRecord(value.agent) ? value.agent : undefined

  if (agent) {
    const normalizedAgent: NonNullable<EasyCodeConfig["agent"]> = {}

    for (const [name, entry] of Object.entries(agent)) {
      const normalizedEntry = normalizeAgentBinding(entry)

      if (!normalizedEntry) {
        continue
      }

      normalizedAgent[name] = normalizedEntry
    }

    if (Object.keys(normalizedAgent).length > 0) {
      normalizedConfig.agent = normalizedAgent
    }
  }

  const mcp = isRecord(value.mcp) ? value.mcp : undefined
  const websearch = isRecord(mcp?.websearch) ? mcp.websearch : undefined

  if (!websearch) {
    return normalizedConfig
  }

  const normalizedWebsearch = {
    ...(typeof websearch.enabled === "boolean" ? { enabled: websearch.enabled } : {}),
    ...(typeof websearch.apiKey === "string" ? { apiKey: websearch.apiKey } : {}),
  }

  if (Object.keys(normalizedWebsearch).length === 0) {
    return normalizedConfig
  }

  normalizedConfig.mcp = {
    websearch: normalizedWebsearch,
  }

  return normalizedConfig
}

function mergeEasyCodeConfig(current: EasyCodeConfig, fallback: EasyCodeConfig): EasyCodeConfig {
  const mergedAgent: NonNullable<EasyCodeConfig["agent"]> = {
    ...(fallback.agent ?? {}),
  }

  for (const [name, entry] of Object.entries(current.agent ?? {})) {
    mergedAgent[name] = entry
  }

  const mergedWebsearch = current.mcp?.websearch ?? fallback.mcp?.websearch

  return {
    ...(Object.keys(mergedAgent).length > 0 ? { agent: mergedAgent } : {}),
    ...(mergedWebsearch
      ? {
          mcp: {
            websearch: mergedWebsearch,
          },
        }
      : {}),
  }
}

export type LoadEasyCodeConfigOptions = {
  globalConfigPath?: string
}

export function getDefaultGlobalConfigPath(): string {
  return join(homedir(), ".config", "opencode", "easycode.json")
}

export function loadEasyCodeConfig(directories: string | readonly string[], options: LoadEasyCodeConfigOptions = {}): EasyCodeConfig {
  const globalConfigPath = options.globalConfigPath ?? getDefaultGlobalConfigPath()
  let mergedConfig: EasyCodeConfig = {}

  const allDirectories = [...(Array.isArray(directories) ? directories : [directories])]

  for (const directory of allDirectories) {
    const configPath = join(directory, ".opencode", "easycode.json")

    if (!existsSync(configPath)) {
      continue
    }

    try {
      const config = normalizeEasyCodeConfig(JSON.parse(readFileSync(configPath, "utf-8")))

      if (Object.keys(config).length === 0) {
        continue
      }

      mergedConfig = mergeEasyCodeConfig(mergedConfig, config)
    } catch {
      continue
    }
  }

  if (existsSync(globalConfigPath)) {
    try {
      const config = normalizeEasyCodeConfig(JSON.parse(readFileSync(globalConfigPath, "utf-8")))

      if (Object.keys(config).length > 0) {
        mergedConfig = mergeEasyCodeConfig(mergedConfig, config)
      }
    } catch {
      // Invalid global config is treated the same as absent
    }
  }

  return mergedConfig
}
