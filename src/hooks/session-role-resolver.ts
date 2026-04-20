export type SessionRole = "main" | "subagent" | "unknown"

type RuntimeEvent = {
  type: string
  properties?: unknown
}

type RoleState = {
  role: SessionRole
  parentSessionID?: string
  updatedAt: number
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

function getRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return undefined
}

function getSessionID(props: Record<string, unknown> | undefined): string | undefined {
  const info = getRecord(props?.info)
  return getString(props?.sessionID) ?? getString(props?.session_id) ?? getString(info?.id)
}

function getParentSessionCandidate(props: Record<string, unknown> | undefined): string | undefined {
  const info = getRecord(props?.info)
  const candidate =
    getString(info?.parentID) ??
    getString(props?.parentSessionID) ??
    getString(props?.parent_session_id) ??
    getString(info?.parentSessionID)

  if (!candidate?.startsWith("ses_")) {
    return undefined
  }

  return candidate
}

function getMainRoleCandidate(props: Record<string, unknown> | undefined): "main" | undefined {
  const info = getRecord(props?.info)
  const mode = getString(props?.mode) ?? getString(info?.mode) ?? getString(info?.agentMode)
  const agent = getString(props?.agent) ?? getString(info?.agent)

  if (mode === "main" || mode === "primary") {
    return "main"
  }

  return agent === "orchestrator" ? "main" : undefined
}

export function createSessionRoleResolver(options: { ttlMs?: number } = {}) {
  const ttlMs = options.ttlMs ?? 60 * 60 * 1000
  const states = new Map<string, RoleState>()

  const prune = (): void => {
    const now = Date.now()
    for (const [sessionID, state] of states.entries()) {
      if (now - state.updatedAt > ttlMs) {
        states.delete(sessionID)
      }
    }
  }

  const observe = (event: RuntimeEvent): void => {
    const props = getRecord(event.properties)
    const sessionID = getSessionID(props)

    if (!sessionID) {
      return
    }

    prune()

    const now = Date.now()
    const existing = states.get(sessionID)
    const parentSessionID = getParentSessionCandidate(props)

    if (parentSessionID) {
      states.set(sessionID, { role: "subagent", parentSessionID, updatedAt: now })
      return
    }

    if (existing?.role === "subagent") {
      existing.updatedAt = now
      states.set(sessionID, existing)
      return
    }

    const mainRole = getMainRoleCandidate(props)
    if (mainRole) {
      states.set(sessionID, { role: mainRole, updatedAt: now })
      return
    }

    if (existing) {
      existing.updatedAt = now
    }
  }

  return {
    observe,
    getRole(sessionID: string): SessionRole {
      prune()
      return states.get(sessionID)?.role ?? "unknown"
    },
    getParentSessionID(sessionID: string): string | undefined {
      prune()
      return states.get(sessionID)?.parentSessionID
    },
    dispose(): void {
      states.clear()
    },
  }
}
