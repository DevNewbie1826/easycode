import type { PluginInput } from "@opencode-ai/plugin"
import { TODO_REQUIRED_BLOCK_MESSAGE } from "./constants"
import { getTodoArray } from "./todo-array"
import { buildTodoSnapshot } from "./todo-snapshot"
import type { TodoGuardRoleResolver, TodoToolGuardStateStore } from "./types"

export function createTodoToolGuardBefore(
  ctx: PluginInput,
  stateStore: TodoToolGuardStateStore,
  roleResolver: TodoGuardRoleResolver,
) {
  return async function todoToolGuardBefore(
    input: { tool: string; sessionID: string; callID: string },
    _output: { args: unknown },
  ): Promise<void> {
    if (roleResolver.getRole(input.sessionID) === "subagent") {
      return
    }

    if (input.tool === "todowrite") {
      try {
        const response = await ctx.client.session.todo({ path: { id: input.sessionID } })
        stateStore.setPendingTodoSnapshot(input.sessionID, input.callID, buildTodoSnapshot(getTodoArray(response)))
      } catch {
        // todowrite stays allowed even if the snapshot cannot be loaded
      }
      return
    }

    try {
      const response = await ctx.client.session.todo({ path: { id: input.sessionID } })
      if (getTodoArray(response).length === 0) {
        throw new Error(TODO_REQUIRED_BLOCK_MESSAGE)
      }
    } catch {
      throw new Error(TODO_REQUIRED_BLOCK_MESSAGE)
    }
  }
}
