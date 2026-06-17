import { create } from "zustand";
import type {
  DebriefData,
  PlayerDiagnosis,
  ScoreResult,
  SuggestedAction,
  TacticalState,
} from "@/types";
import { simulationController } from "@/core/controller";

export type GameScreen = "select" | "playing" | "debrief";

type GameStore = {
  screen: GameScreen;
  state: TacticalState | null;
  selectedContactId?: string;
  diagnosis?: PlayerDiagnosis;
  score?: ScoreResult;
  debrief?: DebriefData;

  start: (scenarioId: string) => void;
  step: () => void;
  selectContact: (id?: string) => void;
  sendInstruction: (text: string) => void;
  runSuggestion: (action: SuggestedAction) => void;
  submitDiagnosis: (diagnosis: PlayerDiagnosis) => void;
  reset: () => void;
};

/**
 * Store de jeu — pilote tout le flux via le SimulationController (déterministe,
 * côté client). Toute la logique reste dans `src/core` ; le store ne fait que
 * conserver l'état courant et déléguer.
 */
export const useGameStore = create<GameStore>((set, get) => ({
  screen: "select",
  state: null,

  start: (scenarioId) =>
    set({
      screen: "playing",
      state: simulationController.start(scenarioId, `sim-${scenarioId}`),
      selectedContactId: undefined,
      diagnosis: undefined,
      score: undefined,
      debrief: undefined,
    }),

  step: () => {
    const { state } = get();
    if (state) set({ state: simulationController.step(state) });
  },

  selectContact: (id) => set({ selectedContactId: id }),

  sendInstruction: (text) => {
    const { state } = get();
    if (state && text.trim()) {
      set({ state: simulationController.runInstruction(state, text) });
    }
  },

  runSuggestion: (action) => {
    const { state } = get();
    if (state) set({ state: simulationController.runSuggestedAction(state, action) });
  },

  submitDiagnosis: (diagnosis) => {
    const { state } = get();
    if (!state) return;
    const result = simulationController.diagnose(state, diagnosis);
    set({
      state: result.state,
      score: result.score,
      debrief: result.debrief,
      diagnosis,
      screen: "debrief",
    });
  },

  reset: () =>
    set({
      screen: "select",
      state: null,
      selectedContactId: undefined,
      diagnosis: undefined,
      score: undefined,
      debrief: undefined,
    }),
}));
