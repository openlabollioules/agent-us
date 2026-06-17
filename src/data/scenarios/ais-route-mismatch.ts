import type { ScenarioDefinition } from "@/types";

/**
 * Scénario 2 — Route AIS incohérente.
 *
 * Un cargo civil dévie progressivement de sa route AIS déclarée vers une zone
 * surveillée. La vitesse reste stable mais la direction devient incohérente
 * avec la route annoncée.
 */
export const aisRouteMismatch: ScenarioDefinition = {
  id: "ais-route-mismatch",
  title: "La route qui ment",
  difficulty: "intermediate",
  objective:
    "Identifier qu'un navire civil suit une route différente de sa route AIS déclarée.",
  estimatedMinutes: 8,
  maxTurns: 8,

  briefing:
    "Trafic commercial dense. Un patrouilleur allié veille dans le secteur. Mission : surveiller la cohérence entre les routes déclarées (AIS) et les routes réellement observées.",

  initialContacts: [
    {
      id: "C-014",
      label: "Star Horizon",
      category: "cargo",
      affiliation: "neutral",
      position: { x: 200, y: 500 },
      speedKnots: 16,
      headingDeg: 90,
      radarConfidence: 0.88,
      aisConfidence: 0.9,
      optronicConfidence: 0.6,
      flags: [],
    },
    {
      id: "C-100",
      label: "Patrouilleur Vigie",
      category: "patrol_boat",
      affiliation: "friendly",
      position: { x: 750, y: 300 },
      speedKnots: 18,
      headingDeg: 200,
      radarConfidence: 0.95,
      aisConfidence: 0.95,
      optronicConfidence: 0.9,
      flags: [],
    },
  ],

  timeline: [
    {
      id: "s2-e1",
      turn: 1,
      type: "contact_detected",
      severity: "info",
      contactId: "C-014",
      title: "Cargo Star Horizon détecté",
      description:
        "Route AIS déclarée : transit commercial vers l'est. Comportement nominal.",
      visualCue: { focusContactId: "C-014", showTrajectory: true },
    },
    {
      id: "s2-e2",
      turn: 2,
      type: "system",
      severity: "info",
      contactId: "C-100",
      title: "Patrouilleur allié en secteur",
      description:
        "Le patrouilleur Vigie effectue une ronde. Contact ami, comportement attendu.",
      visualCue: { focusContactId: "C-100" },
    },
    {
      id: "s2-e3",
      turn: 3,
      type: "trajectory_anomaly",
      severity: "low",
      contactId: "C-014",
      title: "Léger changement de cap",
      description:
        "Le Star Horizon amorce un changement de cap progressif vers le nord-est.",
      visualCue: { focusContactId: "C-014", showTrajectory: true },
      effects: [{ contactId: "C-014", headingDeg: 70 }],
    },
    {
      id: "s2-e4",
      turn: 4,
      type: "trajectory_anomaly",
      severity: "medium",
      contactId: "C-014",
      title: "Déviation qui se confirme",
      description:
        "Le cap continue de dériver. La vitesse reste stable, mais la direction s'écarte de la route déclarée.",
      visualCue: { focusContactId: "C-014", showTrajectory: true },
      effects: [{ contactId: "C-014", headingDeg: 45 }],
    },
    {
      id: "s2-e5",
      turn: 5,
      type: "ais_mismatch",
      severity: "high",
      contactId: "C-014",
      title: "Incohérence route AIS / route observée",
      description:
        "La route observée diverge nettement de la route AIS déclarée. Cela peut venir d'une erreur, d'une panne ou d'un comportement volontairement ambigu.",
      visualCue: { focusContactId: "C-014", showTrajectory: true, zoomLevel: "close" },
      effects: [
        { contactId: "C-014", headingDeg: 30, addFlags: ["ais_route_mismatch"] },
      ],
    },
    {
      id: "s2-e6",
      turn: 6,
      type: "trajectory_anomaly",
      severity: "high",
      contactId: "C-014",
      title: "Cap vers une zone surveillée",
      description:
        "La trajectoire mène désormais vers une zone surveillée. L'écart avec l'AIS s'accentue.",
      visualCue: { focusContactId: "C-014", showTrajectory: true, highlightArea: true },
      effects: [{ contactId: "C-014", headingDeg: 20, addFlags: ["trajectory_anomaly"] }],
    },
    {
      id: "s2-e7",
      turn: 7,
      type: "threat_level_changed",
      severity: "high",
      contactId: "C-014",
      title: "Suspicion élevée",
      description:
        "Route incohérente, déviation progressive, cap vers zone surveillée : la synthèse penche vers une anomalie de route.",
      visualCue: { focusContactId: "C-014", showTrajectory: true, zoomLevel: "close" },
    },
  ],

  expectedDiagnosis: {
    contactId: "C-014",
    anomalyType: "ais_route_mismatch",
    keyEvidence: [
      "route observée divergente de l'AIS",
      "changement de cap progressif",
      "vitesse stable mais direction incohérente",
      "cap vers une zone surveillée",
    ],
  },

  pedagogicalGoals: [
    "Comprendre que l'AIS est une information déclarée, pas une vérité.",
    "Comparer route déclarée et route observée.",
    "Distinguer une erreur d'un comportement ambigu.",
  ],

  debriefExplanation:
    "L'AIS est une information déclarée par le navire. Si la route observée ne correspond pas à la route déclarée, cela peut venir d'une erreur, d'une panne ou d'un comportement volontairement ambigu. Une incohérence n'est pas une preuve, mais un signal qui justifie une surveillance accrue.",
};
