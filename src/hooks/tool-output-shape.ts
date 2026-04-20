export function isJsonLikeText(text: string): boolean {
  const trimmed = text.trim()
  return trimmed.startsWith("{") || trimmed.startsWith("[")
}

export function canAppendText(value: unknown): value is string {
  return typeof value === "string" && !isJsonLikeText(value)
}

export function isMetadataObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
