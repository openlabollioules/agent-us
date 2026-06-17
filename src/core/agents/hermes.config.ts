/**
 * Configuration conceptuelle de l'orchestration multi-agents d'Agent Us.
 * Décrit le profil de l'application, le LLM, l'orchestrateur, les agents, les
 * MCP et les contraintes de sûreté (univers fictif et pédagogique).
 */
export const hermesConfig = {
  application: {
    name: "Agent Us",
    mode: "educational-serious-game",
    safetyProfile: "fictional-naval-training",
  },

  llm: {
    provider: process.env.LLM_PROVIDER ?? "mock",
    model: process.env.VLLM_MODEL ?? "mock-model",
    baseUrl: process.env.VLLM_BASE_URL,
  },

  orchestrator: {
    id: "game-master-agent",
    strategy: "turn-based",
    maxTurns: 8,
    humanInTheLoop: true,
    sharedState: "tactical-state",
  },

  agents: [
    {
      id: "radar-agent",
      name: "RadarAgent",
      role: "Simulated radar track analyst",
      skills: ["detect_contact", "track_contact", "estimate_confidence"],
      mcps: ["radar-mcp"],
    },
    {
      id: "navigation-agent",
      name: "NavigationAgent",
      role: "Trajectory and AIS consistency analyst",
      skills: ["track_contact", "compare_ais_route", "detect_abnormal_trajectory"],
      mcps: ["ais-mcp"],
    },
    {
      id: "optronic-agent",
      name: "OptronicAgent",
      role: "Simulated visual and thermal classification analyst",
      skills: ["classify_surface_contact", "estimate_confidence"],
      mcps: ["optronic-mcp"],
    },
    {
      id: "threat-assessment-agent",
      name: "ThreatAssessmentAgent",
      role: "Pedagogical evidence fusion analyst",
      skills: [
        "estimate_threat_level",
        "generate_pedagogical_explanation",
        "detect_abnormal_trajectory",
      ],
      mcps: ["radar-mcp", "ais-mcp", "optronic-mcp"],
    },
  ],

  mcps: [
    { id: "radar-mcp", type: "simulated", endpoint: "local://RadarMCP" },
    { id: "ais-mcp", type: "simulated", endpoint: "local://AISMCP" },
    { id: "optronic-mcp", type: "simulated", endpoint: "local://OptronicMCP" },
    { id: "scenario-mcp", type: "simulated", endpoint: "local://ScenarioMCP" },
  ],

  constraints: {
    noRealMilitaryData: true,
    noWeaponRecommendation: true,
    noRulesOfEngagement: true,
    agentsCannotInventTacticalFacts: true,
    explainUncertainty: true,
  },
} as const;
