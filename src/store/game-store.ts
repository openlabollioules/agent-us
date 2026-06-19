import { create } from "zustand";
import type {
  DebriefData,
  PlayerDiagnosis,
  ScoreResult,
  SuggestedAction,
  TacticalState,
} from "@/types";
import { simulationController } from "@/core/controller";
import { verbalizeMessagesViaApi } from "@/core/llm";

export type GameScreen = "select" | "playing" | "debrief";

/**
 * Verbalisation activée côté client uniquement si ce flag public vaut "1".
 * En mode déterministe (défaut), aucun appel réseau n'est tenté.
 */
const LLM_ENABLED = process.env.NEXT_PUBLIC_LLM_ENABLED === "1";

type SetState = (partial: Partial<GameStore>) => void;
type GetState = () => GameStore;

/**
 * Reformule les messages d'agents ajoutés depuis `prevCount` via le backend LLM
 * (Hermes/vLLM/…) et patche l'état par id. Fire-and-forget : l'état déterministe
 * est déjà affiché ; ce patch ne fait qu'enrichir le texte quand il revient.
 */
async function verbalizeFrom(prevCount: number, set: SetState, get: GetState) {
  if (!LLM_ENABLED) return;
  const current = get().state;
  if (!current) return;

  const fresh = current.agentMessages.slice(prevCount);
  if (fresh.length === 0) return;

  const verbalized = await verbalizeMessagesViaApi(fresh);
  const byId = new Map(verbalized.map((m) => [m.id, m.message]));

  const after = get().state;
  if (!after) return;
  set({
    state: {
      ...after,
      agentMessages: after.agentMessages.map((m) =>
        byId.has(m.id) ? { ...m, message: byId.get(m.id)! } : m,
      ),
    },
  });
}

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
 * côté client). Toute la logique reste dans `src/core`. Quand un backend LLM est
 * configuré, les messages d'agents sont reformulés a posteriori (verbalize).
 */
export const useGameStore = create<GameStore>((set, get) => ({
  screen: "select",
  state: null,

  start: (scenarioId) => {
    set({
      screen: "playing",
      state: simulationController.start(scenarioId, `sim-${scenarioId}`),
      selectedContactId: undefined,
      diagnosis: undefined,
      score: undefined,
      debrief: undefined,
    });
    void verbalizeFrom(0, set, get);
  },

  step: () => {
    const prev = get().state;
    if (!prev) return;
    set({ state: simulationController.step(prev) });
    void verbalizeFrom(prev.agentMessages.length, set, get);
  },

  selectContact: (id) => set({ selectedContactId: id }),

  sendInstruction: (text) => {
    const prev = get().state;
    if (!prev || !text.trim()) return;
    set({ state: simulationController.runInstruction(prev, text) });
    void verbalizeFrom(prev.agentMessages.length, set, get);
  },

  runSuggestion: (action) => {
    const prev = get().state;
    if (!prev) return;
    set({ state: simulationController.runSuggestedAction(prev, action) });
    void verbalizeFrom(prev.agentMessages.length, set, get);
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
