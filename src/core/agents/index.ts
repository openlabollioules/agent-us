import type { AgentId } from "@/types";
import { BaseAgent } from "./base-agent";
import { GameMasterAgent } from "./game-master-agent";
import { RadarAgent } from "./radar-agent";
import { NavigationAgent } from "./navigation-agent";
import { OptronicAgent } from "./optronic-agent";
import { ThreatAssessmentAgent } from "./threat-assessment-agent";

export { BaseAgent } from "./base-agent";
export type { AgentReply } from "./base-agent";
export { GameMasterAgent } from "./game-master-agent";
export { RadarAgent } from "./radar-agent";
export { NavigationAgent } from "./navigation-agent";
export { OptronicAgent } from "./optronic-agent";
export { ThreatAssessmentAgent } from "./threat-assessment-agent";
export { AGENT_DEFINITIONS, AGENT_IDS } from "./definitions";
export { hermesConfig } from "./hermes.config";

/** Instances singletons des agents. */
export const gameMasterAgent = new GameMasterAgent();
export const radarAgent = new RadarAgent();
export const navigationAgent = new NavigationAgent();
export const optronicAgent = new OptronicAgent();
export const threatAssessmentAgent = new ThreatAssessmentAgent();

/** Agents analystes (hors orchestrateur), interrogeables sur un contact. */
export const ANALYST_AGENTS: BaseAgent[] = [
  radarAgent,
  navigationAgent,
  optronicAgent,
  threatAssessmentAgent,
];

/** Tous les agents par identifiant. */
export const AGENTS_BY_ID: Record<AgentId, BaseAgent> = {
  "game-master-agent": gameMasterAgent,
  "radar-agent": radarAgent,
  "navigation-agent": navigationAgent,
  "optronic-agent": optronicAgent,
  "threat-assessment-agent": threatAssessmentAgent,
};
