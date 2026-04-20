export type JsonRpcMessage = Record<string, unknown>

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

export const MAX_JSONRPC_CONTENT_LENGTH = 16 * 1024 * 1024

export function encodeMessage(msg: JsonRpcMessage): Uint8Array {
  const body = textEncoder.encode(JSON.stringify(msg))
  const header = textEncoder.encode(`Content-Length: ${body.length}\r\n\r\n`)
  const combined = new Uint8Array(header.length + body.length)
  combined.set(header)
  combined.set(body, header.length)
  return combined
}

export function parseMessages(
  buffer: Uint8Array,
  maxContentLength = MAX_JSONRPC_CONTENT_LENGTH,
): { consumed: number; messages: JsonRpcMessage[] } {
  const messages: JsonRpcMessage[] = []
  let offset = 0

  while (offset < buffer.length) {
    const headerEnd = findCrlfCrlf(buffer, offset)
    if (headerEnd < 0) break

    const header = textDecoder.decode(buffer.subarray(offset, headerEnd))
    const match = header.match(/Content-Length:\s*(\d+)/i)
    if (!match) {
      offset = headerEnd + 4
      continue
    }

    const contentLength = Number.parseInt(match[1], 10)
    if (!Number.isFinite(contentLength) || contentLength < 0) {
      throw new Error("Invalid Content-Length header")
    }
    if (contentLength > maxContentLength) {
      throw new Error(`Content-Length ${contentLength} exceeds max ${maxContentLength}`)
    }

    const bodyStart = headerEnd + 4
    if (buffer.length < bodyStart + contentLength) break

    try {
      messages.push(JSON.parse(textDecoder.decode(buffer.subarray(bodyStart, bodyStart + contentLength))))
    } catch {
      console.warn(`[lsp-jsonrpc] Failed to parse JSON message (${contentLength} bytes)`)
    }

    offset = bodyStart + contentLength
  }

  return { consumed: offset, messages }
}

function findCrlfCrlf(buf: Uint8Array, start: number): number {
  for (let i = start; i < buf.length - 3; i++) {
    if (buf[i] === 0x0d && buf[i + 1] === 0x0a && buf[i + 2] === 0x0d && buf[i + 3] === 0x0a) {
      return i
    }
  }
  return -1
}
