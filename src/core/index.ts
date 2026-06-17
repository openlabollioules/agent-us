/** Point d'entrée public de la couche logique d'Agent Us. */
export {
  SimulationController,
  simulationController,
} from "./controller";
export type { DiagnoseResult } from "./controller";

export { createInitialState, advanceTurn, MAP_SIZE } from "./simulation";
export { computeSuggestions, applySuggestions } from "./suggestions";
export { computeVisualFocus, applyVisualFocus } from "./attention";
export { scoreDiagnosis, buildDebrief, PASS_SCORE } from "./scoring";
export { AgentRuntime, agentRuntime } from "./runtime";
export { AGENT_DEFINITIONS } from "./agents";
export { createProvider } from "./llm";
