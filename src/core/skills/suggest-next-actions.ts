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
  }

  return suggestions.slice(0, 5);
}
