import type {
  AcousticClassification,
  ContactCategory,
  WeatherCondition,
} from "./tactical";

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

export type McpId =
  | "radar-mcp"
  | "ais-mcp"
  | "optronic-mcp"
  | "scenario-mcp"
  // V2 — nouveaux domaines de capteurs/contexte.
  | "weather-mcp"
  | "acoustic-mcp"
  | "geo-mcp";

/** Rapport météo simulé : conditions + impact capteur (WeatherMCP). */
export type WeatherReport = {
  condition: WeatherCondition;
  /** Dégradation capteur induite (0..1). */
  sensorDegradation: number;
  degradesRadar: boolean;
  degradesOptronic: boolean;
  summary: string;
};

/** Rapport acoustique simulé pour un contact (AcousticMCP). */
export type AcousticReport = {
  hasTrack: boolean;
  trackId?: string;
  bearingDeg?: number;
  classification?: AcousticClassification;
  /** Confiance de la détection acoustique (0..1 ; 0 si aucune piste). */
  confidence: number;
};

/** Proximité d'un contact vis-à-vis des zones sensibles (GeoMCP). */
export type AreaProximityReport = {
  contactId: string;
  nearestAreaId?: string;
  nearestAreaLabel?: string;
  /** Distance au bord de la zone la plus proche (unités carte ; <0 = à l'intérieur). */
  distanceToEdgeUnits: number;
  isInside: boolean;
  isNear: boolean;
};

/** Cohérence : un classificationHint peut décrire une catégorie de contact. */
export type ClassifiableCategory = Extract<
  ContactCategory,
  "cargo" | "fishing_vessel" | "surface_vessel" | "usv_drone" | "unknown"
>;
