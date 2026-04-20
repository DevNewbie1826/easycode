import type { TodoItem } from "./types"

export function getTodoArray(response: unknown): TodoItem[] {
  const data = (response as { data?: unknown })?.data ?? response
  return Array.isArray(data) ? (data as TodoItem[]) : []
}
