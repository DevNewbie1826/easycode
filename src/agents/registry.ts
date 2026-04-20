import { readdirSync, statSync } from "node:fs"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import type { AgentDefinition } from "./types"

function isAgentMode(value: unknown): value is AgentDefinition["mode"] {
  return value === "subagent" || value === "primary"
}

function isAgentDefinition(value: unknown): value is AgentDefinition {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>

  return typeof candidate.name === "string"
    && typeof candidate.description === "string"
    && typeof candidate.prompt === "string"
    && isAgentMode(candidate.mode)
}

function getAgentDefinition(module: unknown, index: number): AgentDefinition {
  if (
    typeof module !== "object"
    || module === null
    || !("default" in module)
    || !isAgentDefinition(module.default)
  ) {
    throw new Error(`Invalid agent module at index ${index}`)
  }

  return module.default
}

function resolveBuiltinAgentDefinitionsPath(moduleDir: string): string | undefined {
  const candidatePaths = [
    resolve(join(moduleDir, "../src/agents/definitions")),
    resolve(join(moduleDir, "../../src/agents/definitions")),
  ]

  for (const candidatePath of candidatePaths) {
    try {
      if (statSync(candidatePath).isDirectory()) {
        return candidatePath
      }
    } catch {
      continue
    }
  }

  return undefined
}

async function loadAgentModulesFromDefinitionsPath(definitionsPath: string): Promise<unknown[]> {
  const fileNames = readdirSync(definitionsPath)
    .filter((fileName) => fileName.endsWith(".agent.ts"))
    .sort((a, b) => a.localeCompare(b))

  return Promise.all(
    fileNames.map((fileName) => import(pathToFileURL(join(definitionsPath, fileName)).href)),
  )
}

export function loadAgentRegistry(modules: readonly unknown[]): AgentDefinition[] {
  const registry = modules.map((module, index) => getAgentDefinition(module, index)).sort((a, b) => a.name.localeCompare(b.name))

  for (let index = 1; index < registry.length; index += 1) {
    if (registry[index - 1]?.name === registry[index]?.name) {
      throw new Error(`Duplicate agent name: "${registry[index].name}"`)
    }
  }

  return registry
}

export function createBuiltinAgentRegistry(modules: Record<string, unknown>): AgentDefinition[] {
  return loadAgentRegistry(Object.values(modules))
}

export async function loadBuiltinAgentRegistry(moduleDir: string): Promise<AgentDefinition[]> {
  const definitionsPath = resolveBuiltinAgentDefinitionsPath(moduleDir)

  if (!definitionsPath) {
    return []
  }

  const modules = await loadAgentModulesFromDefinitionsPath(definitionsPath)

  return modules.length > 0 ? loadAgentRegistry(modules) : []
}
