import { describe, expect, it } from "bun:test"
import { builtinAgentDisablePolicy, builtinAgentPermissionPolicy } from "../agents/builtin-policy"

describe("builtinAgentDisablePolicy", () => {
  it("defines the builtin disable policy shape in the agents module", () => {
    expect(Object.keys(builtinAgentDisablePolicy).sort()).toEqual([
      "build",
      "explore",
      "general",
      "plan",
    ])

    for (const value of Object.values(builtinAgentDisablePolicy)) {
      expect(typeof value).toBe("boolean")
    }
  })
})

describe("builtinAgentPermissionPolicy", () => {
  it("does not restrict any skills for the orchestrator", () => {
    const orchestratorPermission = builtinAgentPermissionPolicy.orchestrator

    expect(orchestratorPermission).toBeDefined()
    expect(orchestratorPermission).not.toHaveProperty("skill")
  })
})
