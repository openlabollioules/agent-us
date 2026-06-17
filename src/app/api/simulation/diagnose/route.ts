import { NextResponse } from "next/server";
import { simulationController } from "@/core/controller";
import { parseJsonBody } from "@/lib/api-utils";
import { diagnoseSchema } from "@/lib/api-schemas";
import type { PlayerDiagnosis, TacticalState } from "@/types";

/**
 * POST /api/simulation/diagnose — évalue le diagnostic du joueur, renvoie
 * { state, score, debrief }.
 */
export async function POST(req: Request) {
  const { data, error } = await parseJsonBody(req, diagnoseSchema);
  if (error) return error;

  try {
    const result = simulationController.diagnose(
      data.state as TacticalState,
      data.diagnosis as PlayerDiagnosis,
    );
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
