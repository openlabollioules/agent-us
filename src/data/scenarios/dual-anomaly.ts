import type { ScenarioDefinition } from "@/types";

/**
 * Scénario V2 — Deux anomalies simultanées.
 *
 * Deux contacts attirent l'attention en même temps : un petit contact qui suit
 * discrètement un cargo (anomalie réelle) et un écho côtier instable qui se
 * révèle une fausse alerte (leurre). Le joueur doit prioriser la vraie anomalie
 * sans se laisser détourner par le leurre.
 *
 * V2 — étape 1 : entièrement jouable avec les types V1 (le diagnostic attendu
 * réutilise `discreet_following`). Enseigne le tri / la priorisation.
 */
export const dualAnomaly: ScenarioDefinition = {
  id: "dual-anomaly",
  title: "Deux ombres à la fois",
  difficulty: "expert",
  objective:
    "Prioriser la vraie anomalie (un suiveur discret) face à un leurre (fausse alerte).",
  estimatedMinutes: 10,
  maxTurns: 8,

  briefing:
    "Situation chargée : deux contacts deviennent suspects en même temps. Mission : ne pas se disperser. Identifie l'anomalie qui compte vraiment et reconnais celle qui n'en est pas une.",

  initialContacts: [
    {
      id: "C-501",
      label: "Cargo Lumen",
      category: "cargo",
      affiliation: "neutral",
      position: { x: 240, y: 700 },
      speedKnots: 14,
      headingDeg: 55,
      radarConfidence: 0.9,
      aisConfidence: 0.85,
      optronicConfidence: 0.7,
      flags: [],
    },
    {
      id: "C-520",
      label: "Suiveur",
      category: "usv_drone",
      affiliation: "unknown",
      position: { x: 290, y: 745 },
      speedKnots: 14,
      headingDeg: 85,
      radarConfidence: 0.5,
      aisConfidence: 0,
      optronicConfidence: 0.4,
      flags: ["ais_missing"],
    },
    {
      id: "C-530",
      label: "Écho fantôme",
      category: "unknown",
      affiliation: "unknown",
      position: { x: 660, y: 280 },
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
      id: "x1-e1",
      turn: 1,
      type: "contact_detected",
      severity: "info",
      contactId: "C-501",
      title: "Cargo Lumen détecté",
      description: "Un cargo civil progresse à vitesse régulière. Comportement nominal.",
      visualCue: { focusContactId: "C-501", showTrajectory: true },
    },
    {
      id: "x1-e2",
      turn: 2,
      type: "contact_detected",
      severity: "low",
      contactId: "C-520",
      title: "Petit contact près du cargo",
      description:
        "Un petit contact apparaît à proximité du Lumen, sans AIS.",
      visualCue: { focusContactId: "C-520", showTrajectory: true },
      effects: [{ contactId: "C-520", addFlags: ["small_object_near_civilian"] }],
    },
    {
      id: "x1-e3",
      turn: 3,
      type: "contact_detected",
      severity: "low",
      contactId: "C-530",
      title: "Écho côtier instable",
      description:
        "Au même moment, un écho côtier apparaît au nord, avec une piste de qualité moyenne.",
      visualCue: { focusContactId: "C-530", showTrajectory: true },
      effects: [
        { contactId: "C-530", addFlags: ["low_radar_confidence"], radarConfidence: 0.4 },
      ],
    },
    {
      id: "x1-e4",
      turn: 4,
      type: "trajectory_anomaly",
      severity: "medium",
      contactId: "C-520",
      title: "Trajectoire parallèle au cargo",
      description:
        "C-520 ajuste son cap pour devenir parallèle au Lumen. Début de comportement de suivi.",
      visualCue: {
        focusContactId: "C-520",
        showTrajectory: true,
        showRelationLines: true,
      },
      effects: [
        {
          contactId: "C-520",
          headingDeg: 55,
          addFlags: ["trajectory_anomaly"],
          setRelationTargetId: "C-501",
        },
      ],
      worldEffects: [
        {
          kind: "set_behavior",
          profile: {
            contactId: "C-520",
            pattern: "shadowing",
            consistency: 0.6,
            note: "Cap aligné sur le cargo : début de suivi.",
          },
        },
      ],
    },
    {
      id: "x1-e5",
      turn: 5,
      type: "system",
      severity: "high",
      contactId: "C-530",
      title: "Perte de piste sur l'écho côtier",
      description:
        "Le radar perd C-530. L'écho semble inquiétant, mais une perte de piste n'est pas une preuve.",
      visualCue: { focusContactId: "C-530", showTrajectory: true },
      effects: [
        { contactId: "C-530", addFlags: ["radar_contact_lost"], radarConfidence: 0.15 },
      ],
    },
    {
      id: "x1-e6",
      turn: 6,
      type: "trajectory_anomaly",
      severity: "high",
      contactId: "C-520",
      title: "Distance constante confirmée",
      description:
        "C-520 garde une distance quasi constante avec le cargo depuis plusieurs tours : suivi discret caractérisé.",
      visualCue: {
        focusContactId: "C-520",
        showTrajectory: true,
        showRelationLines: true,
        zoomLevel: "close",
      },
      effects: [{ contactId: "C-520", addFlags: ["constant_distance_following"] }],
      worldEffects: [
        {
          kind: "set_behavior",
          profile: {
            contactId: "C-520",
            pattern: "shadowing",
            consistency: 0.85,
            note: "Distance constante maintenue : suivi discret confirmé.",
          },
        },
      ],
    },
    {
      id: "x1-e7",
      turn: 7,
      type: "contact_detected",
      severity: "medium",
      contactId: "C-530",
      title: "Écho fantôme retrouvé",
      description:
        "C-530 réapparaît à une position cohérente : c'était une fausse alerte capteur, pas une menace.",
      visualCue: { focusContactId: "C-530", showTrajectory: true },
      effects: [
        {
          contactId: "C-530",
          removeFlags: ["radar_contact_lost"],
          addFlags: ["possible_false_positive"],
          radarConfidence: 0.5,
        },
      ],
      worldEffects: [
        {
          kind: "set_behavior",
          profile: {
            contactId: "C-530",
            pattern: "transit",
            consistency: 0.8,
            note: "Position cohérente : simple écho de capteur, pas une menace.",
          },
        },
      ],
    },
    {
      id: "x1-e8",
      turn: 8,
      type: "threat_level_changed",
      severity: "high",
      contactId: "C-520",
      title: "La vraie anomalie se détache",
      description:
        "Pendant que l'écho côtier se révélait une fausse alerte, C-520 a confirmé un suivi discret du cargo. C'est lui la priorité.",
      visualCue: {
        focusContactId: "C-520",
        showTrajectory: true,
        showRelationLines: true,
        zoomLevel: "close",
      },
    },
  ],

  expectedDiagnosis: {
    contactId: "C-520",
    anomalyType: "discreet_following",
    keyEvidence: [
      "trajectoire parallèle au cargo Lumen",
      "distance quasi constante sur plusieurs tours",
      "le second écho n'était qu'une fausse alerte",
      "prioriser l'anomalie réelle plutôt que le leurre",
    ],
  },

  pedagogicalGoals: [
    "Prioriser entre plusieurs anomalies concurrentes.",
    "Ne pas se laisser détourner par un leurre (fausse alerte).",
    "Confirmer une anomalie réelle par un faisceau d'indices cohérent.",
  ],

  debriefExplanation:
    "Quand deux anomalies surgissent ensemble, le risque est de se disperser. Ici, l'écho côtier paraissait alarmant mais s'est résolu en fausse alerte, tandis que le petit contact a confirmé, indice après indice, un suivi discret du cargo. Savoir hiérarchiser — distinguer le leurre de la vraie anomalie — est aussi important que détecter.",
};
