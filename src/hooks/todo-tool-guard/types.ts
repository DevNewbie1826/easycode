export type TodoItem = {
  id?: string
  content: string
  status: string
  priority?: string
}

export type TodoToolGuardSessionState = {
  nonTodoWriteToolCount: number
  lastTodoSnapshot?: string
  createdAt: number
  lastAccessedAt: number
}

export type TodoGuardSessionRole = "main" | "subagent" | "unknown"

export type TodoGuardRoleResolver = {
  getRole: (sessionID: string) => TodoGuardSessionRole
}

export type TodoToolGuardStateStore = {
  get: (sessionID: string) => TodoToolGuardSessionState
  increment: (sessionID: string) => number
  resetCounter: (sessionID: string) => void
  setSnapshot: (sessionID: string, snapshot: string) => void
  setPendingTodoSnapshot: (sessionID: string, callID: string, snapshot: string) => void
  consumePendingTodoSnapshot: (sessionID: string, callID: string) => string | undefined
  prune: () => void
  dispose: () => void
}
