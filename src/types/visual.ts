import type { ModelId } from "../../modules/maritime-sim/protocol/schema";

/** Exercise costume only; never a sensor measurement or real performance data. */
export type ContactVisual = {
  model: ModelId;
  /** Authored fictional altitude/depth; absent means unknown, never inferred. */
  elevationM?: number;
};
