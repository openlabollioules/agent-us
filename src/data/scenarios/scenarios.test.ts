import { describe, expect, it } from "vitest";
import { SCENARIOS, getScenario, listScenarioMeta } from "./index";

/** Nombre de scénarios attendus (3 V1 + 5 V2). */
const EXPECTED_SCENARIO_COUNT = 8;

describe("catalogue de scénarios", () => {
  it("expose tous les scénarios avec des identifiants uniques", () => {
    expect(SCENARIOS).toHaveLength(EXPECTED_SCENARIO_COUNT);
    const ids = SCENARIOS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("listScenarioMeta renvoie une carte allégée par scénario", () => {
    const meta = listScenarioMeta();
    expect(meta).toHaveLength(EXPECTED_SCENARIO_COUNT);
    for (const m of meta) {
      expect(m.title.length).toBeGreaterThan(0);
      expect(m.objective.length).toBeGreaterThan(0);
      expect(m.estimatedMinutes).toBeGreaterThan(0);
    }
  });

  it("getScenario throw sur un identifiant inconnu", () => {
    expect(() => getScenario("does-not-exist")).toThrow();
  });

  describe.each(SCENARIOS)("scénario $id", (scenario) => {
    const contactIds = new Set(scenario.initialContacts.map((c) => c.id));

    it("possède au moins un contact initial avec des id uniques", () => {
      expect(scenario.initialContacts.length).toBeGreaterThan(0);
      expect(contactIds.size).toBe(scenario.initialContacts.length);
    });

    it("a des événements dans la fenêtre [1, maxTurns]", () => {
      for (const event of scenario.timeline) {
        expect(event.turn).toBeGreaterThanOrEqual(1);
        expect(event.turn).toBeLessThanOrEqual(scenario.maxTurns);
      }
    });

    it("ne référence que des contacts existants (events, effets, relations)", () => {
      for (const event of scenario.timeline) {
        if (event.contactId) expect(contactIds).toContain(event.contactId);
        for (const effect of event.effects ?? []) {
          expect(contactIds).toContain(effect.contactId);
          if (effect.setRelationTargetId) {
            expect(contactIds).toContain(effect.setRelationTargetId);
          }
        }
      }
      for (const contact of scenario.initialContacts) {
        if (contact.relationTargetId) {
          expect(contactIds).toContain(contact.relationTargetId);
        }
      }
    });

    it("a un diagnostic attendu pointant un contact existant et des indices", () => {
      expect(contactIds).toContain(scenario.expectedDiagnosis.contactId);
      expect(scenario.expectedDiagnosis.keyEvidence.length).toBeGreaterThan(0);
      expect(scenario.pedagogicalGoals.length).toBeGreaterThan(0);
      expect(scenario.debriefExplanation.length).toBeGreaterThan(0);
    });

    it("a des confiances capteurs valides (0..1)", () => {
      for (const c of scenario.initialContacts) {
        for (const v of [c.radarConfidence, c.aisConfidence, c.optronicConfidence]) {
          expect(v).toBeGreaterThanOrEqual(0);
          expect(v).toBeLessThanOrEqual(1);
        }
      }
    });
  });
});
