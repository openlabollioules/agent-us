import type { AISData, TacticalState } from "@/types";
import { findContact } from "./util";

/**
 * AISMCP — source de données AIS simulée. L'AIS est une information *déclarée* :
 * elle peut être absente, normale ou incohérente avec la route observée.
 */
export class AISMCP {
  getAISData(state: TacticalState, contactId: string): AISData {
    const contact = findContact(state, contactId);

    if (contact.flags.includes("ais_missing")) {
      return { contactId, declaredRouteStatus: "missing" };
    }

    return {
      contactId,
      shipName: contact.label,
      declaredType: contact.category,
      declaredRoute: "Route commerciale déclarée (fictive)",
      declaredRouteStatus: contact.flags.includes("ais_route_mismatch")
        ? "mismatch"
        : "normal",
    };
  }
}
