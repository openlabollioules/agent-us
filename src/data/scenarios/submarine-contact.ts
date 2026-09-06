import type { ScenarioDefinition } from "@/types";

/**
 * Scénario V2 — Contact sous-marin suspect.
 *
 * Un contact furtif apparaît et disparaît : radar quasi aveugle, aucun visuel de
 * surface, pas d'AIS, réapparitions à des positions incompatibles avec un navire
 * de surface. Le faisceau d'indices évoque un contact sous-marin.
 *
 * V2 — étape 1 : jouable avec les drapeaux V1 (la dimension acoustique est
 * narrée). Les `acousticContacts` seront modélisés aux étapes suivantes.
 */
export const submarineContact: ScenarioDefinition = {
  id: "submarine-contact",
  title: "L'ombre sous la surface",
  difficulty: "expert",
  objective:
    "Reconnaître un faisceau d'indices compatible avec un contact sous-marin.",
  estimatedMinutes: 9,
  maxTurns: 8,

  briefing:
    "Zone profonde, trafic de surface clairsemé. Mission : analyser un contact furtif qui apparaît puis s'efface. Croise les capteurs : ce qui n'est ni en surface ni sur l'AIS peut être sous l'eau.",

  initialContacts: [
    {
      id: "C-401",
      label: "Brise du Large",
      category: "cargo",
      affiliation: "neutral",
      position: { x: 250, y: 480 },
      speedKnots: 15,
      headingDeg: 75,
      radarConfidence: 0.9,
      aisConfidence: 0.88,
      optronicConfidence: 0.7,
      flags: [],
    },
    {
      id: "C-440",
      visual: { model: "suffren" },
      label: "Contact furtif",
      category: "submarine",
      affiliation: "unknown",
      position: { x: 640, y: 560 },
      speedKnots: 6,
      headingDeg: 300,
      radarConfidence: 0.4,
      aisConfidence: 0,
      optronicConfidence: 0.2,
      flags: ["ais_missing"],
    },
  ],

  timeline: [
    {
      id: "u1-e1",
      turn: 1,
      type: "contact_detected",
      severity: "info",
      contactId: "C-401",
      title: "Cargo Brise du Large détecté",
      description:
        "Un cargo civil transite à vitesse régulière. Comportement nominal.",
      visualCue: { focusContactId: "C-401", showTrajectory: true },
    },
    {
      id: "u1-e2",
      turn: 2,
      type: "contact_detected",
      severity: "low",
      contactId: "C-440",
      title: "Contact intermittent",
      description:
        "Un contact furtif est détecté avec une signature radar très faible. Pas d'AIS associé.",
      visualCue: { focusContactId: "C-440", showTrajectory: true },
      effects: [
        { contactId: "C-440", addFlags: ["low_radar_confidence"], radarConfidence: 0.35 },
      ],
    },
    {
      id: "u1-e3",
      turn: 3,
      type: "system",
      severity: "high",
      contactId: "C-440",
      title: "Disparition de piste",
      description:
        "Le radar perd C-440 : la piste s'efface comme si le contact plongeait. Une disparition n'est pas une preuve, mais elle intrigue.",
      visualCue: { focusContactId: "C-440", showTrajectory: true },
      effects: [
        {
          contactId: "C-440",
          addFlags: ["radar_contact_lost", "acoustic_only"],
          radarConfidence: 0.12,
        },
      ],
      worldEffects: [
        {
          kind: "update_acoustic",
          id: "AC-1",
          patch: { confidence: 0.6, classification: "submerged", bearingDeg: 295 },
        },
      ],
    },
    {
      id: "u1-e4",
      turn: 4,
      type: "trajectory_anomaly",
      severity: "medium",
      contactId: "C-440",
      title: "Réapparition incohérente en surface",
      description:
        "C-440 réapparaît à une position difficilement compatible avec la vitesse d'un navire de surface. Comportement de plongée/réapparition.",
      visualCue: { focusContactId: "C-440", showTrajectory: true, zoomLevel: "close" },
      effects: [
        {
          contactId: "C-440",
          removeFlags: ["radar_contact_lost"],
          addFlags: ["trajectory_anomaly"],
          radarConfidence: 0.3,
        },
      ],
    },
    {
      id: "u1-e5",
      turn: 5,
      type: "optronic_hint",
      severity: "low",
      contactId: "C-440",
      title: "Rien en surface",
      description:
        "L'optronique ne voit aucune coque : tout au plus un sillage ténu. Confiance visuelle très faible (30 %).",
      visualCue: { focusContactId: "C-440" },
      effects: [
        {
          contactId: "C-440",
          addFlags: ["optronic_confirmation_needed"],
          optronicConfidence: 0.3,
        },
      ],
    },
    {
      id: "u1-e6",
      turn: 6,
      type: "radar_confidence_drop",
      severity: "medium",
      contactId: "C-440",
      title: "Piste de nouveau instable",
      description:
        "La piste radar redevient intermittente : le contact ne se laisse pas suivre comme un navire de surface.",
      visualCue: { focusContactId: "C-440" },
      effects: [{ contactId: "C-440", radarConfidence: 0.2 }],
      worldEffects: [
        { kind: "update_acoustic", id: "AC-1", patch: { confidence: 0.7 } },
      ],
    },
    {
      id: "u1-e7",
      turn: 7,
      type: "threat_level_changed",
      severity: "high",
      contactId: "C-440",
      title: "Faisceau d'indices sous-marin",
      description:
        "Disparitions et réapparitions, aucun visuel de surface, pas d'AIS, trajectoire incompatible avec un bâtiment de surface : le faisceau évoque un contact sous-marin.",
      visualCue: { focusContactId: "C-440", showTrajectory: true, zoomLevel: "close" },
      worldEffects: [
        {
          kind: "update_acoustic",
          id: "AC-1",
          patch: { confidence: 0.75, classification: "submerged" },
        },
      ],
    },
  ],

  initialAcousticContacts: [
    {
      id: "AC-1",
      label: "Piste acoustique faible",
      bearingDeg: 300,
      estimatedRangeNm: 6,
      confidence: 0.4,
      classification: "unknown",
      linkedContactId: "C-440",
    },
  ],

  expectedDiagnosis: {
    contactId: "C-440",
    anomalyType: "subsurface_contact",
    keyEvidence: [
      "disparitions et réapparitions de piste radar",
      "aucun visuel de surface à l'optronique",
      "absence d'AIS",
      "trajectoire incompatible avec un navire de surface",
    ],
  },

  pedagogicalGoals: [
    "Croiser radar, optronique et AIS pour qualifier un contact furtif.",
    "Comprendre qu'un contact sans surface ni AIS peut être sous l'eau.",
    "Exprimer l'incertitude propre à un contact sous-marin.",
  ],

  debriefExplanation:
    "Un contact sous-marin se trahit rarement par une seule donnée : c'est le croisement qui parle. Radar quasi aveugle et intermittent, aucun visuel de surface, pas d'AIS, et des réapparitions incompatibles avec un navire de surface forment un faisceau d'indices cohérent. Aucune source ne prouve à elle seule la présence d'un sous-marin — d'où l'importance d'exprimer l'incertitude.",
};
