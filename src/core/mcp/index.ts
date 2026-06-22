import { RadarMCP } from "./radar-mcp";
import { AISMCP } from "./ais-mcp";
import { OptronicMCP } from "./optronic-mcp";
import { ScenarioMCP } from "./scenario-mcp";
import { WeatherMCP } from "./weather-mcp";
import { AcousticMCP } from "./acoustic-mcp";
import { GeoMCP } from "./geo-mcp";

export { RadarMCP } from "./radar-mcp";
export { AISMCP } from "./ais-mcp";
export { OptronicMCP } from "./optronic-mcp";
export { ScenarioMCP } from "./scenario-mcp";
export { WeatherMCP } from "./weather-mcp";
export { AcousticMCP } from "./acoustic-mcp";
export { GeoMCP } from "./geo-mcp";
export { findContact } from "./util";

/** Instances simulées partagées (sans état interne, réutilisables). */
export const radarMcp = new RadarMCP();
export const aisMcp = new AISMCP();
export const optronicMcp = new OptronicMCP();
export const scenarioMcp = new ScenarioMCP();
// V2 — nouveaux domaines.
export const weatherMcp = new WeatherMCP();
export const acousticMcp = new AcousticMCP();
export const geoMcp = new GeoMCP();
