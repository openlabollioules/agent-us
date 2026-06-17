import type { McpId } from "./mcp";
import type { SkillName } from "./skills";

export type AgentId =
  | "game-master-agent"
  | "radar-agent"
  | "navigation-agent"
  | "optronic-agent"
  | "threat-assessment-agent";

export type AgentDefinition = {
  id: AgentId;
  name: string;
  role: string;
  /** Style de discours pédagogique de l'agent. */
  style: string;
  skills: SkillName[];
  mcps: McpId[];
};
