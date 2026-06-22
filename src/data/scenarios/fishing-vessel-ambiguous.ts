import type { ScenarioDefinition } from "@/types";

/**
 * Scénario V2 — Navire de pêche au comportement ambigu.
 *
 * Un chalutier alterne caps erratiques, AIS intermittent et vitesse irrégulière.
 * Ce comportement est typique de la pêche… mais reste ambigu : ni clairement
 * normal, ni clairement suspect. La bonne réponse est de reconnaître l'ambiguïté
 * sans sur-interpréter.
 *
 * V2 — étape 1 : jouable avec les drapeaux V1. Le profil de comportement
 * (`behaviorProfiles`) sera modélisé aux étapes suivantes.
 */
export const fishingVesselAmbiguous: ScenarioDefinition = {
  id: "fishing-vessel-ambiguous",
  title: "Le pêcheur imprévisible",
  difficulty: "intermediate",
  objective:
    "Reconnaître un comportement ambigu (pêche probable) sans le surclasser en menace.",
  estimatedMinutes: 8,
  maxTurns: 8,

  briefing:
    "Zone de pêche fréquentée. Mission : surveiller un chalutier au comportement irrégulier. Attention : la pêche produit naturellement des trajectoires déroutantes — tout n'est pas suspect.",

  initialContacts: [
    {
      id: "C-220",
      label: "Marée Haute",
      category: "fishing_vessel",
      affiliation: "neutral",
      position: { x: 300, y: 420 },
      speedKnots: 7,
      headingDeg: 80,
      radarConfidence: 0.78,
      aisConfidence: 0.6,
      optronicConfidence: 0.55,
      flags: [],
    },
    {
      id: "C-230",
      label: "Cap Sérénité",
      category: "cargo",
      affiliation: "neutral",
      position: { x: 180, y: 700 },
      speedKnots: 15,
      headingDeg: 60,
      radarConfidence: 0.9,
      aisConfidence: 0.9,
      optronicConfidence: 0.7,
      flags: [],
    },
  ],

  timeline: [
    {
      id: "f1-e1",
      turn: 1,
      type: "contact_detected",
      severity: "info",
      contactId: "C-220",
      title: "Chalutier Marée Haute détecté",
      description:
        "Un chalutier évolue lentement dans la zone de pêche. Comportement nominal pour l'instant.",
      visualCue: { focusContactId: "C-220", showTrajectory: true },
    },
    {
      id: "f1-e2",
      turn: 2,
      type: "contact_detected",
      severity: "info",
      contactId: "C-230",
      title: "Cargo de transit détecté",
      description:
        "Le Cap Sérénité traverse la zone à vitesse régulière. Trafic commercial banal.",
      visualCue: { focusContactId: "C-230" },
    },
    {
      id: "f1-e3",
      turn: 3,
      type: "trajectory_anomaly",
      severity: "low",
      contactId: "C-220",
      title: "Cap erratique",
      description:
        "Le Marée Haute change de cap sans logique apparente : virages successifs, vitesse irrégulière.",
      visualCue: { focusContactId: "C-220", showTrajectory: true },
      effects: [{ contactId: "C-220", headingDeg: 150, addFlags: ["trajectory_anomaly"] }],
      worldEffects: [
        {
          kind: "set_behavior",
          profile: {
            contactId: "C-220",
            pattern: "erratic",
            consistency: 0.4,
            note: "Cap erratique : classement encore incertain.",
          },
        },
      ],
    },
    {
      id: "f1-e4",
      turn: 4,
      type: "ais_mismatch",
      severity: "medium",
      contactId: "C-220",
      title: "AIS intermittent",
      description:
        "L'AIS du chalutier s'éteint puis se rallume. Fréquent chez les pêcheurs, mais cela complique le suivi.",
      visualCue: { focusContactId: "C-220" },
      effects: [{ contactId: "C-220", addFlags: ["ais_missing"] }],
    },
    {
      id: "f1-e5",
      turn: 5,
      type: "radar_confidence_drop",
      severity: "low",
      contactId: "C-220",
      title: "Piste un peu instable",
      description:
        "La piste de C-220 devient moins nette pendant ses manœuvres lentes. Confiance radar à 45 %.",
      visualCue: { focusContactId: "C-220" },
      effects: [
        { contactId: "C-220", addFlags: ["low_radar_confidence"], radarConfidence: 0.45 },
      ],
    },
    {
      id: "f1-e6",
      turn: 6,
      type: "optronic_hint",
      severity: "low",
      contactId: "C-220",
      title: "Filets visibles",
      description:
        "L'optronique distingue un gréement de pêche et des filets. Signature compatible avec un chalutier (confiance 60 %).",
      visualCue: { focusContactId: "C-220" },
      effects: [
        {
          contactId: "C-220",
          addFlags: ["optronic_confirmation_needed"],
          optronicConfidence: 0.6,
        },
      ],
      worldEffects: [
        {
          kind: "set_behavior",
          profile: {
            contactId: "C-220",
            pattern: "fishing",
            consistency: 0.55,
            note: "Gréement de pêche visible : activité de pêche probable, sans certitude.",
          },
        },
      ],
    },
    {
      id: "f1-e7",
      turn: 7,
      type: "threat_level_changed",
      severity: "medium",
      contactId: "C-220",
      title: "Comportement ambigu",
      description:
        "Les indices ne tranchent pas : trajectoire erratique et AIS intermittent évoquent la pêche, mais rien ne le prouve. Situation ambiguë, à surveiller sans conclure.",
      visualCue: { focusContactId: "C-220", showTrajectory: true },
    },
  ],

  expectedDiagnosis: {
    contactId: "C-220",
    anomalyType: "ambiguous_behavior",
    keyEvidence: [
      "trajectoire erratique typique de la pêche",
      "AIS intermittent fréquent chez les chalutiers",
      "signature optronique compatible avec un pêcheur",
      "indices non concluants : ni normal ni suspect",
    ],
  },

  pedagogicalGoals: [
    "Reconnaître qu'un comportement ambigu n'est pas une preuve.",
    "Rattacher une trajectoire irrégulière à une activité plausible (la pêche).",
    "Maintenir une surveillance sans sur-interpréter.",
  ],

  debriefExplanation:
    "La pêche produit des trajectoires déroutantes : virages, arrêts, AIS éteint pour protéger des zones de pêche. Ces signes, pris isolément, ressemblent à de l'évitement. Mais croisés avec une signature optronique de chalutier, l'hypothèse la plus probable reste l'activité de pêche. Le bon réflexe est de classer la situation comme ambiguë et de continuer à surveiller, pas de conclure à une menace.",
};
