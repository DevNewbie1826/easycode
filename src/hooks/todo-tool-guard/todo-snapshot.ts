import type { TodoItem } from "./types"

export function buildTodoSnapshot(todos: TodoItem[]): string {
  const normalized = todos
    .map((todo) => ({
      id: todo.id ?? "",
      content: todo.content,
      status: todo.status,
      priority: todo.priority ?? "",
    }))
    .sort((a, b) => {
      const keyA = `${a.id}:${a.content}:${a.status}:${a.priority}`
      const keyB = `${b.id}:${b.content}:${b.status}:${b.priority}`
      return keyA.localeCompare(keyB)
    })

  return JSON.stringify(normalized)
}
