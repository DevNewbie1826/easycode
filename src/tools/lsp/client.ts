import { spawn } from "bun"
import { readFileSync, realpathSync } from "node:fs"
import { join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { LspError } from "./errors"
import { encodeMessage, parseMessages, type JsonRpcMessage } from "./jsonrpc"
import { languageIdForPath, type Diagnostic, type DocumentSymbol, type Location } from "./types"

class JsonRpcClient {
  private static readonly MAX_BUFFER_SIZE = 32 * 1024 * 1024
  private buffer = new Uint8Array(0)
  private stderrBuffer = ""
  private id = 0
  private closed = false
  private pending = new Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }>()
  private notificationHandler: ((method: string, params: unknown) => void) | null = null

  constructor(private proc: ReturnType<typeof spawn>) {
    this.proc.exited
      .then((code) => {
        this.closed = true
        this.failPending(new Error(`LSP exited: ${code}`))
      })
      .catch(() => {})
    void this.readLoop()
    void this.drainStderr()
  }

  private failPending(error: Error): void {
    for (const [id, pair] of this.pending) {
      this.pending.delete(id)
      clearTimeout(pair.timer)
      pair.reject(error)
    }
  }

  setNotificationHandler(fn: (method: string, params: unknown) => void): void {
    this.notificationHandler = fn
  }

  async request(method: string, params?: unknown, timeoutMs = 30_000): Promise<unknown> {
    if (this.closed || this.proc.exitCode !== null) throw new Error("LSP exited")
    const id = ++this.id
    let pair!: { resolve: (value: unknown) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }

    const promise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`LSP request '${method}' timed out after ${timeoutMs}ms`))
      }, timeoutMs)

      pair = {
        resolve: (value) => {
          clearTimeout(timer)
          resolve(value)
        },
        reject: (error) => {
          clearTimeout(timer)
          reject(error)
        },
        timer,
      }

      this.pending.set(id, pair)
    })

    try {
      await this.write({ jsonrpc: "2.0", id, method, params })
    } catch (error) {
      this.pending.delete(id)
      clearTimeout(pair.timer)
      throw error
    }

    return promise
  }

  async notify(method: string, params?: unknown): Promise<void> {
    await this.write({ jsonrpc: "2.0", method, params })
  }

  private async write(msg: JsonRpcMessage): Promise<void> {
    await (this.proc.stdin as any).write(encodeMessage(msg))
  }

  private async readLoop(): Promise<void> {
    const reader = (this.proc.stdout as any).getReader()
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        this.append(value)
        this.process()
      }
    } catch {}
  }

  private async drainStderr(): Promise<void> {
    const stderr = this.proc.stderr as ReadableStream<Uint8Array> | undefined
    if (!stderr?.getReader) return
    const reader = stderr.getReader()
    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) {
          this.stderrBuffer += decoder.decode(value)
          if (this.stderrBuffer.length > 4096) {
            this.stderrBuffer = this.stderrBuffer.slice(-4096)
          }
        }
      }
    } catch {}
  }

  getStderr(): string {
    return this.stderrBuffer
  }

  private append(chunk: Uint8Array): void {
    if (this.buffer.length + chunk.length > JsonRpcClient.MAX_BUFFER_SIZE) {
      const error = new Error(`LSP stream buffer exceeded ${JsonRpcClient.MAX_BUFFER_SIZE} bytes`)
      this.closed = true
      this.failPending(error)
      try {
        this.proc.kill()
      } catch {}
      throw error
    }

    const next = new Uint8Array(this.buffer.length + chunk.length)
    next.set(this.buffer)
    next.set(chunk, this.buffer.length)
    this.buffer = next
  }

  private process(): void {
    let consumed = 0
    let messages: JsonRpcMessage[] = []

    try {
      const parsed = parseMessages(this.buffer)
      consumed = parsed.consumed
      messages = parsed.messages
    } catch (error: any) {
      this.closed = true
      this.failPending(new Error(`LSP stream parse failure: ${error?.message ?? String(error)}`))
      try {
        this.proc.kill()
      } catch {}
      return
    }

    if (consumed > 0) {
      const remaining = this.buffer.subarray(consumed)
      this.buffer = remaining.length > 0 ? new Uint8Array(remaining) : new Uint8Array(0)
    }

    for (const msg of messages) {
      if (msg.id !== undefined && msg.id !== null) {
        const pair = this.pending.get(msg.id as number)
        if (!pair) continue
        this.pending.delete(msg.id as number)
        if (msg.error) pair.reject(new Error((msg.error as any).message || JSON.stringify(msg.error)))
        else pair.resolve(msg.result)
      } else if (msg.method) {
        this.notificationHandler?.(String(msg.method), msg.params)
      }
    }
  }

  async close(): Promise<void> {
    try {
      ;(this.proc.stdin as any).end?.()
    } catch {}
  }
}

interface OpenDocument {
  uri: string
  version: number
  text: string
}

export class LspClient {
  private rpc: JsonRpcClient | null = null
  private proc: ReturnType<typeof spawn> | null = null
  private openDocs = new Map<string, OpenDocument>()
  private pendingOpens = new Map<string, Promise<void>>()
  private diagnosticsStore = new Map<string, Diagnostic[]>()
  private initPromise: Promise<void> | null = null
  private alive = false
  private capabilities: Record<string, unknown> | null = null

  constructor(private root: string, private cmd: string[]) {}

  private canonicalPath(filePath: string): string {
    const absPath = resolve(filePath)
    try {
      return realpathSync(absPath)
    } catch {
      return absPath
    }
  }

  private toUri(filePath: string): string {
    return pathToFileURL(this.canonicalPath(filePath)).href
  }

  private resetState(): void {
    this.rpc = null
    this.proc = null
    this.openDocs.clear()
    this.pendingOpens.clear()
    this.diagnosticsStore.clear()
    this.initPromise = null
    this.alive = false
    this.capabilities = null
  }

  async start(): Promise<void> {
    if (this.initPromise) return this.initPromise
    this.initPromise = this.doStart()
      .catch(async (error) => {
        try {
          await this.stop()
        } catch {}
        throw error
      })
      .finally(() => {
        this.initPromise = null
      })
    return this.initPromise
  }

  private async doStart(): Promise<void> {
    const pathParts = [join(this.root, "node_modules", ".bin")]
    if (process.env.PATH) pathParts.push(...process.env.PATH.split(process.platform === "win32" ? ";" : ":"))
    const env = { ...process.env, PATH: pathParts.join(process.platform === "win32" ? ";" : ":") }

    this.proc = spawn(this.cmd, {
      stdin: "pipe",
      stdout: "pipe",
      stderr: "pipe",
      cwd: this.root,
      env,
    })

    this.proc.exited.then(() => {
      this.alive = false
    }).catch(() => {})

    const exitWatch = new Promise<never>((_, reject) => {
      this.proc!.exited.then((code) => {
        if (!this.alive) reject(new Error(`LSP exited immediately: ${code}`))
      }).catch(() => {})
    })

    this.rpc = new JsonRpcClient(this.proc)
    this.rpc.setNotificationHandler((method, params: any) => {
      if (method === "textDocument/publishDiagnostics" && params.uri) {
        this.diagnosticsStore.set(params.uri, params.diagnostics ?? [])
      }
    })

    const rootUri = pathToFileURL(this.canonicalPath(this.root)).href
    const initResult = await Promise.race([
      this.rpc.request("initialize", {
        processId: process.pid,
        rootUri,
        workspaceFolders: [{ uri: rootUri, name: "workspace" }],
        capabilities: {
          textDocument: {
            hover: { contentFormat: ["markdown", "plaintext"] },
            definition: { linkSupport: true },
            references: {},
            documentSymbol: { hierarchicalDocumentSymbolSupport: true },
            publishDiagnostics: {},
            rename: { prepareSupport: true, prepareSupportDefaultBehavior: 1 },
          },
          workspace: { symbol: {}, workspaceFolders: true, applyEdit: true },
        },
      }),
      exitWatch,
    ]) as { capabilities?: Record<string, unknown> }

    this.capabilities = initResult?.capabilities ?? {}
    await this.rpc.notify("initialized")
    this.alive = true
    await Promise.race([
      this.proc.exited.then((code) => Promise.reject(new Error(`LSP exited immediately: ${code}`))),
      new Promise((resolve) => setTimeout(resolve, 200)),
    ])
  }

  isAlive(): boolean {
    return this.alive && this.rpc !== null && this.proc !== null && this.proc.exitCode === null
  }

  supportsMethod(method: string): boolean {
    if (!this.capabilities) return false
    switch (method) {
      case "definition":
        return !!this.capabilities.definitionProvider
      case "references":
        return !!this.capabilities.referencesProvider
      case "documentSymbol":
        return !!this.capabilities.documentSymbolProvider
      case "rename":
        return !!this.capabilities.renameProvider
      case "hover":
        return !!this.capabilities.hoverProvider
      case "diagnostic":
        return !!this.capabilities.diagnosticProvider || !!this.capabilities.publishDiagnostics
      default:
        return true
    }
  }

  private requireMethod(method: string): void {
    if (!this.supportsMethod(method)) {
      throw LspError.notSupported(method)
    }
  }

  private isPrepareRenameUnavailableError(error: unknown): boolean {
    const message = String((error as any)?.message ?? "").toLowerCase()
    return (
      message.includes("cannot rename") ||
      message.includes("can't rename") ||
      message.includes("not valid at") ||
      message.includes("invalid position") ||
      message.includes("prepare rename failed")
    )
  }

  killSync(): void {
    try {
      this.proc?.kill()
    } catch {}
  }

  getStderr(): string {
    return this.rpc?.getStderr() ?? ""
  }

  async stop(): Promise<void> {
    if (!this.rpc && !this.proc) return
    this.alive = false
    if (this.rpc && this.proc?.exitCode === null) {
      try {
        await this.rpc.request("shutdown", undefined, 3_000)
      } catch {}
      try {
        await this.rpc.notify("exit")
      } catch {}
    }
    try {
      await this.rpc?.close()
    } catch {}
    try {
      this.proc?.kill()
    } catch {}
    this.resetState()
  }

  async ensureDocumentOpen(filePath: string): Promise<void> {
    const canonicalPath = this.canonicalPath(filePath)
    const uri = this.toUri(canonicalPath)
    if (this.openDocs.has(uri)) return

    const pending = this.pendingOpens.get(uri)
    if (pending) return pending

    const promise = this.doOpenDocument(canonicalPath, uri).finally(() => {
      this.pendingOpens.delete(uri)
    })
    this.pendingOpens.set(uri, promise)
    return promise
  }

  private async doOpenDocument(canonicalPath: string, uri: string): Promise<void> {
    const text = readFileSync(canonicalPath, "utf-8")
    const languageId = languageIdForPath(canonicalPath)

    await this.rpc!.notify("textDocument/didOpen", {
      textDocument: { uri, languageId, version: 1, text },
    })
    this.openDocs.set(uri, { uri, version: 1, text })
  }

  async syncDocument(filePath: string): Promise<void> {
    const canonicalPath = this.canonicalPath(filePath)
    const uri = this.toUri(canonicalPath)
    const doc = this.openDocs.get(uri)

    if (!doc) {
      await this.ensureDocumentOpen(filePath)
      return
    }

    const text = readFileSync(canonicalPath, "utf-8")
    if (doc.text === text) return

    doc.version++
    await this.rpc!.notify("textDocument/didChange", {
      textDocument: { uri, version: doc.version },
      contentChanges: [{ text }],
    })
    doc.text = text
  }

  async ensureOpenMany(filePaths: string[]): Promise<void> {
    const toOpen: string[] = []
    const toSync: string[] = []

    for (const filePath of filePaths) {
      const uri = this.toUri(filePath)
      if (this.openDocs.has(uri)) toSync.push(filePath)
      else toOpen.push(filePath)
    }

    await Promise.all(toOpen.map((filePath) => this.ensureDocumentOpen(filePath)))

    for (const filePath of toSync) {
      await this.syncDocument(filePath)
    }
  }

  private pos(line: number, character: number) {
    return { line: line - 1, character }
  }

  private td(filePath: string) {
    return { uri: this.toUri(filePath) }
  }

  async definition(filePath: string, line: number, character: number): Promise<unknown> {
    this.requireMethod("definition")
    await this.ensureDocumentOpen(filePath)
    return this.rpc!.request("textDocument/definition", {
      textDocument: this.td(filePath),
      position: this.pos(line, character),
    })
  }

  async references(filePath: string, line: number, character: number, includeDeclaration = true): Promise<unknown> {
    this.requireMethod("references")
    await this.ensureDocumentOpen(filePath)
    return this.rpc!.request("textDocument/references", {
      textDocument: this.td(filePath),
      position: this.pos(line, character),
      context: { includeDeclaration },
    })
  }

  async documentSymbols(filePath: string): Promise<DocumentSymbol[]> {
    this.requireMethod("documentSymbol")
    await this.ensureDocumentOpen(filePath)
    return ((await this.rpc!.request("textDocument/documentSymbol", { textDocument: this.td(filePath) })) as DocumentSymbol[]) ?? []
  }

  async workspaceSymbols(query: string): Promise<Array<{ name: string; kind: number; location?: { uri: string; range?: unknown }; uri?: string }>> {
    const result: any = await this.rpc!.request("workspace/symbol", { query })
    return (result ?? []).map((symbol: any) => ({
      name: symbol.name,
      kind: symbol.kind,
      location: symbol.location,
      uri: symbol.location?.uri,
    }))
  }

  async getDiagnostics(filePath: string): Promise<Diagnostic[]> {
    await this.ensureDocumentOpen(filePath)
    try {
      const result: any = await this.rpc!.request("textDocument/diagnostic", { textDocument: this.td(filePath) })
      if (result?.items) return result.items
    } catch {}
    return this.diagnosticsStore.get(this.toUri(filePath)) ?? []
  }

  async prepareRename(filePath: string, line: number, character: number): Promise<unknown> {
    this.requireMethod("rename")
    const absPath = resolve(filePath)
    await this.ensureDocumentOpen(absPath)
    try {
      return await this.rpc!.request("textDocument/prepareRename", {
        textDocument: this.td(absPath),
        position: this.pos(line, character),
      })
    } catch (error) {
      if (this.isPrepareRenameUnavailableError(error)) return null
      throw error
    }
  }

  async rename(filePath: string, line: number, character: number, newName: string): Promise<unknown> {
    this.requireMethod("rename")
    await this.ensureDocumentOpen(filePath)
    return this.rpc!.request("textDocument/rename", {
      textDocument: this.td(filePath),
      position: this.pos(line, character),
      newName,
    })
  }
}

export function normalizeLocations(result: unknown): Location[] {
  if (!result) return []
  if (Array.isArray(result)) {
    return result.flatMap(normalizeLocations).filter((item) => item !== null && item !== undefined && item.uri)
  }
  if (typeof result === "object") {
    const obj = result as Record<string, unknown>
    if ("targetUri" in obj && obj.targetUri && typeof obj.targetUri === "string") {
      return [{ uri: obj.targetUri, range: (obj.targetRange ?? obj.targetSelectionRange) as Location["range"] }]
    }
    if ("uri" in obj && obj.uri && typeof obj.uri === "string" && "range" in obj) {
      return [{ uri: obj.uri, range: obj.range as Location["range"] }]
    }
  }
  return []
}

export function uriToPath(uri: string): string {
  try {
    return fileURLToPath(uri)
  } catch {
    return uri
  }
}
