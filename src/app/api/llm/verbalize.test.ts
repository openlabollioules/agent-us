import { describe, expect, it } from "vitest";
import type { AgentMessage } from "@/types";
import { POST } from "./verbalize/route";

function post(body: unknown): Request {
  return new Request("http://test/api/llm/verbalize", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const message: AgentMessage = {
  id: "m1",
  turn: 1,
  agentId: "radar-agent",
  agentName: "RadarAgent",
  message: "Constat radar.",
  referencedContacts: ["C-042"],
  usedSkills: ["detect_contact"],
  timestamp: "t+1",
};

describe("POST /api/llm/verbalize", () => {
  it("renvoie les messages inchangés en mode déterministe (provider null)", async () => {
    const res = await POST(post({ messages: [message] }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.provider).toBeNull();
    expect(data.messages[0].id).toBe("m1");
    expect(data.messages[0].message).toBe("Constat radar.");
  });

  it("400 si messages n'est pas un tableau", async () => {
    const res = await POST(post({}));
    expect(res.status).toBe(400);
  });
});
