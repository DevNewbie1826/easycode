export const REMINDER_INTERVAL = 20

export const TODO_REQUIRED_BLOCK_MESSAGE = `Stop. Before taking any action, write the TODO first.

Principles:
- Even a trivial lookup must be recorded in the TODO before proceeding.
- Opening files, searching, checking logs, and reading code all count as lookups.
- Update the TODO immediately after each atomic unit of work is completed.
- Do not perform any action that is not listed in the TODO.
- Do not change or skip the TODO order arbitrarily.

After writing the TODO, proceed only with the item currently in order.`

export const TODO_STALE_REMINDER =
  "TODO not updated recently. Consider updating todowrite before continuing."

export const SESSION_TTL_MS = 60 * 60 * 1000
