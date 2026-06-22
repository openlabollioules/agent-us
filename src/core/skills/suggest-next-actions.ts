import type { SuggestedAction, TacticalState } from "@/types";

/**
 * suggest_next_actions — propose des actions human-in-the-loop pertinentes
 * selon l'état tactique courant. Les suggestions aident le débutant sans jamais
 * le forcer ; elles expliquent toujours leur intérêt. Limitées à 5.
 */
export function suggestNextActions(state: TacticalState): SuggestedAction[] {
  const suggestions: SuggestedAction[] = [];

  for (const contact of state.contacts) {
    if (contact.flags.includes("low_radar_confidence")) {
      suggestions.push({
        id: `ask-optronic-${contact.id}`,
        label: "Demander confirmation optronique",
        description:
          "Quand la confiance radar baisse, une observation visuelle peut réduire l'incertitude.",
        targetAgentId: "optronic-agent",
        skillName: "classify_surface_contact",
        priority: "high",
        difficulty: "beginner",
        promptTemplate: `OptronicAgent, peux-tu confirmer la classification du contact ${contact.id} ?`,
      });
    }

    if (contact.flags.includes("ais_route_mismatch")) {
      suggestions.push({
        id: `compare-ais-${contact.id}`,
        label: "Comparer avec l'AIS",
        description:
          "Comparer la route observée et la route déclarée aide à repérer une incohérence.",
        targetAgentId: "navigation-agent",
        skillName: "compare_ais_route",
        priority: "high",
        difficulty: "beginner",
        promptTemplate: `NavigationAgent, compare la trajectoire observée de ${contact.id} avec sa route AIS.`,
      });
    }

    if (contact.flags.includes("constant_distance_following")) {
      suggestions.push({
        id: `analyze-following-${contact.id}`,
        label: "Analyser le suivi discret",
        description:
          "Un contact qui garde une distance stable avec un autre peut indiquer un comportement de suivi.",
        targetAgentId: "navigation-agent",
        skillName: "detect_abnormal_trajectory",
        priority: "high",
        difficulty: "intermediate",
        promptTemplate: `NavigationAgent, analyse si ${contact.id} suit discrètement un autre contact.`,
      });
    }

    if (contact.suspicionScore > 0.65) {
      suggestions.push({
        id: `threat-summary-${contact.id}`,
        label: "Demander une synthèse de suspicion",
        description:
          "Quand plusieurs indices convergent, une synthèse aide à décider.",
        targetAgentId: "threat-assessment-agent",
        skillName: "estimate_threat_level",
        priority: "medium",
        difficulty: "intermediate",
        promptTemplate: `ThreatAssessmentAgent, fais une synthèse du niveau de suspicion pour ${contact.id}.`,
      });
    }

    if (contact.flags.includes("possible_false_positive")) {
      suggestions.push({
        id: `reduce-uncertainty-${contact.id}`,
        label: "Réduire l'incertitude",
        description:
          "Une anomalie peut être une fausse alerte : croiser les capteurs avant de conclure.",
        targetAgentId: "threat-assessment-agent",
        skillName: "estimate_confidence",
        priority: "medium",
        difficulty: "intermediate",
        promptTemplate: `ThreatAssessmentAgent, l'anomalie sur ${contact.id} est-elle une fausse alerte plausible ?`,
      });
    }

    // V2 — météo dégradée : relier l'anomalie capteur aux conditions.
    if (contact.flags.includes("weather_degraded")) {
      suggestions.push({
        id: `assess-weather-${contact.id}`,
        label: "Évaluer l'impact météo",
        description:
          "Par mauvais temps, une perte de piste ou une faible confiance peut s'expliquer par la météo.",
        targetAgentId: "radar-agent",
        skillName: "assess_weather_impact",
        priority: "high",
        difficulty: "beginner",
        promptTemplate: `RadarAgent, l'anomalie capteur sur ${contact.id} s'explique-t-elle par la météo ?`,
      });
    }

    // V2 — proximité d'une zone sensible : transit ou stationnement ?
    if (contact.flags.includes("near_sensitive_area")) {
      suggestions.push({
        id: `check-area-${contact.id}`,
        label: "Vérifier la proximité de la zone sensible",
        description:
          "Un contact qui s'attarde au bord d'une zone sensible justifie une surveillance accrue.",
        targetAgentId: "navigation-agent",
        skillName: "check_area_proximity",
        priority: "high",
        difficulty: "intermediate",
        promptTemplate: `NavigationAgent, ${contact.id} s'attarde-t-il au bord de la zone sensible ?`,
      });
    }

    // V2 — contact tenu uniquement à l'acoustique : possible contact sous-marin.
    if (contact.flags.includes("acoustic_only")) {
      suggestions.push({
        id: `classify-acoustic-${contact.id}`,
        label: "Analyser la piste acoustique",
        description:
          "Sans visuel de surface ni AIS, l'acoustique aide à qualifier un contact furtif.",
        targetAgentId: "radar-agent",
        skillName: "classify_acoustic_contact",
        priority: "high",
        difficulty: "expert",
        promptTemplate: `RadarAgent, que dit l'acoustique sur le contact ${contact.id} ?`,
      });
    }
  }

  // V2 — comportement ambigu (faible cohérence) : éviter de conclure trop vite.
  for (const profile of state.behaviorProfiles ?? []) {
    if (profile.consistency < 0.6) {
      suggestions.push({
        id: `assess-behavior-${profile.contactId}`,
        label: "Évaluer le comportement",
        description:
          "Un comportement ambigu n'est ni clairement normal ni clairement suspect : à interpréter avec prudence.",
        targetAgentId: "navigation-agent",
        skillName: "assess_behavior_pattern",
        priority: "medium",
        difficulty: "intermediate",
        promptTemplate: `NavigationAgent, comment interpréter le comportement de ${profile.contactId} ?`,
      });
    }
  }

  return suggestions.slice(0, 5);
}
