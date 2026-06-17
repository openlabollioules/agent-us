import type { AgentId, TacticalState } from "@/types";

/** Normalise un texte : minuscules + suppression des accents. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

/** Nom d'agent normalisé (ex : "RadarAgent" → "radaragent"). */
const AGENT_NAMES: { id: AgentId; name: string }[] = [
  { id: "game-master-agent", name: "gamemasteragent" },
  { id: "radar-agent", name: "radaragent" },
  { id: "navigation-agent", name: "navigationagent" },
  { id: "optronic-agent", name: "optronicagent" },
  { id: "threat-assessment-agent", name: "threatassessmentagent" },
];

/** Mots-clés thématiques vers un agent (fallback si aucun nom explicite). */
const AGENT_KEYWORDS: { id: AgentId; keywords: string[] }[] = [
  { id: "radar-agent", keywords: ["radar", "piste", "instable", "detection"] },
  {
    id: "navigation-agent",
    keywords: ["navigation", "ais", "trajectoire", "route", "cap", "suivi"],
  },
  {
    id: "optronic-agent",
    keywords: ["optroni", "thermi", "visuel", "image", "classification"],
  },
  {
    id: "threat-assessment-agent",
    keywords: ["menace", "suspicion", "threat", "synthese", "fusion"],
  },
];

/**
 * Détecte l'agent ciblé par une instruction libre :
 * 1) un nom d'agent explicite, sinon 2) un mot-clé thématique, sinon `null`.
 */
export function detectAgent(instruction: string): AgentId | null {
  const norm = normalize(instruction);
  const compact = norm.replace(/[^a-z]/g, "");

  for (const { id, name } of AGENT_NAMES) {
    if (compact.includes(name)) return id;
  }
  for (const { id, keywords } of AGENT_KEYWORDS) {
    if (keywords.some((kw) => norm.includes(kw))) return id;
  }
  return null;
}

/** Détecte un identifiant de contact mentionné (ex : "C-042", "c042"). */
export function detectContact(
  text: string,
  state: TacticalState,
): string | undefined {
  const compact = normalize(text).replace(/[^a-z0-9]/g, "");
  return state.contacts.find((c) =>
    compact.includes(normalize(c.id).replace(/[^a-z0-9]/g, "")),
  )?.id;
}

/**
 * Choisit un contact par défaut quand aucun n'est mentionné :
 * le plus suspect, sinon celui du dernier événement, sinon le premier.
 */
export function pickContact(state: TacticalState): string | undefined {
  const mostSuspicious = [...state.contacts]
    .filter((c) => c.suspicionScore > 0)
    .sort((a, b) => b.suspicionScore - a.suspicionScore)[0];
  if (mostSuspicious) return mostSuspicious.id;

  const latestEventContact = [...state.events]
    .reverse()
    .find((e) => e.contactId)?.contactId;
  if (latestEventContact) return latestEventContact;

  return state.contacts[0]?.id;
}
