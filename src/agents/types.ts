export type AgentMode = "subagent" | "primary";

export type AgentPermissionValue = "allow" | "ask" | "deny";

export type AgentPermissionRule =
  | AgentPermissionValue
  | Record<string, AgentPermissionValue>;

export type AgentPermission = Record<string, AgentPermissionRule>;

export type AgentDefaults = {
  temperature?: number;
  permission?: AgentPermission;
  color?: string;
};

export type AgentDefinition = {
  name: string;
  description: string;
  prompt: string;
  mode: AgentMode;
  defaults?: AgentDefaults;
};

export type AgentModule = {
  default: AgentDefinition;
};
