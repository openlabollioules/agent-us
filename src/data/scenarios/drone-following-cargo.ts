import type { ScenarioDefinition } from "@/types";

/**
 * Scénario 1 — Drone de surface suivant un cargo.
 *
 * Un petit contact (USV fictif) suit le cargo civil Blue Marlin à distance
 * quasi constante. La suspicion monte progressivement : proximité, faible
 * signature, trajectoire parallèle, distance stable.
 */
export const droneFollowingCargo: ScenarioDefinition = {
  id: "drone-following-cargo",
  title: "Le suiveur discret",
  difficulty: "beginner",
  objective:
    "Identifier qu'un petit contact suit un cargo civil à distance quasi constante.",
  estimatedMinutes: 8,
  maxTurns: 8,

  briefing:
    "Zone de surveillance active. Trafic maritime modéré. Mission : observer les comportements inhabituels et identifier une éventuelle anomalie. Les agents IA sont disponibles pour assister ton analyse.",

  initialContacts: [
    {
      id: "C-001",
      label: "Blue Marlin",
      category: "cargo",
      affiliation: "neutral",
      position: { x: 250, y: 720 },
      speedKnots: 14,
      headingDeg: 55,
      radarConfidence: 0.9,
      aisConfidence: 0.85,
      optronicConfidence: 0.7,
      flags: [],
    },
    {
      id: "C-042",
      visual: { model: "seaquest-s" },
      label: "Contact inconnu",
      category: "usv_drone",
      affiliation: "unknown",
      position: { x: 300, y: 770 },
      speedKnots: 14,
      headingDeg: 85,
      radarConfidence: 0.5,
      aisConfidence: 0,
      optronicConfidence: 0.4,
      flags: ["ais_missing"],
    },
  ],

  timeline: [
    {
      id: "s1-e1",
      turn: 1,
      type: "contact_detected",
      severity: "info",
      contactId: "C-001",
      title: "Cargo Blue Marlin détecté",
      description:
        "Un cargo civil progresse à vitesse régulière. Comportement nominal pour l'instant.",
      visualCue: { focusContactId: "C-001", showTrajectory: true },
    },
    {
      id: "s1-e2",
      turn: 2,
      type: "contact_detected",
      severity: "low",
      contactId: "C-042",
      title: "Petit contact détecté près du cargo",
      description:
        "Un petit contact apparaît à proximité du Blue Marlin. Aucune information AIS associée.",
      visualCue: { focusContactId: "C-042", showTrajectory: true },
      effects: [{ contactId: "C-042", addFlags: ["small_object_near_civilian"] }],
    },
    {
      id: "s1-e3",
      turn: 3,
      type: "radar_confidence_drop",
      severity: "medium",
      contactId: "C-042",
      title: "Confiance radar faible sur C-042",
      description:
        "La piste de C-042 est intermittente. La confiance radar chute à 42 %.",
      visualCue: { focusContactId: "C-042" },
      effects: [
        { contactId: "C-042", addFlags: ["low_radar_confidence"], radarConfidence: 0.42 },
      ],
    },
    {
      id: "s1-e4",
      turn: 4,
      type: "trajectory_anomaly",
      severity: "medium",
      contactId: "C-042",
      title: "Trajectoire parallèle observée",
      description:
        "C-042 ajuste son cap : sa trajectoire devient parallèle à celle du cargo.",
      visualCue: { focusContactId: "C-042", showTrajectory: true, showRelationLines: true },
      effects: [
        {
          contactId: "C-042",
          headingDeg: 55,
          addFlags: ["trajectory_anomaly"],
          setRelationTargetId: "C-001",
        },
      ],
    },
    {
      id: "s1-e5",
      turn: 5,
      type: "trajectory_anomaly",
      severity: "high",
      contactId: "C-042",
      title: "Distance constante confirmée",
      description:
        "La distance entre C-042 et le cargo reste quasi constante depuis plusieurs tours. Indice de suivi discret.",
      visualCue: {
        focusContactId: "C-042",
        showTrajectory: true,
        showRelationLines: true,
        zoomLevel: "close",
      },
      effects: [{ contactId: "C-042", addFlags: ["constant_distance_following"] }],
    },
    {
      id: "s1-e6",
      turn: 6,
      type: "optronic_hint",
      severity: "medium",
      contactId: "C-042",
      title: "Observation optronique partielle",
      description:
        "Signature thermique compacte et basse sur l'eau. Classification probable : petit objet de surface (confiance 58 %).",
      visualCue: { focusContactId: "C-042" },
      effects: [
        {
          contactId: "C-042",
          addFlags: ["optronic_confirmation_needed"],
          optronicConfidence: 0.58,
        },
      ],
    },
    {
      id: "s1-e7",
      turn: 7,
      type: "threat_level_changed",
      severity: "high",
      contactId: "C-042",
      title: "Suspicion élevée",
      description:
        "Plusieurs indices convergent : faible signature, trajectoire parallèle, distance constante.",
      visualCue: {
        focusContactId: "C-042",
        showTrajectory: true,
        showRelationLines: true,
        zoomLevel: "close",
      },
    },
  ],

  expectedDiagnosis: {
    contactId: "C-042",
    anomalyType: "discreet_following",
    keyEvidence: [
      "trajectoire parallèle au cargo",
      "distance quasi constante",
      "faible signature radar",
      "absence d'AIS",
    ],
  },

  pedagogicalGoals: [
    "Comprendre qu'une distance constante peut indiquer un suivi.",
    "Croiser plusieurs sources avant de conclure.",
    "Exprimer l'incertitude d'un capteur.",
  ],

  debriefExplanation:
    "Un contact qui garde une distance presque constante avec un navire civil peut indiquer un comportement de suivi discret. Ce n'est pas une preuve, mais un faisceau d'indices : il faut croiser radar, AIS et optronique avant de conclure.",
};
