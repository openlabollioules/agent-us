import { NextResponse } from "next/server";
import { simulationController } from "@/core/controller";
import { parseJsonBody } from "@/lib/api-utils";
import { stepSchema } from "@/lib/api-schemas";
import type { TacticalState } from "@/types";

/** POST /api/simulation/step — avance d'un tour, renvoie le TacticalState. */
export async function POST(req: Request) {
  const { data, error } = await parseJsonBody(req, stepSchema);
  if (error) return error;

  try {
    const next = simulationController.step(data.state as TacticalState);
    return NextResponse.json(next);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
