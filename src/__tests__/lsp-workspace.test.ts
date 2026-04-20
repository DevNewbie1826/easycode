import { describe, expect, it } from "bun:test"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { findWorkspaceRoot, workspaceRootMarkersForLookupKey } from "../tools/lsp/workspace"

describe("findWorkspaceRoot", () => {
  it("prefers tsconfig markers for ts files", () => {
    const dir = mkdtempSync(join(tmpdir(), "lsp-root-"))
    const nested = join(dir, "src")
    mkdirSync(nested, { recursive: true })
    writeFileSync(join(dir, "tsconfig.json"), "{}", "utf-8")
    writeFileSync(join(nested, "main.ts"), "export const x = 1\n", "utf-8")

    try {
      expect(findWorkspaceRoot(join(nested, "main.ts"), workspaceRootMarkersForLookupKey(".ts"))).toBe(dir)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("uses language-specific markers for non-TS files", () => {
    const dir = mkdtempSync(join(tmpdir(), "lsp-kotlin-root-"))
    const nested = join(dir, "app", "src")
    mkdirSync(nested, { recursive: true })
    writeFileSync(join(dir, "settings.gradle.kts"), "rootProject.name = \"demo\"\n", "utf-8")
    writeFileSync(join(nested, "Main.kt"), "fun main() = println(1)\n", "utf-8")

    try {
      expect(findWorkspaceRoot(join(nested, "Main.kt"), workspaceRootMarkersForLookupKey(".kt"))).toBe(dir)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
