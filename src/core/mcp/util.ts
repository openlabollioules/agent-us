import type { ContactTrack, TacticalState } from "@/types";

/** Récupère un contact dans l'état, ou throw si l'identifiant est inconnu. */
export function findContact(
  state: TacticalState,
  contactId: string,
): ContactTrack {
  const contact = state.contacts.find((c) => c.id === contactId);
  if (!contact) {
    throw new Error(`Contact inconnu : ${contactId}`);
  }
  return contact;
}
