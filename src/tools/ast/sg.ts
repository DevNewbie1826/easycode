import { spawn } from "bun"
import { existsSync, readFileSync, realpathSync, statSync, writeFileSync } from "node:fs"
import { isAbsolute, join, relative, resolve } from "node:path"

export const LANGS = [
  "javascript", "typescript", "tsx", "jsx", "python", "rust", "go", "ruby",
  "java", "kotlin", "c", "cpp", "csharp", "fsharp", "php", "swift",
  "scala", "dart", "lua", "haskell", "elixir", "erlang", "bash", "zsh",
  "html", "css", "json", "yaml", "toml", "sql", "dockerfile", "protobuf",
  "thrift", "graphql", "vue", "svelte", "astro", "ocaml", "rescript",
  "r", "racket", "scheme", "clojure", "nim", "zig", "julia", "perl",
  "make", "cmake", "terraform", "nix", "solidity", "beancount", "elm",
] as const

export type AstLang = (typeof LANGS)[number]

export type SgMatch = {
  file: string
  line: number
  column: number
  text: string
  replacement?: string
  replacementStart?: number
  replacementEnd?: number
}

export type SgResult = {
  matches: SgMatch[]
  total: number
  truncated: boolean
  error?: string
}

export const MAX_FORMATTED_MATCHES = 100

type SgRunArgs = {
  pattern: string
  lang: AstLang
  rewrite?: string
  context?: number
  globs?: string[]
  paths?: string[]
}

function findSg(executionRoot: string): string | null {
  const binName = process.platform === "win32" ? "sg.cmd" : "sg"
  const localBin = join(executionRoot, "node_modules", ".bin", binName)
  if (existsSync(localBin)) return localBin

  const pathDirs = (process.env.PATH ?? "").split(process.platform === "win32" ? ";" : ":").filter(Boolean)
  for (const dir of pathDirs) {
    const candidate = join(dir, binName)
    if (existsSync(candidate)) return candidate
  }

  return null
}

async function getSgPath(executionRoot: string): Promise<string> {
  const found = findSg(executionRoot)
  if (found) return found
  throw new Error("ast-grep binary not found. Install `sg` or `@ast-grep/cli` to use ast-grep tools.")
}

function getTimeoutMs(): number {
  const value = Number(process.env.AST_GREP_TIMEOUT_MS ?? "60000")
  return Number.isFinite(value) && value > 0 ? value : 60000
}

export function resolveExecutionRoot(context?: { directory?: string; worktree?: string }): string {
  return context?.worktree || context?.directory || process.cwd()
}

export async function runSg(args: string[], cwd: string): Promise<{ stdout: string; stderr: string; code: number; timedOut: boolean }> {
  const bin = await getSgPath(cwd)
  const proc = spawn([bin, ...args], { cwd, stdout: "pipe", stderr: "pipe" })

  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    proc.kill()
  }, getTimeoutMs())

  try {
    const [code, stdout, stderr] = await Promise.all([
      proc.exited,
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
    ])
    return { stdout, stderr, code: code ?? 1, timedOut }
  } finally {
    clearTimeout(timer)
  }
}

export function buildRunArgs(args: SgRunArgs, defaultRoot: string): string[] {
  const cmdArgs = ["run", "-p", args.pattern]
  if (args.rewrite !== undefined) cmdArgs.push("-r", args.rewrite)
  cmdArgs.push("--lang", args.lang)

  if (args.context !== undefined) {
    if (!Number.isInteger(args.context) || args.context < 0) {
      throw new Error("context must be a non-negative integer")
    }
    if (args.context > 0) cmdArgs.push("-C", String(args.context))
  }

  cmdArgs.push("--json=compact")

  if (args.globs) {
    for (const glob of args.globs) cmdArgs.push("--globs", glob)
  }

  cmdArgs.push(...(args.paths?.length ? args.paths : [defaultRoot]))
  return cmdArgs
}

export function parseSgJson(stdout: string): SgResult {
  const trimmed = stdout.trim()
  if (!trimmed) return { matches: [], total: 0, truncated: false }

  try {
    const data = JSON.parse(trimmed)
    const items = Array.isArray(data) ? data : (data.matches ?? data.results ?? [])
    return {
      matches: items.map((item: any) => ({
        file: String(item.file ?? ""),
        line: Number(item.range?.start?.line ?? 0) + 1,
        column: Number(item.range?.start?.column ?? 0) + 1,
        text: String(item.text ?? item.lines ?? ""),
        replacement: item.replacement !== undefined ? String(item.replacement) : undefined,
        replacementStart: item.replacementOffsets?.start !== undefined ? Number(item.replacementOffsets.start) : undefined,
        replacementEnd: item.replacementOffsets?.end !== undefined ? Number(item.replacementOffsets.end) : undefined,
      })),
      total: items.length,
      truncated: items.length > MAX_FORMATTED_MATCHES,
    }
  } catch {
    return { matches: [], total: 0, truncated: false, error: "Failed to parse ast-grep JSON output" }
  }
}

function resolveTargetFile(file: string, executionRoot: string): string {
  const candidate = resolve(executionRoot, file)
  if (!existsSync(candidate)) {
    throw new Error(`Matched file does not exist: ${file}`)
  }

  const stats = statSync(candidate)
  if (!stats.isFile()) {
    throw new Error(`Matched path is not a file: ${file}`)
  }

  const realRoot = existsSync(executionRoot) ? realpathSync(executionRoot) : resolve(executionRoot)
  const realTarget = realpathSync(candidate)
  const rel = relative(realRoot, realTarget)
  if (rel === "" || rel.startsWith("..") || isAbsolute(rel)) {
    throw new Error(`Refusing to modify file outside the execution root: ${file}`)
  }

  return realTarget
}

export function applyReplacements(result: SgResult, executionRoot: string): void {
  const editsPerFile = new Map<string, Array<{ start: number; end: number; replacement: string }>>()

  for (const match of result.matches) {
    if (
      !match.file ||
      match.replacement === undefined ||
      match.replacementStart === undefined ||
      match.replacementEnd === undefined
    ) {
      continue
    }

    const targetFile = resolveTargetFile(match.file, executionRoot)
    if (!editsPerFile.has(targetFile)) editsPerFile.set(targetFile, [])
    editsPerFile.get(targetFile)!.push({
      start: match.replacementStart,
      end: match.replacementEnd,
      replacement: match.replacement,
    })
  }

  const plannedWrites = new Map<string, string>()
  for (const [file, edits] of editsPerFile) {
    let text = readFileSync(file, "utf-8")
    const sorted = edits.sort((a, b) => b.start - a.start)
    for (const edit of sorted) {
      if (edit.start < 0 || edit.end < edit.start || edit.end > text.length) {
        throw new Error(`Invalid replacement range for ${file}`)
      }
      text = text.slice(0, edit.start) + edit.replacement + text.slice(edit.end)
    }
    plannedWrites.set(file, text)
  }

  const originals = new Map<string, string>()
  const written: string[] = []
  try {
    for (const [file, text] of plannedWrites) {
      originals.set(file, readFileSync(file, "utf-8"))
      writeFileSync(file, text, "utf-8")
      written.push(file)
    }
  } catch (error) {
    for (const file of written) {
      const original = originals.get(file)
      if (original !== undefined) {
        try {
          writeFileSync(file, original, "utf-8")
        } catch {}
      }
    }
    throw error
  }
}
