import { NextResponse } from "next/server";
import { simulationController } from "@/core/controller";
import { parseJsonBody } from "@/lib/api-utils";
import { startSchema } from "@/lib/api-schemas";

/** POST /api/simulation/start — démarre un scénario, renvoie le TacticalState. */
export async function POST(req: Request) {
  const { data, error } = await parseJsonBody(req, startSchema);
  if (error) return error;

  try {
    const state = simulationController.start(
      data.scenarioId,
      `sim-${data.scenarioId}`,
    );
    return NextResponse.json(state);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
