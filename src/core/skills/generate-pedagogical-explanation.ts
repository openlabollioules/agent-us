import type { ContactTrack } from "@/types";

/**
 * generate_pedagogical_explanation — explique en mots simples un concept de
 * surveillance maritime, relié à ce que le joueur a observé.
 */
export function generatePedagogicalExplanation(contact: ContactTrack): string {
  if (contact.flags.includes("constant_distance_following")) {
    return "Un contact qui garde une distance presque constante avec un navire civil peut indiquer un comportement de suivi discret. Ce n'est pas une preuve, mais un indice à vérifier.";
  }

  if (contact.flags.includes("ais_route_mismatch")) {
    return "L'AIS est une information déclarée par le navire. Si la route observée ne correspond pas à la route déclarée, cela peut venir d'une erreur, d'une panne ou d'un comportement volontairement ambigu.";
  }

  if (
    contact.flags.includes("possible_false_positive") ||
    contact.flags.includes("radar_contact_lost")
  ) {
    return "Une perte radar ne veut pas forcément dire qu'un contact se cache. Un capteur peut perdre une piste à cause de l'environnement ou d'une faible qualité de détection.";
  }

  return "L'analyse reste incertaine. Il est utile de croiser plusieurs sources avant de conclure.";
}
