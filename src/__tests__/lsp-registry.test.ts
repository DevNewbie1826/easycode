import { describe, expect, it } from "bun:test"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { isCommandAvailable, lspLookupKeysForPath, selectServerForFile } from "../tools/lsp/registry"

describe("lspLookupKeysForPath", () => {
  it("uses filename-based lookup for Dockerfiles", () => {
    expect(lspLookupKeysForPath("/tmp/Dockerfile")).toEqual([".dockerfile"])
    expect(lspLookupKeysForPath("/tmp/example.ts")).toEqual([".ts"])
  })
})

describe("isCommandAvailable", () => {
  it("prefers local node_modules binaries", () => {
    const dir = mkdtempSync(join(tmpdir(), "lsp-bin-"))
    mkdirSync(join(dir, "node_modules", ".bin"), { recursive: true })
    writeFileSync(join(dir, "node_modules", ".bin", "typescript-language-server"), "", "utf-8")

    try {
      expect(isCommandAvailable("typescript-language-server", dir)).toBe(true)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe("selectServerForFile", () => {
  it("prefers deno when deno markers exist", () => {
    const dir = mkdtempSync(join(tmpdir(), "lsp-deno-"))
    mkdirSync(join(dir, "node_modules", ".bin"), { recursive: true })
    writeFileSync(join(dir, "deno.json"), "{}", "utf-8")
    writeFileSync(join(dir, "node_modules", ".bin", "typescript-language-server"), "", "utf-8")

    try {
      const selected = selectServerForFile(join(dir, "main.ts"), dir, [".ts"], () => true)
      expect(selected?.id).toBe("deno")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
