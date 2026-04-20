import type { PluginInput } from "@opencode-ai/plugin"
import { CONTINUATION_PROMPT, COUNTDOWN_SECONDS } from "./constants"
import { getSessionIDFromProperties } from "./session-id"
import { fetchSessionTodos } from "./session-todo"
import { normalizeSessionStatusToIdle } from "./session-status-normalizer"
import { getIncompleteTodos } from "./todo"
import type { TodoContinuationEnforcer, TodoContinuationEnforcerOptions } from "./types"

function formatPrompt(todos: ReturnType<typeof getIncompleteTodos>): string {
  const todoList = todos.map((todo) => `- [${todo.status}] ${todo.content}`).join("\n")
  return `${CONTINUATION_PROMPT}\n\nRemaining tasks:\n${todoList}`
}

export function createTodoContinuationEnforcer(
  ctx: PluginInput,
  options: TodoContinuationEnforcerOptions = {},
): TodoContinuationEnforcer {
  const countdownSeconds = options.countdownSeconds ?? COUNTDOWN_SECONDS
  const timers = new Map<string, ReturnType<typeof setTimeout>>()

  const clearTimer = (sessionID: string): void => {
    const timer = timers.get(sessionID)
    if (timer) {
      clearTimeout(timer)
      timers.delete(sessionID)
    }
  }

  const queueContinuation = async (sessionID: string): Promise<void> => {
    if (options.isContinuationStopped?.(sessionID) === true) {
      return
    }

    let todos
    try {
      todos = await fetchSessionTodos(ctx, sessionID)
    } catch {
      return
    }

    const incompleteTodos = getIncompleteTodos(todos)
    if (incompleteTodos.length === 0) {
      return
    }

    await ctx.client.session.prompt({
      path: { id: sessionID },
      body: {
        parts: [{ type: "text", text: formatPrompt(incompleteTodos) }],
      },
    })
  }

  const schedule = async (sessionID: string): Promise<void> => {
    clearTimer(sessionID)
    const delayMs = Math.max(0, countdownSeconds) * 1000
    if (delayMs === 0) {
      await queueContinuation(sessionID)
      return
    }

    const timer = setTimeout(() => {
      timers.delete(sessionID)
      void queueContinuation(sessionID)
    }, delayMs)
    timers.set(sessionID, timer)
  }

  return {
    async handler(input): Promise<void> {
      const normalized = normalizeSessionStatusToIdle(input)
      const event = normalized?.event ?? input.event

      if (event.type !== "session.idle") {
      if (event.type === "session.deleted") {
        const sessionID = getSessionIDFromProperties(event.properties)
        if (sessionID) {
          clearTimer(sessionID)
        }
      }
      return
      }

      const sessionID = getSessionIDFromProperties(event.properties)
      if (!sessionID) {
        return
      }

      await schedule(sessionID)
    },
    dispose(): void {
      for (const timer of timers.values()) {
        clearTimeout(timer)
      }
      timers.clear()
    },
  }
}
