import { describe, expect, it } from "vitest";
import type {
  ContactTrack,
  ScenarioDefinition,
  SkillResult,
  TacticalState,
} from "@/types";

/**
 * Tests de validation basiques : on construit des objets conformes aux types
 * pour garantir que les formes compilent (TS strict) et restent cohérentes.
 */
describe("types tactiques", () => {
  it("un ContactTrack minimal est valide", () => {
    const contact = {
      id: "C-042",
      label: "Contact inconnu",
      category: "usv_drone",
      affiliation: "unknown",
      position: { x: 10, y: 20 },
      speedKnots: 18,
      headingDeg: 74,
      history: [],
      radarConfidence: 0.42,
      aisConfidence: 0,
      optronicConfidence: 0.5,
      suspicionScore: 0,
      flags: ["low_radar_confidence"],
    } satisfies ContactTrack;

    expect(contact.flags).toContain("low_radar_confidence");
  });

  it("un TacticalState initial est valide", () => {
    const state = {
      simulationId: "sim-1",
      turn: 0,
      scenarioId: "drone-following-cargo",
      status: "not_started",
      contacts: [],
      events: [],
      agentMessages: [],
      suggestedActions: [],
      playerActions: [],
    } satisfies TacticalState;

    expect(state.status).toBe("not_started");
  });

  it("un SkillResult peut porter un drapeau d'analyse", () => {
    const result = {
      skill: "estimate_confidence",
      summary: "Confiance combinée faible.",
      confidence: 0.4,
      flags: ["low_confidence"],
      recommendedAction: "Croiser les capteurs.",
    } satisfies SkillResult;

    expect(result.flags).toContain("low_confidence");
  });

  it("un ScenarioDefinition expose un diagnostic attendu", () => {
    const scenario = {
      id: "drone-following-cargo",
      title: "Drone suivant un cargo",
      difficulty: "beginner",
      objective: "Identifier un suivi discret.",
      estimatedMinutes: 8,
      briefing: "Zone de surveillance active.",
      maxTurns: 8,
      initialContacts: [],
      timeline: [],
      expectedDiagnosis: {
        contactId: "C-042",
        anomalyType: "discreet_following",
        keyEvidence: ["trajectoire parallèle", "distance constante"],
      },
      pedagogicalGoals: ["croiser plusieurs sources"],
      debriefExplanation: "Un contact à distance constante peut suivre.",
    } satisfies ScenarioDefinition;

    expect(scenario.expectedDiagnosis.anomalyType).toBe("discreet_following");
  });
});
