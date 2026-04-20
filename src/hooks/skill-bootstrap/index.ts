import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Hooks } from "@opencode-ai/plugin";

export const SKILL_BOOTSTRAP_MARKER = "<SESSION_BOOTSTRAP_MANDATORY>";
const SKILL_BOOTSTRAP_ID_SUFFIX = "-easycode-skill-bootstrap";

type SkillBootstrapTransform = NonNullable<
  Hooks["experimental.chat.messages.transform"]
>;
type HookOutput = Parameters<SkillBootstrapTransform>[1];
type HookMessage = HookOutput["messages"][number];
type HookPart = HookMessage["parts"][number];
type TextHookPart = Extract<HookPart, { type: "text" }>;

const defaultModuleDir = dirname(fileURLToPath(import.meta.url));

export type SkillBootstrapOptions = {
  enabled?: boolean;
  moduleDir?: string;
};

function isTextPart(part: HookPart): part is TextHookPart {
  return part.type === "text" && typeof part.text === "string";
}

function isBootstrapTextPart(part: HookPart): boolean {
  return (
    isTextPart(part) &&
    part.synthetic === true &&
    part.id.endsWith(SKILL_BOOTSTRAP_ID_SUFFIX) &&
    part.text.includes(SKILL_BOOTSTRAP_MARKER)
  );
}

function resolveSkillBootstrapMarkdownPath(
  moduleDir: string,
): string | undefined {
  const candidatePaths = [
    resolve(join(moduleDir, "skill-bootstrap.md")),
    resolve(join(moduleDir, "hooks", "skill-bootstrap", "skill-bootstrap.md")),
    resolve(
      join(
        moduleDir,
        "..",
        "src",
        "hooks",
        "skill-bootstrap",
        "skill-bootstrap.md",
      ),
    ),
    resolve(
      join(
        moduleDir,
        "..",
        "..",
        "src",
        "hooks",
        "skill-bootstrap",
        "skill-bootstrap.md",
      ),
    ),
  ];

  for (const candidatePath of candidatePaths) {
    if (!existsSync(candidatePath)) {
      continue;
    }

    if (statSync(candidatePath).isFile()) {
      return candidatePath;
    }
  }

  return undefined;
}

function loadSkillBootstrapMarkdown(moduleDir: string): string | undefined {
  const markdownPath = resolveSkillBootstrapMarkdownPath(moduleDir);

  if (!markdownPath) {
    return undefined;
  }

  return readFileSync(markdownPath, "utf8");
}

export function createSkillBootstrapTransform(
  options: SkillBootstrapOptions = {},
): SkillBootstrapTransform {
  const enabled = options.enabled ?? true;
  const bootstrapText = enabled
    ? loadSkillBootstrapMarkdown(options.moduleDir ?? defaultModuleDir)
    : undefined;

  return async (_input, output) => {
    if (!bootstrapText) {
      return;
    }

    const firstUserMessage = output.messages.find(
      (message) => message.info.role === "user",
    );

    if (!firstUserMessage || firstUserMessage.parts.some(isBootstrapTextPart)) {
      return;
    }

    const bootstrapPart: TextHookPart = {
      id: `${firstUserMessage.info.id}${SKILL_BOOTSTRAP_ID_SUFFIX}`,
      sessionID: firstUserMessage.info.sessionID,
      messageID: firstUserMessage.info.id,
      type: "text",
      text: bootstrapText,
      synthetic: true,
    };

    firstUserMessage.parts.unshift(bootstrapPart);
  };
}
