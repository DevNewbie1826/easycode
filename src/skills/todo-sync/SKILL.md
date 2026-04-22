---
name: todo-sync
description: Use when an Orchestrator agent must keep the todo list updated before work starts, after each task is completed, and at true workflow completion.
---
Always use `todowrite` to keep the todo list synchronized with actual execution.

- Initialize the todo list before the first substantive workflow action.
- Keep exactly one item `in_progress` at a time.
- When a step completes and the next step begins, mark the finished item `completed` and the next item `in_progress` in the same update.
- If the workflow routes backward, reopen the relevant earlier item immediately and do not leave the failed path as the active item.
- Update it immediately after each completed task.
- Update it again when the workflow reaches true terminal completion.
- If the plan changes or new tasks appear, update it before continuing.
- Clear the todo list only when the workflow reaches a true terminal state after the selected finishing option's last required non-`todowrite` action is complete.

Do not start, continue, or finish work with stale todo states.
