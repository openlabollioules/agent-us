import type {
  ActionDifficulty,
  ActionPriority,
  SuggestedAction,
  TacticalState,
} from "@/types";
import { suggestNextActions } from "@/core/skills";

/** Limite d'actions affichées pour ne pas surcharger le joueur débutant. */
export const MAX_SUGGESTIONS = 5;

const PRIORITY_RANK: Record<ActionPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const DIFFICULTY_RANK: Record<ActionDifficulty, number> = {
  beginner: 0,
  intermediate: 1,
  expert: 2,
};

/** Supprime les doublons d'actions (par identifiant), en gardant l'ordre. */
function dedupeById(actions: SuggestedAction[]): SuggestedAction[] {
  const seen = new Set<string>();
  const result: SuggestedAction[] = [];
  for (const action of actions) {
    if (!seen.has(action.id)) {
      seen.add(action.id);
      result.push(action);
    }
  }
  return result;
}

/**
 * SuggestionEngine — calcule les actions suggérées pour l'état courant :
 * génération (skill) → déduplication → tri (priorité puis difficulté) → top 5.
 * Les suggestions changent avec la situation et n'imposent jamais une action.
 */
export function computeSuggestions(state: TacticalState): SuggestedAction[] {
  const generated = dedupeById(suggestNextActions(state));

  return [...generated]
    .sort(
      (a, b) =>
        PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
        DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty],
    )
    .slice(0, MAX_SUGGESTIONS);
}

/** Renvoie l'état avec ses `suggestedActions` recalculées. */
export function applySuggestions(state: TacticalState): TacticalState {
  return { ...state, suggestedActions: computeSuggestions(state) };
}
