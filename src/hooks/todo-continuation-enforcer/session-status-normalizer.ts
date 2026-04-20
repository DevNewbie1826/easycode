import { getSessionIDFromProperties } from "./session-id"

function getRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return undefined
}

export function normalizeSessionStatusToIdle(input: {
  event: { type: string; properties?: unknown }
}): { event: { type: "session.idle"; properties: { sessionID: string } } } | undefined {
  if (input.event.type !== "session.status") {
    return undefined
  }

  const props = getRecord(input.event.properties)
  const status = getRecord(props?.status)
  if (status?.type !== "idle") {
    return undefined
  }

  const sessionID = getSessionIDFromProperties(props)
  if (!sessionID) {
    return undefined
  }

  return {
    event: {
      type: "session.idle",
      properties: { sessionID },
    },
  }
}
