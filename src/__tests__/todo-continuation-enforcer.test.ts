import { describe, expect, it, mock } from "bun:test"
import { createTodoContinuationEnforcer } from "../hooks/todo-continuation-enforcer"
import { CONTINUATION_PROMPT } from "../hooks/todo-continuation-enforcer/constants"

describe("todo-continuation-enforcer", () => {
  it("prompts to continue when a main session goes idle with incomplete todos", async () => {
    const ctx: any = {
      client: {
        session: {
          todo: mock(async () => ({
            data: [{ content: "task", status: "pending" }],
          })),
          prompt: mock(async () => ({})),
        },
        tui: {
          showToast: mock(async () => ({})),
        },
        app: {
          log: mock(async () => ({})),
        },
      },
    }

    const enforcer = createTodoContinuationEnforcer(ctx, { countdownSeconds: 0 })

    await enforcer.handler({
      event: {
        type: "session.idle",
        properties: { sessionID: "session-1" },
      },
    })

    expect(ctx.client.session.prompt).toHaveBeenCalledTimes(1)
    expect(ctx.client.session.prompt.mock.calls[0][0].body.parts[0].text).toContain(CONTINUATION_PROMPT)
  })

  it("prompts for subagent sessions when continuation is not explicitly stopped", async () => {
    const ctx: any = {
      client: {
        session: {
          todo: mock(async () => ({
            data: [{ content: "task", status: "pending" }],
          })),
          prompt: mock(async () => ({})),
        },
        tui: {
          showToast: mock(async () => ({})),
        },
        app: {
          log: mock(async () => ({})),
        },
      },
    }

    const enforcer = createTodoContinuationEnforcer(ctx, { countdownSeconds: 0 })

    await enforcer.handler({
      event: {
        type: "session.idle",
        properties: { sessionID: "child-1" },
      },
    })

    expect(ctx.client.session.prompt).toHaveBeenCalledTimes(1)
    expect(ctx.client.session.prompt.mock.calls[0][0].body.parts[0].text).toContain(CONTINUATION_PROMPT)
  })

  it("does not prompt for unknown sessions", async () => {
    const ctx: any = {
      client: {
        session: {
          todo: mock(async () => ({
            data: [{ content: "task", status: "pending" }],
          })),
          prompt: mock(async () => ({})),
        },
        tui: {
          showToast: mock(async () => ({})),
        },
        app: {
          log: mock(async () => ({})),
        },
      },
    }

    const enforcer = createTodoContinuationEnforcer(ctx, {
      countdownSeconds: 0,
      isContinuationStopped: () => true,
    })

    await enforcer.handler({
      event: {
        type: "session.idle",
        properties: { sessionID: "session-unknown" },
      },
    })

    expect(ctx.client.session.prompt).not.toHaveBeenCalled()
  })
})
