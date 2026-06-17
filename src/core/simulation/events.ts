import type { ScriptedEvent, TacticalEvent } from "@/types";

/** Extrait la partie publique (sans `effects`) d'un événement scénarisé. */
export function toPublicEvent(event: ScriptedEvent): TacticalEvent {
  return {
    id: event.id,
    turn: event.turn,
    type: event.type,
    severity: event.severity,
    contactId: event.contactId,
    title: event.title,
    description: event.description,
    visualCue: event.visualCue,
  };
}
