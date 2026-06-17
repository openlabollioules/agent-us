import type {
  ContactCategory,
  OptronicClassificationHint,
  OptronicObservation,
  TacticalState,
} from "@/types";
import { findContact } from "./util";

/**
 * Mappe une catégorie de contact vers une classification optronique plausible.
 * (Correction du plan : `category` n'est pas toujours une classificationHint
 * valide — sous-marin, drone aérien, patrouilleur n'en font pas partie.)
 */
function categoryToHint(category: ContactCategory): OptronicClassificationHint {
  switch (category) {
    case "cargo":
      return "cargo";
    case "fishing_vessel":
      return "fishing_vessel";
    case "surface_vessel":
    case "patrol_boat":
      return "surface_vessel";
    case "usv_drone":
      return "small_surface_object";
    default:
      // submarine (immergé), uav_drone (aérien), unknown : non identifiable.
      return "unknown";
  }
}

/**
 * OptronicMCP — observation visuelle/thermique simulée. La qualité d'image
 * reflète la confiance optronique du contact ; la classification reste
 * probabiliste (jamais de certitude affirmée).
 */
export class OptronicMCP {
  getObservation(state: TacticalState, contactId: string): OptronicObservation {
    const contact = findContact(state, contactId);

    if (contact.category === "usv_drone" || contact.category === "unknown") {
      return {
        contactId,
        thermalSignature: "compact_hot_spot",
        shape: "low_profile_object",
        imageQuality: contact.optronicConfidence,
        classificationHint: "small_surface_object",
      };
    }

    return {
      contactId,
      thermalSignature: "medium",
      shape: "large_hull",
      imageQuality: contact.optronicConfidence,
      classificationHint: categoryToHint(contact.category),
    };
  }
}
