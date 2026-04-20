import { afterAll, beforeAll, describe, expect, it } from "bun:test"
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { applyEditsToFile, applyWorkspaceEdit } from "../tools/lsp/workspace-edit"

const testDir = join(tmpdir(), `easycode-lsp-edit-${Date.now()}`)

beforeAll(() => mkdirSync(testDir, { recursive: true }))
afterAll(() => rmSync(testDir, { recursive: true, force: true }))

describe("applyEditsToFile", () => {
  it("applies multi-line edits", () => {
    const filePath = join(testDir, "multi.ts")
    writeFileSync(filePath, "function foo() {\n  return 1;\n}", "utf-8")

    applyEditsToFile(filePath, [
      {
        range: {
          start: { line: 1, character: 2 },
          end: { line: 2, character: 1 },
        },
        newText: "return a + b;\n}",
      },
    ])

    expect(readFileSync(filePath, "utf-8")).toBe("function foo() {\n  return a + b;\n}")
  })

  it("rejects overlapping edits", () => {
    const filePath = join(testDir, "overlap.ts")
    writeFileSync(filePath, "abcdef", "utf-8")

    expect(() =>
      applyEditsToFile(filePath, [
        {
          range: {
            start: { line: 0, character: 1 },
            end: { line: 0, character: 4 },
          },
          newText: "XX",
        },
        {
          range: {
            start: { line: 0, character: 3 },
            end: { line: 0, character: 5 },
          },
          newText: "YY",
        },
      ]),
    ).toThrow("Overlapping edits")
  })
})

describe("applyWorkspaceEdit", () => {
  it("skips edits outside the workspace root", () => {
    const inRoot = join(testDir, "inside.ts")
    writeFileSync(inRoot, "const x = 1\n", "utf-8")

    const result = applyWorkspaceEdit(
      {
        changes: {
          [`file://${inRoot}`]: [
            {
              range: {
                start: { line: 0, character: 6 },
                end: { line: 0, character: 7 },
              },
              newText: "y",
            },
          ],
          "file:///tmp/outside.ts": [
            {
              range: {
                start: { line: 0, character: 0 },
                end: { line: 0, character: 0 },
              },
              newText: "bad",
            },
          ],
        },
      },
      testDir,
    )

    expect(result).toContain("Renamed in 1 file")
    expect(result).toContain("Skipped 1 file")
  })
})
