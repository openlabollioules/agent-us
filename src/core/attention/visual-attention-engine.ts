import type { TacticalState, VisualFocus } from "@/types";
import { HIGHLIGHT_THRESHOLD } from "@/core/simulation";

/** Seuil de suspicion à partir duquel un contact capte le focus visuel. */
export const FOCUS_SUSPICION_THRESHOLD = HIGHLIGHT_THRESHOLD;

/**
 * VisualAttentionEngine — calcule où diriger l'attention du joueur, sans
 * surcharger la carte. Logique :
 * 1) le contact le plus suspect (≥ seuil), avec ses relations ;
 * 2) sinon le contact du dernier événement, en respectant son `visualCue` ;
 * 3) sinon aucun focus.
 */
export function computeVisualFocus(
  state: TacticalState,
): VisualFocus | undefined {
  const mostSuspicious = [...state.contacts]
    .filter((c) => c.suspicionScore >= FOCUS_SUSPICION_THRESHOLD)
    .sort((a, b) => b.suspicionScore - a.suspicionScore)[0];

  if (mostSuspicious) {
    const contactIds = mostSuspicious.relationTargetId
      ? [mostSuspicious.id, mostSuspicious.relationTargetId]
      : [mostSuspicious.id];

    return {
      contactIds,
      center: mostSuspicious.position,
      zoom: 1.4,
      reason: `Contact ${mostSuspicious.id} sous surveillance`,
      showTrajectories: true,
      showRelationLines: mostSuspicious.relationTargetId != null,
    };
  }

  const latestEvent = [...state.events].reverse().find((e) => e.contactId);
  if (latestEvent?.contactId) {
    const contact = state.contacts.find((c) => c.id === latestEvent.contactId);
    if (!contact) return undefined;

    const cue = latestEvent.visualCue;
    const close = cue?.zoomLevel === "close" || latestEvent.severity === "high";

    return {
      contactIds: [contact.id],
      center: contact.position,
      zoom: close ? 1.5 : 1.2,
      reason: latestEvent.title,
      showTrajectories: cue?.showTrajectory ?? true,
      showRelationLines: cue?.showRelationLines ?? false,
    };
  }

  return undefined;
}

/** Renvoie l'état avec son `visualFocus` recalculé. */
export function applyVisualFocus(state: TacticalState): TacticalState {
  return { ...state, visualFocus: computeVisualFocus(state) };
}
