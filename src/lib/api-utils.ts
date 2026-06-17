import { NextResponse } from "next/server";
import type { ZodType } from "zod";

/**
 * Lit et valide le corps JSON d'une requête. Renvoie `{ data }` en cas de
 * succès, sinon `{ error }` avec une réponse 400 prête à retourner.
 */
export async function parseJsonBody<T>(
  req: Request,
  schema: ZodType<T>,
): Promise<{ data: T; error?: undefined } | { data?: undefined; error: NextResponse }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return {
      error: NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 }),
    };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      error: NextResponse.json(
        { error: "Entrée invalide.", issues: parsed.error.issues },
        { status: 400 },
      ),
    };
  }

  return { data: parsed.data };
}
