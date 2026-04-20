import type { PluginInput } from "@opencode-ai/plugin"
import { createTodoToolGuardAfter } from "./after"
import { createTodoToolGuardBefore } from "./before"
import { createTodoToolGuardState } from "./state"
import type { TodoGuardRoleResolver } from "./types"

export function createTodoToolGuard(
  ctx: PluginInput,
  options: { roleResolver?: TodoGuardRoleResolver } = {},
) {
  const stateStore = createTodoToolGuardState()
  const roleResolver: TodoGuardRoleResolver = options.roleResolver ?? { getRole: () => "unknown" }

  return {
    before: createTodoToolGuardBefore(ctx, stateStore, roleResolver),
    after: createTodoToolGuardAfter(ctx, stateStore, roleResolver),
    dispose(): void {
      stateStore.dispose()
    },
  }
}
