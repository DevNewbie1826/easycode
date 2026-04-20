import type { PluginInput } from "@opencode-ai/plugin"
import type { Todo } from "./types"

export async function fetchSessionTodos(ctx: PluginInput, sessionID: string): Promise<Todo[]> {
  const response = await ctx.client.session.todo({ path: { id: sessionID } })
  const data = (response as { data?: unknown })?.data ?? response

  if (!Array.isArray(data)) {
    throw new Error("Unexpected session.todo response")
  }

  return data as Todo[]
}
