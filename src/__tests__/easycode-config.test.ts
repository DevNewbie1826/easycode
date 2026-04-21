import { afterAll, describe, expect, it } from "bun:test"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { homedir, tmpdir } from "node:os"
import { join } from "node:path"
import { getDefaultGlobalConfigPath, loadEasyCodeConfig } from "../easycode-config"

function createDirectoryWithEasyCodeConfig(content: string) {
  const directory = mkdtempSync(join(tmpdir(), "easycode-config-"))
  const configDirectory = join(directory, ".opencode")

  mkdirSync(configDirectory)
  writeFileSync(join(configDirectory, "easycode.json"), content)

  return directory
}

const isolatedGlobalConfigRoot = mkdtempSync(join(tmpdir(), "easycode-global-empty-"))
const isolatedGlobalConfigPath = join(isolatedGlobalConfigRoot, "easycode.json")

afterAll(() => {
  rmSync(isolatedGlobalConfigRoot, { recursive: true, force: true })
})

function loadIsolatedEasyCodeConfig(directories: string | readonly string[]) {
  return loadEasyCodeConfig(directories, { globalConfigPath: isolatedGlobalConfigPath })
}

describe("loadEasyCodeConfig", () => {
  it("parses agent model, variant, and temperature bindings", () => {
    const directory = createDirectoryWithEasyCodeConfig(
      JSON.stringify({
        agent: {
          explorer: {
            model: "gpt-5",
            variant: "fast",
            temperature: 0.3,
          },
        },
      }),
    )

    try {
      expect(loadIsolatedEasyCodeConfig(directory)).toEqual({
        agent: {
          explorer: {
            model: "gpt-5",
            variant: "fast",
            temperature: 0.3,
          },
        },
      })
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("ignores invalid agent entries and unknown keys", () => {
    const directory = createDirectoryWithEasyCodeConfig(
      JSON.stringify({
        agent: {
          explorer: {
            model: "gpt-5",
            variant: "fast",
            provider: "openai",
            temperature: 0.1,
          },
          reviewer: {
            model: 123,
            variant: true,
            temperature: "hot",
          },
          planner: "gpt-5",
        },
      }),
    )

    try {
      expect(loadIsolatedEasyCodeConfig(directory)).toEqual({
        agent: {
          explorer: {
            model: "gpt-5",
            variant: "fast",
            temperature: 0.1,
          },
        },
      })
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("parses valid agent color values and ignores non-string colors", () => {
    const directory = createDirectoryWithEasyCodeConfig(
      JSON.stringify({
        agent: {
          explorer: {
            model: "gpt-5",
            color: "blue",
          },
          reviewer: {
            color: 123,
          },
          planner: {
            color: false,
          },
        },
      }),
    )

    try {
      expect(loadIsolatedEasyCodeConfig(directory)).toEqual({
        agent: {
          explorer: {
            model: "gpt-5",
            color: "blue",
          },
        },
      })
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("preserves existing mcp parsing behavior", () => {
    const directory = createDirectoryWithEasyCodeConfig(
      JSON.stringify({
        mcp: {
          websearch: {
            enabled: true,
            apiKey: "exa",
          },
        },
      }),
    )

    try {
      expect(loadIsolatedEasyCodeConfig(directory)).toEqual({
        mcp: {
          websearch: {
            enabled: true,
            apiKey: "exa",
          },
        },
      })
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("merges top-level sections across directories", () => {
    const worktreeDirectory = createDirectoryWithEasyCodeConfig(
      JSON.stringify({
        mcp: {
          websearch: {
            enabled: true,
          },
        },
      }),
    )
    const repoDirectory = createDirectoryWithEasyCodeConfig(
      JSON.stringify({
        agent: {
          explorer: {
            model: "gpt-5",
          },
        },
      }),
    )

    try {
      expect(loadIsolatedEasyCodeConfig([worktreeDirectory, repoDirectory])).toEqual({
        mcp: {
          websearch: {
            enabled: true,
          },
        },
        agent: {
          explorer: {
            model: "gpt-5",
          },
        },
      })
    } finally {
      rmSync(worktreeDirectory, { recursive: true, force: true })
      rmSync(repoDirectory, { recursive: true, force: true })
    }
  })

  it("keeps higher-precedence agent entries authoritative by agent name", () => {
    const worktreeDirectory = createDirectoryWithEasyCodeConfig(
      JSON.stringify({
        agent: {
          explorer: {
            model: "gpt-5",
            variant: "fast",
            temperature: 0.2,
          },
        },
      }),
    )
    const repoDirectory = createDirectoryWithEasyCodeConfig(
      JSON.stringify({
        agent: {
          explorer: {
            model: "claude-sonnet",
            variant: "smart",
            temperature: 1.2,
          },
          reviewer: {
            variant: "deep",
          },
        },
      }),
    )

    try {
      expect(loadIsolatedEasyCodeConfig([worktreeDirectory, repoDirectory])).toEqual({
        agent: {
          explorer: {
            model: "gpt-5",
            variant: "fast",
            temperature: 0.2,
          },
          reviewer: {
            variant: "deep",
          },
        },
      })
    } finally {
      rmSync(worktreeDirectory, { recursive: true, force: true })
      rmSync(repoDirectory, { recursive: true, force: true })
    }
  })

  it("does not inherit missing fields for a partial higher-precedence agent entry", () => {
    const worktreeDirectory = createDirectoryWithEasyCodeConfig(
      JSON.stringify({
        agent: {
          explorer: {
            model: "gpt-5",
            temperature: 0.4,
          },
        },
      }),
    )
    const repoDirectory = createDirectoryWithEasyCodeConfig(
      JSON.stringify({
        agent: {
          explorer: {
            variant: "fast",
            temperature: 1.1,
          },
        },
      }),
    )

    try {
      expect(loadIsolatedEasyCodeConfig([worktreeDirectory, repoDirectory])).toEqual({
        agent: {
          explorer: {
            model: "gpt-5",
            temperature: 0.4,
          },
        },
      })
    } finally {
      rmSync(worktreeDirectory, { recursive: true, force: true })
      rmSync(repoDirectory, { recursive: true, force: true })
    }
  })

  it("parses valid agent permission values including nested bash rules", () => {
    const directory = createDirectoryWithEasyCodeConfig(
      JSON.stringify({
        agent: {
          explorer: {
            permission: {
              question: "allow",
              apply_patch: "deny",
              ast_grep_replace: "deny",
              edit: "deny",
              lsp_rename: "deny",
              task: "deny",
              bash: {
                "*": "ask",
                "git status*": "allow",
                "git push*": "deny",
              },
              webfetch: "allow",
              external_directory: "deny",
            },
          },
        },
      }),
    )

    try {
      expect(loadIsolatedEasyCodeConfig(directory)).toEqual({
        agent: {
          explorer: {
            permission: {
              question: "allow",
              apply_patch: "deny",
              ast_grep_replace: "deny",
              edit: "deny",
              lsp_rename: "deny",
              task: "deny",
              bash: {
                "*": "ask",
                "git status*": "allow",
                "git push*": "deny",
              },
              webfetch: "allow",
              external_directory: "deny",
            },
          },
        },
      })
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("preserves doom_loop as a valid root permission key", () => {
    const directory = createDirectoryWithEasyCodeConfig(
      JSON.stringify({
        agent: {
          explorer: {
            permission: {
              doom_loop: "deny",
              bash: {
                "git status*": "allow",
              },
            },
          },
        },
      }),
    )

    try {
      expect(loadIsolatedEasyCodeConfig(directory)).toEqual({
        agent: {
          explorer: {
            permission: {
              doom_loop: "deny",
              bash: {
                "git status*": "allow",
              },
            },
          },
        },
      })
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("filters invalid permission values while preserving valid nested rules", () => {
    const directory = createDirectoryWithEasyCodeConfig(
      JSON.stringify({
        agent: {
          explorer: {
            permission: {
              question: true,
              apply_patch: "deny",
              ast_grep_replace: "block",
              edit: "block",
              lsp_rename: "ask",
              task: "deny",
              bash: {
                "*": "ask",
                "git status*": "allow",
                "git push*": "sometimes",
              },
              webfetch: ["allow"],
              external_directory: "deny",
              unknown: "allow",
            },
          },
        },
      }),
    )

    try {
      expect(loadIsolatedEasyCodeConfig(directory)).toEqual({
        agent: {
          explorer: {
            permission: {
              apply_patch: "deny",
              lsp_rename: "ask",
              task: "deny",
              bash: {
                "*": "ask",
                "git status*": "allow",
              },
              external_directory: "deny",
            },
          },
        },
      })
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("rejects permission rules nested deeper than one pattern map level", () => {
    const directory = createDirectoryWithEasyCodeConfig(
      JSON.stringify({
        agent: {
          explorer: {
            permission: {
              bash: {
                "git *": {
                  status: "allow",
                },
                "npm *": "ask",
              },
              webfetch: {
                "https://example.com/*": {
                  nested: "deny",
                },
              },
              doom_loop: "deny",
            },
          },
        },
      }),
    )

    try {
      expect(loadIsolatedEasyCodeConfig(directory)).toEqual({
        agent: {
          explorer: {
            permission: {
              bash: {
                "npm *": "ask",
              },
              doom_loop: "deny",
            },
          },
        },
      })
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("keeps an empty higher-precedence agent entry to clear fallback model and variant", () => {
    const worktreeDirectory = createDirectoryWithEasyCodeConfig(
      JSON.stringify({
        agent: {
          explorer: {},
        },
      }),
    )
    const repoDirectory = createDirectoryWithEasyCodeConfig(
      JSON.stringify({
        agent: {
          explorer: {
            model: "claude-sonnet",
            variant: "smart",
            temperature: 0.9,
          },
        },
      }),
    )

    try {
      expect(loadIsolatedEasyCodeConfig([worktreeDirectory, repoDirectory])).toEqual({
        agent: {
          explorer: {},
        },
      })
    } finally {
      rmSync(worktreeDirectory, { recursive: true, force: true })
      rmSync(repoDirectory, { recursive: true, force: true })
    }
  })

  it("keeps an explicit empty permission object to clear fallback plugin-owned defaults", () => {
    const worktreeDirectory = createDirectoryWithEasyCodeConfig(
      JSON.stringify({
        agent: {
          explorer: {
            permission: {},
          },
        },
      }),
    )
    const repoDirectory = createDirectoryWithEasyCodeConfig(
      JSON.stringify({
        agent: {
          explorer: {
            permission: {
              edit: "deny",
              bash: {
                "*": "ask",
              },
            },
          },
        },
      }),
    )

    try {
      expect(loadIsolatedEasyCodeConfig([worktreeDirectory, repoDirectory])).toEqual({
        agent: {
          explorer: {
            permission: {},
          },
        },
      })
    } finally {
      rmSync(worktreeDirectory, { recursive: true, force: true })
      rmSync(repoDirectory, { recursive: true, force: true })
    }
  })

  it("returns the expected default global config path", () => {
    expect(getDefaultGlobalConfigPath()).toEqual(join(homedir(), ".config", "opencode", "easycode.json"))
  })

  it("loads global config when no local config is present", () => {
    const globalRoot = mkdtempSync(join(tmpdir(), "easycode-global-nolocal-"))
    const globalDir = join(globalRoot, ".config", "opencode")
    mkdirSync(globalDir, { recursive: true })
    writeFileSync(join(globalDir, "easycode.json"), JSON.stringify({ agent: { explorer: { model: "global-model" } } }))

    const emptyLocal = mkdtempSync(join(tmpdir(), "easycode-empty-local-"))

    try {
      const result = loadEasyCodeConfig(emptyLocal, { globalConfigPath: join(globalDir, "easycode.json") })
      expect(result).toEqual({
        agent: {
          explorer: {
            model: "global-model",
          },
        },
      })
    } finally {
      rmSync(globalRoot, { recursive: true, force: true })
      rmSync(emptyLocal, { recursive: true, force: true })
    }
  })

  it("falls through invalid local config to a valid global config", () => {
    const invalidLocal = createDirectoryWithEasyCodeConfig("{ invalid json")
    const globalRoot = mkdtempSync(join(tmpdir(), "easycode-global-fallback-"))
    const globalDir = join(globalRoot, ".config", "opencode")
    mkdirSync(globalDir, { recursive: true })
    writeFileSync(join(globalDir, "easycode.json"), JSON.stringify({ agent: { explorer: { model: "global-model" } } }))

    try {
      const result = loadEasyCodeConfig(invalidLocal, { globalConfigPath: join(globalDir, "easycode.json") })
      expect(result).toEqual({
        agent: {
          explorer: {
            model: "global-model",
          },
        },
      })
    } finally {
      rmSync(invalidLocal, { recursive: true, force: true })
      rmSync(globalRoot, { recursive: true, force: true })
    }
  })

  it("gives local config higher precedence than global for the same section", () => {
    const localDir = createDirectoryWithEasyCodeConfig(
      JSON.stringify({ mcp: { websearch: { enabled: true } } }),
    )
    const globalRoot = mkdtempSync(join(tmpdir(), "easycode-global-precedence-"))
    const globalDir = join(globalRoot, ".config", "opencode")
    mkdirSync(globalDir, { recursive: true })
    writeFileSync(join(globalDir, "easycode.json"), JSON.stringify({ mcp: { websearch: { enabled: false, apiKey: "global-key" } } }))

    try {
      const result = loadEasyCodeConfig(localDir, { globalConfigPath: join(globalDir, "easycode.json") })
      expect(result.mcp?.websearch).toEqual({ enabled: true })
    } finally {
      rmSync(localDir, { recursive: true, force: true })
      rmSync(globalRoot, { recursive: true, force: true })
    }
  })

  it("gives project config higher precedence than global when worktree is absent", () => {
    const projectDir = createDirectoryWithEasyCodeConfig(
      JSON.stringify({ agent: { explorer: { model: "project-model" } } }),
    )
    const globalRoot = mkdtempSync(join(tmpdir(), "easycode-global-proj-"))
    const globalDir = join(globalRoot, ".config", "opencode")
    mkdirSync(globalDir, { recursive: true })
    writeFileSync(join(globalDir, "easycode.json"), JSON.stringify({ agent: { explorer: { model: "global-model" } } }))

    try {
      const result = loadEasyCodeConfig(projectDir, { globalConfigPath: join(globalDir, "easycode.json") })
      expect(result).toEqual({
        agent: {
          explorer: {
            model: "project-model",
          },
        },
      })
    } finally {
      rmSync(projectDir, { recursive: true, force: true })
      rmSync(globalRoot, { recursive: true, force: true })
    }
  })

  it("treats invalid global config the same as an absent global file", () => {
    const localDir = createDirectoryWithEasyCodeConfig(
      JSON.stringify({ agent: { explorer: { model: "local-model" } } }),
    )
    const globalRoot = mkdtempSync(join(tmpdir(), "easycode-global-invalid-"))
    const globalDir = join(globalRoot, ".config", "opencode")
    mkdirSync(globalDir, { recursive: true })
    writeFileSync(join(globalDir, "easycode.json"), "{ broken")

    try {
      const result = loadEasyCodeConfig(localDir, { globalConfigPath: join(globalDir, "easycode.json") })
      expect(result).toEqual({
        agent: {
          explorer: {
            model: "local-model",
          },
        },
      })
    } finally {
      rmSync(localDir, { recursive: true, force: true })
      rmSync(globalRoot, { recursive: true, force: true })
    }
  })

  it("ignores invalid numeric temperature values", () => {
    const directory = createDirectoryWithEasyCodeConfig(
      JSON.stringify({
        agent: {
          explorer: {
            model: "gpt-5",
            temperature: "0.5",
          },
          reviewer: {
            temperature: Number.NaN,
          },
        },
      }),
    )

    try {
      expect(loadIsolatedEasyCodeConfig(directory)).toEqual({
        agent: {
          explorer: {
            model: "gpt-5",
          },
        },
      })
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })
})
