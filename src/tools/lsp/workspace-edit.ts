import { existsSync, readFileSync, realpathSync, statSync, writeFileSync } from "node:fs"
import { isAbsolute, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import type { Position, TextEdit, WorkspaceEdit } from "./types"

function invalidPosition(pos: Position): Error {
  return new Error(`Invalid position: line=${pos.line}, character=${pos.character}`)
}

function toOffset(text: string, pos: Position): number {
  if (pos.line < 0 || pos.character < 0) throw invalidPosition(pos)

  let offset = 0
  for (let line = 0; line < pos.line; line++) {
    const next = text.indexOf("\n", offset)
    if (next < 0) throw invalidPosition(pos)
    offset = next + 1
  }

  const lineStart = offset
  const nextNl = text.indexOf("\n", offset)
  let lineEnd = nextNl < 0 ? text.length : nextNl
  if (lineEnd > lineStart && text[lineEnd - 1] === "\r") lineEnd--

  const lineLength = lineEnd - lineStart
  if (pos.character > lineLength) throw invalidPosition(pos)

  return offset + pos.character
}

export function applyEditsToText(text: string, edits: TextEdit[]): string {
  const editsWithOffsets = edits
    .map((edit) => ({
      startOffset: toOffset(text, edit.range.start),
      endOffset: toOffset(text, edit.range.end),
      newText: edit.newText,
    }))
    .sort((left, right) => right.startOffset - left.startOffset)

  for (let i = 1; i < editsWithOffsets.length; i++) {
    if (editsWithOffsets[i].endOffset > editsWithOffsets[i - 1].startOffset) {
      throw new Error("Overlapping edits detected")
    }
  }

  let result = text
  for (const edit of editsWithOffsets) {
    result = result.slice(0, edit.startOffset) + edit.newText + result.slice(edit.endOffset)
  }
  return result
}

export function applyEditsToFile(filePath: string, edits: TextEdit[]): void {
  const text = readFileSync(filePath, "utf-8")
  const next = applyEditsToText(text, edits)
  writeFileSync(filePath, next, "utf-8")
}

function uriToPath(uri: string): string {
  try {
    return fileURLToPath(uri)
  } catch {
    return uri
  }
}

export function applyWorkspaceEdit(edit: WorkspaceEdit | null, root: string): string {
  if (!edit) return "No changes to apply."

  const absRoot = resolve(root)
  const realRoot = existsSync(absRoot) ? realpathSync(absRoot) : absRoot
  const editsPerFile = new Map<string, TextEdit[]>()
  const skipped: string[] = []

  const addEdits = (uri: string, edits: TextEdit[]) => {
    const resolved = resolve(uriToPath(uri))
    if (!existsSync(resolved)) {
      skipped.push(uri)
      return
    }

    const stats = statSync(resolved)
    if (!stats.isFile()) {
      skipped.push(uri)
      return
    }

    const realTarget = realpathSync(resolved)
    const rel = relative(realRoot, realTarget)
    if (rel === "" || rel.startsWith("..") || isAbsolute(rel)) {
      skipped.push(uri)
      return
    }

    if (!editsPerFile.has(realTarget)) editsPerFile.set(realTarget, [])
    editsPerFile.get(realTarget)!.push(...edits)
  }

  if (edit.documentChanges) {
    for (const change of edit.documentChanges) {
      if ("textDocument" in change && "edits" in change) {
        addEdits(change.textDocument.uri, change.edits)
      }
    }
  }

  if (edit.changes) {
    for (const [uri, changes] of Object.entries(edit.changes)) {
      addEdits(uri, changes)
    }
  }

  const originals = new Map<string, string>()
  const written: string[] = []
  try {
    for (const [filePath, fileEdits] of editsPerFile) {
      const original = readFileSync(filePath, "utf-8")
      originals.set(filePath, original)
      const next = applyEditsToText(original, fileEdits)
      writeFileSync(filePath, next, "utf-8")
      written.push(filePath)
    }
  } catch (error) {
    for (const filePath of written) {
      const original = originals.get(filePath)
      if (original !== undefined) writeFileSync(filePath, original, "utf-8")
    }
    throw error
  }

  let output = `Renamed in ${written.length} file(s):\n${written.join("\n")}`
  if (skipped.length) {
    output += `\n\nSkipped ${skipped.length} file(s) outside workspace:\n${skipped.join("\n")}`
  }
  return output
}
