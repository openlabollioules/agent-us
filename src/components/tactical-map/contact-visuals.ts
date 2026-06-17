import type { ContactCategory, ContactTrack } from "@/types";

export type SuspicionTier = "none" | "watch" | "suspect" | "high";

/** Niveau visuel de suspicion d'un contact (un allié n'est jamais suspect). */
export function suspicionTier(contact: ContactTrack): SuspicionTier {
  if (contact.affiliation === "friendly") return "none";
  if (contact.suspicionScore >= 0.65) return "high";
  if (contact.suspicionScore >= 0.4) return "suspect";
  if (contact.isUnderWatch) return "watch";
  return "none";
}

/** Couleur du halo selon le niveau de suspicion. */
export const HALO_COLOR: Record<SuspicionTier, string> = {
  none: "transparent",
  watch: "#38bdf8", // bleu — sous surveillance
  suspect: "#fb923c", // orange — suspect
  high: "#ef4444", // rouge — fortement suspect
};

/** Couleur de remplissage de l'icône selon la catégorie. */
export const CATEGORY_FILL: Record<ContactCategory, string> = {
  cargo: "#64748b",
  fishing_vessel: "#0ea5e9",
  patrol_boat: "#4ade80",
  usv_drone: "#fb923c",
  uav_drone: "#a78bfa",
  submarine: "#334155",
  surface_vessel: "#94a3b8",
  unknown: "#eab308",
};

/** Couleur de contour selon l'affiliation. */
export const AFFILIATION_STROKE: Record<ContactTrack["affiliation"], string> = {
  friendly: "#4ade80",
  neutral: "#cbd5e1",
  unknown: "#fbbf24",
};

/** Libellé lisible d'une catégorie (pour tooltips / panneaux). */
export const CATEGORY_LABEL: Record<ContactCategory, string> = {
  cargo: "Cargo",
  fishing_vessel: "Bateau de pêche",
  patrol_boat: "Patrouilleur",
  usv_drone: "Drone de surface (USV)",
  uav_drone: "Drone aérien (UAV)",
  submarine: "Sous-marin",
  surface_vessel: "Bâtiment de surface",
  unknown: "Contact inconnu",
};
