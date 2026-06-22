import type { ScenarioDefinition } from "@/types";

/**
 * Scénario V2 — Faux positif météo.
 *
 * Une météo capteur dégradée (grain orageux) fait apparaître un écho qui semble
 * inquiétant : confiance radar qui chute, piste perdue puis retrouvée. La vérité
 * est une fausse alerte d'origine météo, pas une menace. Bon réflexe : relier
 * l'anomalie aux conditions et ne pas conclure trop vite.
 *
 * V2 — étape 1 : jouable avec les drapeaux/événements V1. La météo n'est encore
 * que narrée ; elle sera modélisée (état `weather`) aux étapes suivantes.
 */
export const weatherFalsePositive: ScenarioDefinition = {
  id: "weather-false-positive",
  title: "Le mirage de la tempête",
  difficulty: "intermediate",
  objective:
    "Comprendre qu'un écho instable par mauvais temps peut être une fausse alerte météo.",
  estimatedMinutes: 7,
  maxTurns: 8,

  briefing:
    "Grain orageux sur la zone : la qualité des capteurs est dégradée. Mission : analyser un écho instable sans tirer de conclusion hâtive. Toutes les anomalies ne sont pas des menaces — la météo aussi crée des fantômes.",

  initialContacts: [
    {
      id: "C-201",
      label: "Sea Breeze",
      category: "fishing_vessel",
      affiliation: "neutral",
      position: { x: 350, y: 640 },
      speedKnots: 8,
      headingDeg: 110,
      radarConfidence: 0.82,
      aisConfidence: 0.7,
      optronicConfidence: 0.6,
      flags: [],
    },
    {
      id: "C-210",
      label: "Écho instable",
      category: "unknown",
      affiliation: "unknown",
      position: { x: 620, y: 300 },
      speedKnots: 6,
      headingDeg: 150,
      radarConfidence: 0.6,
      aisConfidence: 0.15,
      optronicConfidence: 0.35,
      flags: [],
    },
  ],

  timeline: [
    {
      id: "w1-e1",
      turn: 1,
      type: "contact_detected",
      severity: "info",
      contactId: "C-201",
      title: "Bateau de pêche détecté",
      description:
        "Le Sea Breeze navigue lentement. Comportement nominal malgré la météo.",
      visualCue: { focusContactId: "C-201", showTrajectory: true },
    },
    {
      id: "w1-e2",
      turn: 2,
      type: "contact_detected",
      severity: "low",
      contactId: "C-210",
      title: "Écho ambigu sous le grain",
      description:
        "Un écho apparaît dans la zone de grain. Qualité de piste moyenne, AIS faible.",
      visualCue: { focusContactId: "C-210", showTrajectory: true },
    },
    {
      id: "w1-e3",
      turn: 3,
      type: "radar_confidence_drop",
      severity: "medium",
      contactId: "C-210",
      title: "Confiance radar en chute",
      description:
        "Le grain orageux dégrade la détection : la confiance radar sur C-210 tombe à 40 %.",
      visualCue: { focusContactId: "C-210" },
      effects: [
        {
          contactId: "C-210",
          addFlags: ["low_radar_confidence", "weather_degraded"],
          radarConfidence: 0.4,
        },
      ],
    },
    {
      id: "w1-e4",
      turn: 4,
      type: "system",
      severity: "high",
      contactId: "C-210",
      title: "Perte de piste sous l'averse",
      description:
        "Le radar perd C-210 au passage d'une cellule orageuse. Une perte de piste par mauvais temps n'est pas une dissimulation volontaire.",
      visualCue: { focusContactId: "C-210", showTrajectory: true },
      effects: [
        { contactId: "C-210", addFlags: ["radar_contact_lost"], radarConfidence: 0.15 },
      ],
    },
    {
      id: "w1-e5",
      turn: 5,
      type: "contact_detected",
      severity: "medium",
      contactId: "C-210",
      title: "Piste C-210 retrouvée",
      description:
        "Le grain s'éloigne : C-210 réapparaît à une position cohérente avec sa route. La perte venait bien du capteur.",
      visualCue: { focusContactId: "C-210", showTrajectory: true },
      effects: [
        {
          contactId: "C-210",
          removeFlags: ["radar_contact_lost"],
          addFlags: ["possible_false_positive"],
          radarConfidence: 0.55,
        },
      ],
      worldEffects: [
        {
          kind: "set_weather",
          weather: {
            condition: "rain",
            sensorDegradation: 0.3,
            description: "Le grain s'éloigne : la détection s'améliore.",
          },
        },
      ],
    },
    {
      id: "w1-e6",
      turn: 6,
      type: "optronic_hint",
      severity: "low",
      contactId: "C-210",
      title: "Observation optronique rassurante",
      description:
        "Entre deux averses, l'optronique ne voit qu'un petit objet de surface banal. Rien d'anormal.",
      visualCue: { focusContactId: "C-210" },
      effects: [{ contactId: "C-210", optronicConfidence: 0.6 }],
    },
    {
      id: "w1-e7",
      turn: 7,
      type: "system",
      severity: "info",
      contactId: "C-210",
      title: "La météo explique l'écho",
      description:
        "En croisant les sources, l'hypothèse la plus probable est une fausse alerte d'origine météo. Réduire l'incertitude plutôt que conclure.",
      visualCue: { focusContactId: "C-210" },
      effects: [{ contactId: "C-210", removeFlags: ["weather_degraded"] }],
      worldEffects: [
        {
          kind: "set_weather",
          weather: {
            condition: "clear",
            sensorDegradation: 0.05,
            description: "Météo dégagée : capteurs nominaux.",
          },
        },
      ],
    },
  ],

  initialWeather: {
    condition: "storm",
    sensorDegradation: 0.6,
    description:
      "Grain orageux actif sur la zone : confiance radar et qualité optronique dégradées.",
  },

  expectedDiagnosis: {
    contactId: "C-210",
    anomalyType: "false_positive",
    keyEvidence: [
      "perte radar pendant un grain orageux",
      "réapparition cohérente avec la route",
      "observation optronique banale",
      "confiance qui remonte une fois la météo passée",
    ],
  },

  pedagogicalGoals: [
    "Relier une anomalie capteur aux conditions météo.",
    "Distinguer une fausse alerte d'une menace.",
    "Croiser les sources avant de conclure.",
  ],

  debriefExplanation:
    "Une météo dégradée (grain, averse, mer formée) peut faire chuter la confiance radar et faire perdre une piste. Si le contact réapparaît de façon cohérente et que les autres capteurs sont rassurants, l'explication la plus simple est une fausse alerte météo. Une anomalie n'est pas une preuve : il faut la relier à son contexte.",
};
