import { describe, expect, it } from "bun:test"
import { execFileSync } from "node:child_process"
import { readdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const packageRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))))
const referencedSkillPaths = readdirSync(join(packageRoot, "src", "skills"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => `src/skills/${entry.name}/SKILL.md`)
const referencedHookPaths = ["src/hooks/skill-bootstrap/skill-bootstrap.md"]
const referencedAgentPaths = [
  "src/agents/definitions/explorer.agent.ts",
  "src/agents/prompt-text/explorer-prompt.md",
  "src/agents/definitions/orchestrator.agent.ts",
  "src/agents/prompt-text/orchestrator-prompt.md",
]

describe("package publish layout", () => {
  it("includes selected referenced skill markdown assets in the packed artifact", () => {
    const output = execFileSync("npm", ["pack", "--json", "--dry-run"], {
      cwd: packageRoot,
      encoding: "utf8",
    })
    const [{ files }] = JSON.parse(output) as Array<{ files: Array<{ path: string }> }>
    const packedPaths = files.map((file) => file.path)

    expect(packedPaths).toEqual(expect.arrayContaining(referencedSkillPaths))
  })

  it("includes skill bootstrap markdown assets in the packed artifact", () => {
    const output = execFileSync("npm", ["pack", "--json", "--dry-run"], {
      cwd: packageRoot,
      encoding: "utf8",
    })
    const [{ files }] = JSON.parse(output) as Array<{ files: Array<{ path: string }> }>
    const packedPaths = files.map((file) => file.path)

    expect(packedPaths).toEqual(expect.arrayContaining(referencedHookPaths))
  })

  it("includes builtin agent definition and prompt assets in the packed artifact", () => {
    const output = execFileSync("npm", ["pack", "--json", "--dry-run"], {
      cwd: packageRoot,
      encoding: "utf8",
    })
    const [{ files }] = JSON.parse(output) as Array<{ files: Array<{ path: string }> }>
    const packedPaths = files.map((file) => file.path)

    expect(packedPaths).toEqual(expect.arrayContaining(referencedAgentPaths))
  })
})
