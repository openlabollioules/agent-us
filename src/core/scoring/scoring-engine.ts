import type {
  DebriefData,
  PlayerDiagnosis,
  ScenarioDefinition,
  ScoreResult,
  TacticalState,
} from "@/types";
import { AGENT_DEFINITIONS } from "@/core/agents";

/** Skills d'investigation considérées comme « utiles » pour le scoring. */
const USEFUL_SKILLS = new Set<string>([
  "compare_ais_route",
  "classify_surface_contact",
  "estimate_threat_level",
  "detect_abnormal_trajectory",
  "estimate_confidence",
  // V2 — nouveaux domaines.
  "assess_weather_impact",
  "classify_acoustic_contact",
  "check_area_proximity",
  "assess_behavior_pattern",
]);

/** Seuil de réussite : bon contact ET bon type d'anomalie (40 + 30). */
export const PASS_SCORE = 70;

/**
 * ScoringEngine — évalue le diagnostic du joueur de façon déterministe.
 * Fonctionne pour les 3 scénarios, y compris la fausse alerte (le « bon »
 * diagnostic peut être `sensor_uncertainty`, pas seulement une menace).
 */
export function scoreDiagnosis(
  diagnosis: PlayerDiagnosis,
  scenario: ScenarioDefinition,
  state: TacticalState,
): ScoreResult {
  const expected = scenario.expectedDiagnosis;
  const contactCorrect = diagnosis.contactId === expected.contactId;
  const anomalyCorrect = diagnosis.anomalyType === expected.anomalyType;

  let score = 0;
  const feedback: string[] = [];

  if (contactCorrect) {
    score += 40;
    feedback.push("Bon contact identifié.");
  } else {
    feedback.push(`Le contact clé était ${expected.contactId}.`);
  }

  if (anomalyCorrect) {
    score += 30;
    feedback.push("Bon type d'anomalie détecté.");
  } else {
    feedback.push("Le type d'anomalie attendu était différent.");
  }

  if (diagnosis.justification.trim().length > 40) {
    score += 10;
    feedback.push("Justification suffisamment développée.");
  } else {
    feedback.push("Une justification plus détaillée aurait renforcé l'analyse.");
  }

  const usefulActions = state.playerActions.filter((a) =>
    USEFUL_SKILLS.has(a.skillName ?? ""),
  );
  const actionBonus = Math.min(20, usefulActions.length * 7);
  if (actionBonus > 0) {
    score += actionBonus;
    feedback.push(`Bonnes actions d'investigation (+${actionBonus}).`);
  } else {
    feedback.push("Solliciter les agents aurait apporté des indices utiles.");
  }

  const justification = diagnosis.justification.toLowerCase();
  const missedEvidence = expected.keyEvidence.filter((ev) => {
    const head = ev.toLowerCase().split(" ")[0] ?? ev.toLowerCase();
    return !justification.includes(head);
  });

  return {
    score: Math.min(score, 100),
    passed: contactCorrect && anomalyCorrect,
    feedback,
    missedEvidence,
  };
}

/** Construit le débrief pédagogique complet à partir du score. */
export function buildDebrief(
  diagnosis: PlayerDiagnosis,
  scenario: ScenarioDefinition,
  state: TacticalState,
  score: ScoreResult,
): DebriefData {
  const expected = scenario.expectedDiagnosis;

  const usefulSkills = [
    ...new Set(
      state.playerActions
        .map((a) => a.skillName)
        .filter((s): s is string => !!s && USEFUL_SKILLS.has(s)),
    ),
  ];

  const mostUsefulAgents = [
    ...new Set(
      state.playerActions
        .map((a) => a.targetAgentId)
        .filter((id): id is string => !!id),
    ),
  ].map((id) => AGENT_DEFINITIONS[id as keyof typeof AGENT_DEFINITIONS]?.name ?? id);

  return {
    scenarioTitle: scenario.title,
    score: score.score,
    passed: score.passed,
    playerDiagnosis: diagnosis,
    expected,
    contactCorrect: diagnosis.contactId === expected.contactId,
    anomalyCorrect: diagnosis.anomalyType === expected.anomalyType,
    feedback: score.feedback,
    missedEvidence: score.missedEvidence,
    usefulSkills,
    mostUsefulAgents,
    explanation: scenario.debriefExplanation,
    pedagogicalGoals: scenario.pedagogicalGoals,
  };
}
