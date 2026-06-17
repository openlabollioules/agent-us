import { RadarMCP } from "./radar-mcp";
import { AISMCP } from "./ais-mcp";
import { OptronicMCP } from "./optronic-mcp";
import { ScenarioMCP } from "./scenario-mcp";

export { RadarMCP } from "./radar-mcp";
export { AISMCP } from "./ais-mcp";
export { OptronicMCP } from "./optronic-mcp";
export { ScenarioMCP } from "./scenario-mcp";
export { findContact } from "./util";

/** Instances simulées partagées (sans état interne, réutilisables). */
export const radarMcp = new RadarMCP();
export const aisMcp = new AISMCP();
export const optronicMcp = new OptronicMCP();
export const scenarioMcp = new ScenarioMCP();
