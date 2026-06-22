import type { AcousticContact, AcousticReport, TacticalState } from "@/types";

/**
 * AcousticMCP — expose les pistes acoustiques simulées (`state.acousticContacts`).
 * L'acoustique donne surtout un relèvement et une classification incertaine, pas
 * une position. Rien n'est inventé : sans piste corrélée, le rapport est vide.
 */
export class AcousticMCP {
  /** Toutes les pistes acoustiques connues de l'état. */
  listTracks(state: TacticalState): AcousticContact[] {
    return state.acousticContacts ?? [];
  }

  /** Rapport acoustique corrélé à un contact tactique donné. */
  getReportForContact(state: TacticalState, contactId: string): AcousticReport {
    const track = this.listTracks(state).find(
      (t) => t.linkedContactId === contactId,
    );

    if (!track) {
      return { hasTrack: false, confidence: 0 };
    }

    return {
      hasTrack: true,
      trackId: track.id,
      bearingDeg: track.bearingDeg,
      classification: track.classification,
      confidence: track.confidence,
    };
  }
}
