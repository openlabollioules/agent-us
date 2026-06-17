import type { ContactCategory } from "./tactical";

/**
 * Données renvoyées par les MCP simulés. Centralisées dans les types pour que
 * skills et agents puissent les importer (le plan les importait depuis
 * `@/types` alors qu'elles n'étaient définies que dans les fichiers MCP).
 */

export type RadarStatus = "tracked" | "lost" | "unstable";

export type RadarObservation = {
  contactId: string;
  rangeNm: number;
  bearingDeg: number;
  speedKnots: number;
  radarConfidence: number;
  radarStatus: RadarStatus;
};

export type AISRouteStatus = "normal" | "mismatch" | "missing";

export type AISData = {
  contactId: string;
  shipName?: string;
  declaredType?: string;
  declaredRoute?: string;
  declaredRouteStatus: AISRouteStatus;
};

export type ThermalSignature = "low" | "medium" | "compact_hot_spot";
export type OptronicShape = "large_hull" | "low_profile_object" | "unknown";

export type OptronicClassificationHint =
  | "cargo"
  | "fishing_vessel"
  | "surface_vessel"
  | "usv_drone"
  | "small_surface_object"
  | "unknown";

export type OptronicObservation = {
  contactId: string;
  thermalSignature: ThermalSignature;
  shape: OptronicShape;
  imageQuality: number;
  classificationHint: OptronicClassificationHint;
};

export type McpId = "radar-mcp" | "ais-mcp" | "optronic-mcp" | "scenario-mcp";

/** Cohérence : un classificationHint peut décrire une catégorie de contact. */
export type ClassifiableCategory = Extract<
  ContactCategory,
  "cargo" | "fishing_vessel" | "surface_vessel" | "usv_drone" | "unknown"
>;
