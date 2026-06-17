import { NextResponse } from "next/server";
import { simulationController } from "@/core/controller";
import { parseJsonBody } from "@/lib/api-utils";
import { actionSchema } from "@/lib/api-schemas";
import type { SuggestedAction, TacticalState } from "@/types";

/**
 * POST /api/simulation/action — exécute une action joueur (instruction libre ou
 * action suggérée) et renvoie le TacticalState enrichi.
 */
export async function POST(req: Request) {
  const { data, error } = await parseJsonBody(req, actionSchema);
  if (error) return error;

  try {
    const state = data.state as TacticalState;
    const next = data.instruction
      ? simulationController.runInstruction(state, data.instruction)
      : simulationController.runSuggestedAction(
          state,
          data.action as SuggestedAction,
        );
    return NextResponse.json(next);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
