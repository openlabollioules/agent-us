import type { ScenarioDefinition } from "@/types";

/**
 * Scénario 3 — Perte radar ambiguë.
 *
 * Le radar perd un contact côtier puis le retrouve. L'apparence est inquiétante,
 * mais la vérité est une incertitude capteur (masquage / faible qualité de
 * détection), pas une menace. Bonne décision : ne pas conclure trop vite.
 */
export const radarLoss: ScenarioDefinition = {
  id: "radar-loss",
  title: "Le fantôme du radar",
  difficulty: "intermediate",
  objective:
    "Comprendre qu'une perte radar temporaire n'est pas toujours une menace.",
  estimatedMinutes: 7,
  maxTurns: 8,

  briefing:
    "Zone côtière, météo capteur dégradée. Mission : analyser une perte de piste radar sans tirer de conclusion hâtive. Toutes les anomalies ne sont pas des menaces.",

  initialContacts: [
    {
      id: "C-020",
      label: "Petit Mousse",
      category: "fishing_vessel",
      affiliation: "neutral",
      position: { x: 400, y: 600 },
      speedKnots: 9,
      headingDeg: 120,
      radarConfidence: 0.8,
      aisConfidence: 0.7,
      optronicConfidence: 0.6,
      flags: [],
    },
    {
      id: "C-030",
      label: "Contact côtier",
      category: "unknown",
      affiliation: "unknown",
      position: { x: 600, y: 250 },
      speedKnots: 7,
      headingDeg: 160,
      radarConfidence: 0.6,
      aisConfidence: 0.2,
      optronicConfidence: 0.4,
      flags: [],
    },
  ],

  timeline: [
    {
      id: "s3-e1",
      turn: 1,
      type: "contact_detected",
      severity: "info",
      contactId: "C-020",
      title: "Bateau de pêche détecté",
      description:
        "Le Petit Mousse navigue lentement près de la côte. Comportement nominal.",
      visualCue: { focusContactId: "C-020", showTrajectory: true },
    },
    {
      id: "s3-e2",
      turn: 2,
      type: "contact_detected",
      severity: "low",
      contactId: "C-030",
      title: "Contact côtier ambigu",
      description:
        "Un contact côtier est détecté avec une qualité de piste moyenne. AIS faible.",
      visualCue: { focusContactId: "C-030", showTrajectory: true },
    },
    {
      id: "s3-e3",
      turn: 3,
      type: "radar_confidence_drop",
      severity: "medium",
      contactId: "C-030",
      title: "Qualité de piste en baisse",
      description:
        "La confiance radar sur C-030 diminue. L'environnement côtier dégrade la détection.",
      visualCue: { focusContactId: "C-030" },
      effects: [
        { contactId: "C-030", addFlags: ["low_radar_confidence"], radarConfidence: 0.4 },
      ],
    },
    {
      id: "s3-e4",
      turn: 4,
      type: "system",
      severity: "high",
      contactId: "C-030",
      title: "Perte de piste radar",
      description:
        "Le radar perd la piste de C-030. Attention : une perte radar ne signifie pas forcément une dissimulation volontaire.",
      visualCue: { focusContactId: "C-030", showTrajectory: true },
      effects: [
        { contactId: "C-030", addFlags: ["radar_contact_lost"], radarConfidence: 0.15 },
      ],
    },
    {
      id: "s3-e5",
      turn: 5,
      type: "contact_detected",
      severity: "medium",
      contactId: "C-030",
      title: "Piste C-030 retrouvée",
      description:
        "Le contact réapparaît à une position cohérente avec sa trajectoire précédente. La perte était probablement due au capteur.",
      visualCue: { focusContactId: "C-030", showTrajectory: true },
      effects: [
        {
          contactId: "C-030",
          removeFlags: ["radar_contact_lost"],
          addFlags: ["possible_false_positive"],
          radarConfidence: 0.55,
        },
      ],
    },
    {
      id: "s3-e6",
      turn: 6,
      type: "optronic_hint",
      severity: "low",
      contactId: "C-030",
      title: "Observation optronique rassurante",
      description:
        "Signature compatible avec un petit bateau côtier. Rien n'indique un comportement de menace.",
      visualCue: { focusContactId: "C-030" },
      effects: [{ contactId: "C-030", optronicConfidence: 0.62 }],
    },
    {
      id: "s3-e7",
      turn: 7,
      type: "system",
      severity: "info",
      contactId: "C-030",
      title: "L'incertitude capteur explique la perte",
      description:
        "En croisant les sources, l'hypothèse la plus probable est une incertitude capteur, pas une menace. Réduire l'incertitude plutôt que conclure.",
      visualCue: { focusContactId: "C-030" },
    },
  ],

  expectedDiagnosis: {
    contactId: "C-030",
    anomalyType: "sensor_uncertainty",
    keyEvidence: [
      "perte radar temporaire puis réapparition cohérente",
      "environnement côtier dégradant la détection",
      "observation optronique rassurante",
      "aucun indice de comportement de menace",
    ],
  },

  pedagogicalGoals: [
    "Comprendre qu'une perte radar n'est pas une preuve de menace.",
    "Réduire l'incertitude avant de conclure.",
    "Reconnaître une fausse alerte plausible.",
  ],

  debriefExplanation:
    "Une perte radar ne veut pas forcément dire qu'un contact se cache. Un capteur peut perdre une piste à cause de l'environnement ou d'une faible qualité de détection. La bonne réflexe est de croiser les sources et de réduire l'incertitude, pas de conclure trop vite à une menace.",
};
