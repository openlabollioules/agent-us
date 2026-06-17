import type { SkillName } from "@/types";

export { detectContact } from "./detect-contact";
export { trackContact } from "./track-contact";
export { compareAisRoute } from "./compare-ais-route";
export { detectAbnormalTrajectory } from "./detect-abnormal-trajectory";
export { classifySurfaceContact } from "./classify-surface-contact";
export { estimateConfidence } from "./estimate-confidence";
export { estimateThreatLevel, suspicionLevel } from "./estimate-threat-level";
export { suggestNextActions } from "./suggest-next-actions";
export { generatePedagogicalExplanation } from "./generate-pedagogical-explanation";

/** Métadonnées des skills (pour l'UI et la doc). */
export const SKILL_METADATA: Record<SkillName, { label: string; description: string }> = {
  detect_contact: {
    label: "Détecter un contact",
    description: "Décrit un contact radar et signale l'incertitude.",
  },
  track_contact: {
    label: "Suivre un contact",
    description: "Analyse l'évolution d'une trajectoire sur plusieurs tours.",
  },
  compare_ais_route: {
    label: "Comparer la route AIS",
    description: "Compare la route observée avec la route AIS déclarée.",
  },
  detect_abnormal_trajectory: {
    label: "Détecter une trajectoire anormale",
    description: "Repère un comportement de mouvement inhabituel.",
  },
  classify_surface_contact: {
    label: "Classer un contact de surface",
    description: "Classe un objet à partir d'une observation optronique.",
  },
  estimate_confidence: {
    label: "Estimer la confiance",
    description: "Combine plusieurs niveaux de confiance capteur.",
  },
  estimate_threat_level: {
    label: "Estimer le niveau de suspicion",
    description: "Synthétise un niveau de suspicion à partir des indices.",
  },
  suggest_next_actions: {
    label: "Suggérer des actions",
    description: "Propose des actions pertinentes au joueur.",
  },
  generate_pedagogical_explanation: {
    label: "Expliquer pédagogiquement",
    description: "Explique un concept en mots simples.",
  },
};
