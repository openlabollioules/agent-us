import { describe, expect, it, vi } from "vitest";
import type { AgentMessage, LLMProvider } from "@/types";
import { verbalize, verbalizeMessages } from "./verbalize";
import { createVerbalizeProvider } from "./factory";
import { OpenAICompatibleProvider } from "./openai-compatible-provider";

const provider = (chat: () => Promise<string>): LLMProvider => ({
  id: "hermes",
  chat,
});

const sampleMessage = (): AgentMessage => ({
  id: "m1",
  turn: 1,
  agentId: "radar-agent",
  agentName: "RadarAgent",
  message: "Constat radar déterministe.",
  referencedContacts: ["C-042"],
  usedSkills: ["detect_contact"],
  timestamp: "t+1",
});

describe("verbalize", () => {
  it("renvoie le texte déterministe sans provider", async () => {
    expect(await verbalize(null, "Constat.")).toBe("Constat.");
  });

  it("retombe sur le déterministe si le backend échoue", async () => {
    const llm = provider(async () => {
      throw new Error("down");
    });
    expect(await verbalize(llm, "Constat.")).toBe("Constat.");
  });

  it("utilise la reformulation du backend", async () => {
    const llm = provider(async () => "Reformulé.");
    expect(await verbalize(llm, "Constat.")).toBe("Reformulé.");
  });

  it("garde le déterministe si le backend renvoie du vide", async () => {
    const llm = provider(async () => "   ");
    expect(await verbalize(llm, "Constat.")).toBe("Constat.");
  });
});

describe("verbalizeMessages", () => {
  it("reformule .message en préservant le reste", async () => {
    const llm = provider(async () => "Texte enrichi.");
    const [out] = await verbalizeMessages(llm, [sampleMessage()]);
    expect(out.message).toBe("Texte enrichi.");
    expect(out.id).toBe("m1");
    expect(out.referencedContacts).toEqual(["C-042"]);
    expect(out.usedSkills).toEqual(["detect_contact"]);
  });

  it("renvoie inchangé sans provider", async () => {
    const msg = sampleMessage();
    expect(await verbalizeMessages(null, [msg])).toEqual([msg]);
  });
});

describe("createVerbalizeProvider", () => {
  it("null en mode déterministe (vide / mock)", () => {
    expect(createVerbalizeProvider({})).toBeNull();
    expect(createVerbalizeProvider({ LLM_PROVIDER: "" })).toBeNull();
    expect(createVerbalizeProvider({ LLM_PROVIDER: "mock" })).toBeNull();
  });

  it("crée un provider hermes quand configuré", () => {
    const p = createVerbalizeProvider({
      LLM_PROVIDER: "hermes",
      HERMES_BASE_URL: "http://localhost:8080/v1",
      HERMES_MODEL: "hermes-agent",
      HERMES_API_KEY: "key",
    });
    expect(p?.id).toBe("hermes");
    expect(p).toBeInstanceOf(OpenAICompatibleProvider);
  });

  it("crée vllm et openrouter", () => {
    expect(createVerbalizeProvider({ LLM_PROVIDER: "vllm" })?.id).toBe("vllm");
    expect(createVerbalizeProvider({ LLM_PROVIDER: "openrouter" })?.id).toBe(
      "openrouter",
    );
  });
});

describe("OpenAICompatibleProvider", () => {
  it("construit une requête /chat/completions valide (hermes)", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: "ok" } }] }),
    })) as unknown as typeof fetch;

    const p = new OpenAICompatibleProvider(
      "hermes",
      "http://h:8080/v1/",
      "hermes-agent",
      "KEY",
      { fetchImpl },
    );
    const result = await p.chat([{ role: "user", content: "x" }]);
    expect(result).toBe("ok");

    const [url, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(url).toBe("http://h:8080/v1/chat/completions");
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer KEY");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.model).toBe("hermes-agent");
  });
});
