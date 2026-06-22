import type { ScenarioDefinition } from "@/types";

/**
 * Scénario V2 — Drone discret proche d'une zone sensible.
 *
 * Un micro-drone de surface (USV fictif) rôde au bord d'une zone sensible :
 * faible signature, trajectoire en boucle, distance maintenue au seuil de la
 * zone. Un patrouilleur ami est présent (et ne doit jamais être suspecté).
 *
 * V2 — étape 1 : jouable avec les drapeaux V1. La zone sensible est narrée ;
 * elle sera modélisée (`sensitiveAreas` + proximité) aux étapes suivantes.
 */
export const droneNearSensitiveArea: ScenarioDefinition = {
  id: "drone-near-sensitive-area",
  title: "Le rôdeur du seuil",
  difficulty: "expert",
  objective:
    "Identifier un petit drone qui rôde discrètement au bord d'une zone sensible.",
  estimatedMinutes: 9,
  maxTurns: 8,

  briefing:
    "Une zone sensible (port pédagogique fictif) est surveillée dans le secteur nord. Un patrouilleur ami y veille. Mission : repérer tout contact qui s'attarde anormalement au bord de la zone.",

  initialContacts: [
    {
      id: "C-301",
      label: "Veilleur côtier",
      category: "patrol_boat",
      affiliation: "friendly",
      position: { x: 700, y: 240 },
      speedKnots: 16,
      headingDeg: 210,
      radarConfidence: 0.95,
      aisConfidence: 0.95,
      optronicConfidence: 0.9,
      flags: [],
    },
    {
      id: "C-330",
      label: "Micro-contact",
      category: "usv_drone",
      affiliation: "unknown",
      position: { x: 560, y: 300 },
      speedKnots: 10,
      headingDeg: 20,
      radarConfidence: 0.55,
      aisConfidence: 0,
      optronicConfidence: 0.4,
      flags: ["ais_missing"],
    },
  ],

  timeline: [
    {
      id: "d1-e1",
      turn: 1,
      type: "system",
      severity: "info",
      contactId: "C-301",
      title: "Zone sensible sous surveillance",
      description:
        "Rappel : le seuil nord est une zone sensible. Le patrouilleur Veilleur côtier y effectue une ronde. Contact ami, comportement attendu.",
      visualCue: { focusContactId: "C-301", highlightArea: true },
    },
    {
      id: "d1-e2",
      turn: 2,
      type: "contact_detected",
      severity: "low",
      contactId: "C-330",
      title: "Petit contact au bord de la zone",
      description:
        "Un petit contact apparaît près du seuil de la zone sensible. Aucune information AIS associée.",
      visualCue: { focusContactId: "C-330", showTrajectory: true, highlightArea: true },
      effects: [
        {
          contactId: "C-330",
          addFlags: ["small_object_near_civilian", "near_sensitive_area"],
        },
      ],
    },
    {
      id: "d1-e3",
      turn: 3,
      type: "radar_confidence_drop",
      severity: "medium",
      contactId: "C-330",
      title: "Faible signature radar",
      description:
        "La piste de C-330 est ténue : faible signature, confiance radar à 40 %.",
      visualCue: { focusContactId: "C-330" },
      effects: [
        { contactId: "C-330", addFlags: ["low_radar_confidence"], radarConfidence: 0.4 },
      ],
    },
    {
      id: "d1-e4",
      turn: 4,
      type: "trajectory_anomaly",
      severity: "medium",
      contactId: "C-330",
      title: "Trajectoire en boucle",
      description:
        "C-330 ne transite pas : il tourne en rond au bord de la zone, comme s'il l'observait.",
      visualCue: { focusContactId: "C-330", showTrajectory: true, highlightArea: true },
      effects: [{ contactId: "C-330", headingDeg: 200, addFlags: ["trajectory_anomaly"] }],
    },
    {
      id: "d1-e5",
      turn: 5,
      type: "trajectory_anomaly",
      severity: "high",
      contactId: "C-330",
      title: "Distance maintenue au seuil",
      description:
        "Le contact garde une distance quasi constante au bord de la zone sensible depuis plusieurs tours. Indice de stationnement discret (loitering).",
      visualCue: {
        focusContactId: "C-330",
        showTrajectory: true,
        highlightArea: true,
        zoomLevel: "close",
      },
      effects: [{ contactId: "C-330", addFlags: ["constant_distance_following"] }],
      worldEffects: [
        {
          kind: "set_behavior",
          profile: {
            contactId: "C-330",
            pattern: "loitering",
            consistency: 0.75,
            note: "Tourne en boucle au bord de la zone plutôt que de transiter.",
          },
        },
      ],
    },
    {
      id: "d1-e6",
      turn: 6,
      type: "optronic_hint",
      severity: "medium",
      contactId: "C-330",
      title: "Petit objet de surface",
      description:
        "Signature optronique compacte et basse sur l'eau : probable petit objet de surface (confiance 55 %).",
      visualCue: { focusContactId: "C-330" },
      effects: [
        {
          contactId: "C-330",
          addFlags: ["optronic_confirmation_needed"],
          optronicConfidence: 0.55,
        },
      ],
    },
    {
      id: "d1-e7",
      turn: 7,
      type: "threat_level_changed",
      severity: "high",
      contactId: "C-330",
      title: "Suspicion élevée",
      description:
        "Plusieurs indices convergent : faible signature, trajectoire en boucle, distance maintenue au bord de la zone sensible.",
      visualCue: {
        focusContactId: "C-330",
        showTrajectory: true,
        highlightArea: true,
        zoomLevel: "close",
      },
    },
  ],

  sensitiveAreas: [
    {
      id: "AREA-N",
      label: "Seuil portuaire (zone sensible)",
      area: { center: { x: 660, y: 200 }, radiusUnits: 170 },
      description:
        "Approche d'un port pédagogique fictif. Tout stationnement prolongé au bord doit être signalé.",
    },
  ],

  expectedDiagnosis: {
    contactId: "C-330",
    anomalyType: "loitering_near_sensitive_area",
    keyEvidence: [
      "présence persistante au bord d'une zone sensible",
      "trajectoire en boucle plutôt qu'en transit",
      "distance quasi constante au seuil de la zone",
      "faible signature et absence d'AIS",
    ],
  },

  pedagogicalGoals: [
    "Distinguer un transit normal d'un stationnement (loitering) suspect.",
    "Relier une trajectoire au voisinage d'une zone sensible.",
    "Ne jamais suspecter un contact ami présent dans la zone.",
  ],

  debriefExplanation:
    "Un contact qui transite traverse la zone ; un contact qui rôde y reste, tourne en boucle ou maintient une distance constante au bord. Près d'une zone sensible, ce stationnement discret — surtout avec une faible signature et sans AIS — justifie une surveillance accrue. Le patrouilleur ami, lui, a un comportement attendu : sa présence n'est jamais un indice de menace.",
};
