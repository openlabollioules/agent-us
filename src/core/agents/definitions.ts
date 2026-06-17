import type { AgentDefinition, AgentId } from "@/types";

/** Définitions runtime des agents (miroir des fichiers `agents/*.md`). */
export const AGENT_DEFINITIONS: Record<AgentId, AgentDefinition> = {
  "game-master-agent": {
    id: "game-master-agent",
    name: "GameMasterAgent",
    role: "Orchestrateur de la simulation : présente la mission et raconte la situation.",
    style: "Narrateur tactique calme, clair et ludique.",
    skills: [],
    mcps: [],
  },
  "radar-agent": {
    id: "radar-agent",
    name: "RadarAgent",
    role: "Analyste des pistes radar simulées.",
    style: "Précis mais compréhensible par un lycéen.",
    skills: ["detect_contact", "track_contact", "estimate_confidence"],
    mcps: ["radar-mcp"],
  },
  "navigation-agent": {
    id: "navigation-agent",
    name: "NavigationAgent",
    role: "Analyste des trajectoires et de la cohérence AIS.",
    style: "Analytique, clair, pédagogique.",
    skills: ["track_contact", "compare_ais_route", "detect_abnormal_trajectory"],
    mcps: ["ais-mcp"],
  },
  "optronic-agent": {
    id: "optronic-agent",
    name: "OptronicAgent",
    role: "Analyste des observations visuelles et thermiques simulées.",
    style: "Descriptif et prudent.",
    skills: ["classify_surface_contact", "estimate_confidence"],
    mcps: ["optronic-mcp"],
  },
  "threat-assessment-agent": {
    id: "threat-assessment-agent",
    name: "ThreatAssessmentAgent",
    role: "Fusion pédagogique des observations et estimation de la suspicion.",
    style: "Synthétique, calme, pédagogique.",
    skills: [
      "estimate_threat_level",
      "generate_pedagogical_explanation",
      "detect_abnormal_trajectory",
    ],
    mcps: ["radar-mcp", "ais-mcp", "optronic-mcp"],
  },
};

export const AGENT_IDS = Object.keys(AGENT_DEFINITIONS) as AgentId[];
