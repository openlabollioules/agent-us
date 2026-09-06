import type { ContactSeed, ScenarioDefinition } from "@/types";
import { droneFollowingCargo } from "./drone-following-cargo";

const observer = (id: string, label: string, category: ContactSeed["category"],
  model: NonNullable<ContactSeed["visual"]>["model"], x: number, y: number,
  elevationM = 0): ContactSeed => ({
  id, label, category, visual: { model, elevationM }, affiliation: "friendly",
  position: { x, y }, headingDeg: 90, speedKnots: 4,
  radarConfidence: 0.95, aisConfidence: 0.95, optronicConfidence: 0.95, flags: [],
});

/** Same educational following puzzle, with a fully fictional cooperative fleet. */
export const ganExercise: ScenarioDefinition = {
  ...droneFollowingCargo,
  id: "gan-exercise",
  title: "GAN — Le suiveur dans l’exercice",
  objective: "Repérer un suivi à distance constante au sein d’un groupe naval d’exercice.",
  briefing: "Exercice entièrement fictif autour du France Libre. Les silhouettes évoquent des bâtiments français ; les routes, capteurs et profondeurs sont inventés. Un drone joue le rôle du contact à analyser. Les autres participants sont déclarés coopératifs. Aucune action offensive : observe, interroge les agents et justifie ton diagnostic.",
  initialContacts: [
    { ...droneFollowingCargo.initialContacts[0], label: "France Libre — exercice",
      category: "surface_vessel", affiliation: "friendly", visual: { model: "france-libre" } },
    { ...droneFollowingCargo.initialContacts[1], visual: { model: "seaquest-s" } },
    observer("EX-FDI", "Amiral Ronarc’h — exercice", "surface_vessel", "fdi", 180, 250),
    observer("EX-SUF", "Suffren — exercice", "submarine", "suffren", 230, 730, -40),
    observer("EX-SQM", "Seaquest M — exercice", "usv_drone", "seaquest-m", 380, 220),
    observer("EX-SQL", "Seaquest L — exercice", "usv_drone", "seaquest-l", 480, 750),
    observer("EX-SGM", "Seagent M — exercice", "submarine", "seagent-m", 580, 200, -20),
    observer("EX-SGX", "Seagent XL — exercice", "submarine", "seagent-xl", 600, 740, -30),
    observer("EX-UAV", "VSR700 — exercice", "uav_drone", "vsr700", 500, 400, 80),
  ],
  timeline: droneFollowingCargo.timeline.map((event) => ({ ...event,
    title: event.title.replace(/Cargo Blue Marlin/g, "France Libre").replace(/cargo/g, "porte-avions d’exercice"),
    description: event.description.replace(/Blue Marlin/g, "France Libre").replace(/cargo/g, "porte-avions d’exercice"),
  })),
  expectedDiagnosis: { ...droneFollowingCargo.expectedDiagnosis,
    keyEvidence: droneFollowingCargo.expectedDiagnosis.keyEvidence.map((evidence) =>
      evidence.replace(/cargo/g, "porte-avions d’exercice")),
  },
  debriefExplanation: droneFollowingCargo.debriefExplanation.replace(/cargo/g, "porte-avions d’exercice") +
    " Les participants coopératifs ne constituent pas des indices contre le contact analysé. L’apparence d’un bâtiment ne prouve aucune intention.",
};
