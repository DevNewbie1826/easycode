import { describe, expect, it } from "bun:test"
import { createSessionRoleResolver } from "../hooks/session-role-resolver"

describe("session-role-resolver", () => {
  it("classifies as subagent when info.parentID is ses_*", () => {
    const resolver = createSessionRoleResolver({ ttlMs: 60_000 })

    resolver.observe({
      type: "session.created",
      properties: {
        sessionID: "child-1",
        info: { id: "child-1", parentID: "ses_main_1" },
      },
    })

    expect(resolver.getRole("child-1")).toBe("subagent")
    expect(resolver.getParentSessionID("child-1")).toBe("ses_main_1")
  })

  it("does not classify msg_* parents as subagent", () => {
    const resolver = createSessionRoleResolver({ ttlMs: 60_000 })

    resolver.observe({
      type: "message.updated",
      properties: {
        sessionID: "session-1",
        info: { parentID: "msg_abc" },
      },
    })

    expect(resolver.getRole("session-1")).toBe("unknown")
  })

  it("classifies primary mode sessions as main", () => {
    const resolver = createSessionRoleResolver({ ttlMs: 60_000 })

    resolver.observe({
      type: "session.updated",
      properties: {
        sessionID: "session-main",
        info: { id: "session-main", mode: "primary" },
      },
    })

    expect(resolver.getRole("session-main")).toBe("main")
  })

  it("treats orchestrator agent events as main when mode is missing", () => {
    const resolver = createSessionRoleResolver({ ttlMs: 60_000 })

    resolver.observe({
      type: "message.updated",
      properties: {
        sessionID: "session-main",
        info: { id: "session-main", agent: "orchestrator" },
      },
    })

    expect(resolver.getRole("session-main")).toBe("main")
  })

  it("does not downgrade an observed subagent to main", () => {
    const resolver = createSessionRoleResolver({ ttlMs: 60_000 })

    resolver.observe({
      type: "session.updated",
      properties: {
        sessionID: "child-downgrade",
        info: { id: "child-downgrade", parentID: "ses_main_runtime" },
      },
    })

    resolver.observe({
      type: "session.updated",
      properties: {
        sessionID: "child-downgrade",
        info: { id: "child-downgrade", mode: "main" },
      },
    })

    expect(resolver.getRole("child-downgrade")).toBe("subagent")
    expect(resolver.getParentSessionID("child-downgrade")).toBe("ses_main_runtime")
  })
})
