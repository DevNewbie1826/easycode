import { describe, expect, it } from "bun:test"
import {
  REMINDER_INTERVAL,
  TODO_REQUIRED_BLOCK_MESSAGE,
  TODO_STALE_REMINDER,
} from "../hooks/todo-tool-guard/constants"
import { createTodoToolGuard } from "../hooks/todo-tool-guard"

type TodoItem = {
  id?: string
  content: string
  status: string
  priority?: string
}

function createCtx(todoProvider: () => Promise<TodoItem[]>): any {
  return {
    client: {
      session: {
        todo: async () => ({ data: await todoProvider() }),
      },
    },
  }
}

describe("todo-tool-guard", () => {
  it("blocks non-todowrite tools when todo list is empty", async () => {
    const guard = createTodoToolGuard(createCtx(async () => []), {
      roleResolver: { getRole: () => "main" },
    })

    await expect(
      guard.before(
        { tool: "search_code", sessionID: "session-1", callID: "call-1" },
        { args: {} },
      ),
    ).rejects.toThrow(TODO_REQUIRED_BLOCK_MESSAGE)
  })

  it("always allows todowrite", async () => {
    const guard = createTodoToolGuard(createCtx(async () => []), {
      roleResolver: { getRole: () => "main" },
    })

    await expect(
      guard.before(
        { tool: "todowrite", sessionID: "session-1", callID: "call-1" },
        { args: {} },
      ),
    ).resolves.toBeUndefined()
  })

  it("blocks unknown sessions when todo list is empty", async () => {
    const guard = createTodoToolGuard(createCtx(async () => []), {
      roleResolver: { getRole: () => "unknown" },
    })

    await expect(
      guard.before(
        { tool: "search_code", sessionID: "child-1", callID: "call-1" },
        { args: {} },
      ),
    ).rejects.toThrow(TODO_REQUIRED_BLOCK_MESSAGE)
  })

  it("skips TODO enforcement for subagent sessions", async () => {
    const guard = createTodoToolGuard(createCtx(async () => []), {
      roleResolver: { getRole: () => "subagent" },
    })

    await expect(
      guard.before(
        { tool: "search_code", sessionID: "child-1", callID: "call-1" },
        { args: {} },
      ),
    ).resolves.toBeUndefined()
  })

  it("warns every reminder interval for non-todowrite usage", async () => {
    const guard = createTodoToolGuard(createCtx(async () => [{ content: "task", status: "pending" }]), {
      roleResolver: { getRole: () => "main" },
    })
    const output = { title: "", output: "ok", metadata: {} }

    for (let i = 0; i < REMINDER_INTERVAL - 1; i += 1) {
      await guard.after(
        { tool: "search_code", sessionID: "session-1", callID: `call-${i}`, args: {} },
        output,
      )
    }

    expect(output.output).toBe("ok")

    await guard.after(
      { tool: "search_code", sessionID: "session-1", callID: "call-remind", args: {} },
      output,
    )

    expect(output.output).toContain(TODO_STALE_REMINDER)
  })

  it("resets the reminder counter only when todowrite changes the todo snapshot", async () => {
    let todos: TodoItem[] = [{ content: "task", status: "pending" }]
    const guard = createTodoToolGuard(createCtx(async () => todos), {
      roleResolver: { getRole: () => "main" },
    })
    const output = { title: "", output: "ok", metadata: {} }

    for (let i = 0; i < REMINDER_INTERVAL - 1; i += 1) {
      await guard.after(
        { tool: "bash", sessionID: "session-1", callID: `call-${i}`, args: {} },
        output,
      )
    }

    await guard.before(
      { tool: "todowrite", sessionID: "session-1", callID: "call-change" },
      { args: {} },
    )
    todos = [{ content: "task", status: "completed" }]

    await guard.after(
      { tool: "todowrite", sessionID: "session-1", callID: "call-change", args: {} },
      output,
    )

    await guard.after(
      { tool: "bash", sessionID: "session-1", callID: "call-post-reset", args: {} },
      output,
    )

    expect(output.output).toBe("ok")
  })
})
