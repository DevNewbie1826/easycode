import type { RemoteMcpServer } from "./index"

export type WebsearchMcpConfig = {
  enabled?: boolean
  apiKey?: string
}

export type WebsearchMcpServer = RemoteMcpServer & {
  enabled?: boolean
}

export function createWebsearchMcp(config?: WebsearchMcpConfig): WebsearchMcpServer | undefined {
  if (!config) {
    return undefined
  }

  const url = config.enabled === false || !config.apiKey
    ? "https://mcp.exa.ai/mcp"
    : `https://mcp.exa.ai/mcp?exaApiKey=${encodeURIComponent(config.apiKey)}`

  return {
    type: "remote",
    url,
    ...(config.enabled === false ? { enabled: false } : {}),
  }
}
