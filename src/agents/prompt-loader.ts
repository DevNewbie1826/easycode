import { readFileSync } from "node:fs"

export function loadAgentPrompt(promptFileName: string): string {
  return readFileSync(new URL(`./prompt-text/${promptFileName}`, import.meta.url), "utf8").trim()
}
