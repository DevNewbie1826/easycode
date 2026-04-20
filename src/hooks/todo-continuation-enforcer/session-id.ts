function getString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

function getRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return undefined
}

export function getSessionIDFromProperties(properties: unknown): string | undefined {
  const props = getRecord(properties)
  const info = getRecord(props?.info)
  return getString(props?.sessionID) ?? getString(props?.session_id) ?? getString(info?.id)
}
