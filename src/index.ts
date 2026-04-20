import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import type { Plugin, PluginInput } from "@opencode-ai/plugin"
import { createConfigHandler } from "./config-handler"
import { createSessionRoleResolver } from "./hooks/session-role-resolver"
import { createTodoContinuationEnforcer } from "./hooks/todo-continuation-enforcer"
import { createTodoToolGuard } from "./hooks/todo-tool-guard"
import { createSkillBootstrapTransform } from "./hooks/skill-bootstrap"
import { resolvePluginSkillPath } from "./skills/path-registration"
import { createTools } from "./tools"

const defaultModuleDir = dirname(fileURLToPath(import.meta.url))

function getModuleDir(options: Record<string, unknown> | undefined): string {
  return typeof options?.moduleDir === "string" ? options.moduleDir : defaultModuleDir
}

function getTodoContinuationCountdownSeconds(options: Record<string, unknown> | undefined): number | undefined {
  return typeof options?.todoContinuationCountdownSeconds === "number"
    ? options.todoContinuationCountdownSeconds
    : undefined
}

export const EasyCodePlugin: Plugin = async ({ client, project, directory, worktree }, options) => {
  const moduleDir = getModuleDir(options)
  const todoContinuationCountdownSeconds = getTodoContinuationCountdownSeconds(options)
  const pluginInput = { client, project, directory, worktree } as PluginInput
  const roleResolver = createSessionRoleResolver()
  const todoToolGuard = createTodoToolGuard(pluginInput, { roleResolver })
  const todoContinuationEnforcer = createTodoContinuationEnforcer(pluginInput, {
    countdownSeconds: todoContinuationCountdownSeconds,
  })

  await client.app.log({
    body: {
      service: "easycode-plugin",
      level: "info",
      message: "EasyCode plugin initialized",
      extra: {
        project,
        directory,
        worktree,
      },
    },
  })

  return {
    config: createConfigHandler(worktree ?? directory, directory, { moduleDir }),
    tool: createTools(),
    "tool.execute.before": todoToolGuard.before,
    "tool.execute.after": todoToolGuard.after,
    event: async (input) => {
      roleResolver.observe(input.event)
      await todoContinuationEnforcer.handler(input)
    },
    "experimental.chat.messages.transform": createSkillBootstrapTransform({ moduleDir }),
  }
}

export default EasyCodePlugin
