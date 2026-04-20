import { SESSION_TTL_MS } from "./constants"
import type { TodoToolGuardSessionState, TodoToolGuardStateStore } from "./types"

export function createTodoToolGuardState(): TodoToolGuardStateStore {
  const states = new Map<string, TodoToolGuardSessionState>()
  const pendingTodoSnapshots = new Map<string, Map<string, string>>()

  function get(sessionID: string): TodoToolGuardSessionState {
    const now = Date.now()
    const current = states.get(sessionID)

    if (current) {
      current.lastAccessedAt = now
      return current
    }

    const created: TodoToolGuardSessionState = {
      nonTodoWriteToolCount: 0,
      createdAt: now,
      lastAccessedAt: now,
    }
    states.set(sessionID, created)
    return created
  }

  return {
    get,
    increment(sessionID: string): number {
      const state = get(sessionID)
      state.nonTodoWriteToolCount += 1
      return state.nonTodoWriteToolCount
    },
    resetCounter(sessionID: string): void {
      get(sessionID).nonTodoWriteToolCount = 0
    },
    setSnapshot(sessionID: string, snapshot: string): void {
      get(sessionID).lastTodoSnapshot = snapshot
    },
    setPendingTodoSnapshot(sessionID: string, callID: string, snapshot: string): void {
      get(sessionID)
      const byCall = pendingTodoSnapshots.get(sessionID)
      if (byCall) {
        byCall.set(callID, snapshot)
        return
      }
      pendingTodoSnapshots.set(sessionID, new Map([[callID, snapshot]]))
    },
    consumePendingTodoSnapshot(sessionID: string, callID: string): string | undefined {
      const byCall = pendingTodoSnapshots.get(sessionID)
      if (!byCall) {
        return undefined
      }
      const snapshot = byCall.get(callID)
      byCall.delete(callID)
      if (byCall.size === 0) {
        pendingTodoSnapshots.delete(sessionID)
      }
      return snapshot
    },
    prune(): void {
      const now = Date.now()
      for (const [sessionID, state] of states.entries()) {
        if (now - state.lastAccessedAt > SESSION_TTL_MS) {
          states.delete(sessionID)
          pendingTodoSnapshots.delete(sessionID)
        }
      }
    },
    dispose(): void {
      states.clear()
      pendingTodoSnapshots.clear()
    },
  }
}
