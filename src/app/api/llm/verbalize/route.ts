import { NextResponse } from "next/server";
import { createVerbalizeProvider, verbalizeMessages } from "@/core/llm";
import type { AgentMessage } from "@/types";

/**
 * POST /api/llm/verbalize — pont serveur permettant au store (client) de faire
 * reformuler ses messages d'agents déterministes par le backend LLM configuré
 * (Hermes/vLLM/OpenRouter). La clé API reste côté serveur. Le `.message` de
 * chaque entrée est reformulé ; tout le reste est préservé (patch par id).
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !Array.isArray((body as { messages?: unknown }).messages)
  ) {
    return NextResponse.json(
      { error: "`messages` doit être un tableau." },
      { status: 400 },
    );
  }

  try {
    const llm = createVerbalizeProvider();
    const messages = await verbalizeMessages(
      llm,
      (body as { messages: AgentMessage[] }).messages,
    );
    return NextResponse.json({ messages, provider: llm?.id ?? null });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
