export type Todo = {
  content: string
  status: string
  priority?: string
  id?: string
}

export type TodoContinuationEnforcerOptions = {
  countdownSeconds?: number
  isContinuationStopped?: (sessionID: string) => boolean
}

export type TodoContinuationEnforcer = {
  handler: (input: { event: { type: string; properties?: unknown } }) => Promise<void>
  dispose: () => void
}
