---
name: todo-sync
description: Use when an Orchestrator agent must keep the todo list updated before work starts, after each task is completed, and after all work is finished.
---
Always use `todowrite` to keep the todo list synchronized with actual execution.

- Update the todo list before starting work.
- Update it immediately after each completed task.
- Update it again after all work is finished.
- If the plan changes or new tasks appear, update it before continuing.

Do not start, continue, or finish work with stale todo states.
