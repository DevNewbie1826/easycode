import type { Todo } from "./types"

export function isIncompleteTodo(todo: Todo): boolean {
  return !["completed", "cancelled", "blocked", "deleted"].includes(todo.status)
}

export function getIncompleteTodos(todos: Todo[]): Todo[] {
  return todos.filter(isIncompleteTodo)
}
