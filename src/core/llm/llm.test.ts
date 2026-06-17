import { describe, expect, it, vi } from "vitest";
import type { ChatMessage } from "@/types";
import { MockLLMProvider } from "./mock-provider";
import { VLLMProvider } from "./vllm-provider";
import { withMockFallback } from "./fallback";
import { createProvider } from "./factory";

const userMsg = (content: string): ChatMessage[] => [
  { role: "user", content },
];

/** Construit un faux fetch renvoyant une complétion vLLM valide. */
function fakeFetchOk(content: string) {
  return vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ message: { content } }] }),
  })) as unknown as typeof fetch;
}

describe("MockLLMProvider", () => {
  it("est déterministe et route selon le mot-clé", async () => {
    const mock = new MockLLMProvider();
    expect(await mock.chat(userMsg("question radar"))).toMatch(/piste radar/i);
    expect(await mock.chat(userMsg("compare AIS"))).toMatch(/route/i);
    expect(await mock.chat(userMsg("bonjour"))).toMatch(/analyse simulée/i);
  });
});

describe("VLLMProvider", () => {
  it("construit une requête /chat/completions valide", async () => {
    const fetchImpl = fakeFetchOk("réponse vllm");
    const provider = new VLLMProvider({
      baseUrl: "http://localhost:8000/v1/",
      model: "Qwen/Qwen3.6",
      apiKey: "EMPTY",
      fetchImpl,
    });

    const result = await provider.chat(userMsg("salut"));
    expect(result).toBe("réponse vllm");

    const [url, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(url).toBe("http://localhost:8000/v1/chat/completions");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.model).toBe("Qwen/Qwen3.6");
    expect(body.messages).toHaveLength(1);
    expect(body.temperature).toBe(0.4);
    expect(body.max_tokens).toBe(512);
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer EMPTY");
  });

  it("throw sur une réponse HTTP non OK", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      status: 500,
      json: async () => ({}),
    })) as unknown as typeof fetch;
    const provider = new VLLMProvider({
      baseUrl: "http://x/v1",
      model: "m",
      fetchImpl,
    });
    await expect(provider.chat(userMsg("x"))).rejects.toThrow(/500/);
  });
});

describe("withMockFallback", () => {
  it("retombe sur le mock quand le provider primaire échoue", async () => {
    const failing = new VLLMProvider({
      baseUrl: "http://x/v1",
      model: "m",
      fetchImpl: (async () => {
        throw new Error("network down");
      }) as unknown as typeof fetch,
    });
    const provider = withMockFallback(failing);
    const result = await provider.chat(userMsg("question radar"));
    expect(result).toMatch(/piste radar/i);
    expect(provider.id).toBe("vllm");
  });
});

describe("createProvider", () => {
  it("renvoie le mock par défaut", () => {
    expect(createProvider({ provider: "mock" }).id).toBe("mock");
    expect(createProvider({}).id).toBe("mock");
  });

  it("renvoie un provider vllm (avec fallback) si configuré", () => {
    const provider = createProvider({
      provider: "vllm",
      baseUrl: "http://localhost:8000/v1",
      model: "Qwen/Qwen3.6",
    });
    expect(provider.id).toBe("vllm");
  });

  it("retombe sur le mock si la config vllm est incomplète", () => {
    expect(createProvider({ provider: "vllm" }).id).toBe("mock");
  });
});
