import { describe, expect, it } from "bun:test"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { LspClient, normalizeLocations, uriToPath } from "../tools/lsp/client"
import { languageIdForPath } from "../tools/lsp/types"

describe("normalizeLocations", () => {
  it("normalizes Location and LocationLink arrays", () => {
    const result = normalizeLocations([
      { uri: "file:///a.ts", range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } } },
      { targetUri: "file:///b.ts", targetRange: { start: { line: 1, character: 0 }, end: { line: 1, character: 1 } } },
    ])

    expect(result).toHaveLength(2)
  })
})

describe("uriToPath", () => {
  it("returns invalid URIs unchanged", () => {
    expect(uriToPath("not-a-valid-uri")).toBe("not-a-valid-uri")
  })
})

describe("languageIdForPath", () => {
  it("handles Dockerfile-like names", () => {
    expect(languageIdForPath("/tmp/Dockerfile")).toBe("dockerfile")
  })
})

describe("LspClient document tracking", () => {
  it("treats symlink and real path as the same document", async () => {
    const tempDir = mkdtempSync(join(tmpdir(), "lsp-client-"))
    const realPath = join(tempDir, "real.ts")
    const linkPath = join(tempDir, "link.ts")
    writeFileSync(realPath, "export const x = 1\n", "utf-8")
    symlinkSync(realPath, linkPath)
    const notifications: string[] = []

    try {
      const client = new LspClient(process.cwd(), ["true"]) as any
      client.rpc = {
        async notify(method: string) {
          notifications.push(method)
        },
      }

      await client.ensureDocumentOpen(realPath)
      await client.ensureDocumentOpen(linkPath)

      expect(notifications).toEqual(["textDocument/didOpen"])
    } finally {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })

  it("uses monotonically increasing didChange versions", () => {
    const source = readFileSync(new URL("../tools/lsp/client.ts", import.meta.url), "utf-8")

    expect(source).toContain("doc.version++")
    expect(source).not.toContain("version: 2")
  })
})

describe("LspClient startup failure", () => {
  it("fails fast when the language server exits immediately", async () => {
    const client = new LspClient(process.cwd(), ["true"])
    const result = Promise.race([
      client.start(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 2000)),
    ])

    await expect(result).rejects.toThrow("LSP exited")
  })
})
