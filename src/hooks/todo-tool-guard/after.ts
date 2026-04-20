import type { PluginInput } from "@opencode-ai/plugin"
import { canAppendText, isMetadataObject } from "../tool-output-shape"
import { REMINDER_INTERVAL, TODO_STALE_REMINDER } from "./constants"
import { getTodoArray } from "./todo-array"
import { buildTodoSnapshot } from "./todo-snapshot"
import type { TodoGuardRoleResolver, TodoToolGuardStateStore } from "./types"

type TodoToolAfterOutput = { title: string; output?: unknown; metadata?: unknown }

function attachReminder(output: TodoToolAfterOutput): void {
  if (canAppendText(output.output)) {
    output.output = `${output.output}\n\n${TODO_STALE_REMINDER}`
    return
  }

  if (isMetadataObject(output.metadata)) {
    output.metadata.todoToolGuardReminder = TODO_STALE_REMINDER
  }
}

export function createTodoToolGuardAfter(
  ctx: PluginInput,
  stateStore: TodoToolGuardStateStore,
  roleResolver: TodoGuardRoleResolver,
) {
  return async function todoToolGuardAfter(
    input: { tool: string; sessionID: string; callID: string; args: unknown },
    output: TodoToolAfterOutput,
  ): Promise<void> {
    if (roleResolver.getRole(input.sessionID) === "subagent") {
      return
    }

    stateStore.prune()

    if (input.tool !== "todowrite") {
      if (stateStore.increment(input.sessionID) % REMINDER_INTERVAL === 0) {
        attachReminder(output)
      }
      return
    }

    let nextSnapshot: string
    try {
      const response = await ctx.client.session.todo({ path: { id: input.sessionID } })
      nextSnapshot = buildTodoSnapshot(getTodoArray(response))
    } catch {
      return
    }

    const pendingSnapshot = stateStore.consumePendingTodoSnapshot(input.sessionID, input.callID)
    if (pendingSnapshot !== undefined) {
      if (pendingSnapshot !== nextSnapshot) {
        stateStore.resetCounter(input.sessionID)
      }
      stateStore.setSnapshot(input.sessionID, nextSnapshot)
      return
    }

    const currentSnapshot = stateStore.get(input.sessionID).lastTodoSnapshot
    if (currentSnapshot === undefined) {
      stateStore.setSnapshot(input.sessionID, nextSnapshot)
      return
    }

    if (currentSnapshot !== nextSnapshot) {
      stateStore.resetCounter(input.sessionID)
      stateStore.setSnapshot(input.sessionID, nextSnapshot)
    }
  }
}
