import type {
  ContactEffect,
  ContactTrack,
  ScenarioDefinition,
  TacticalEvent,
  TacticalState,
  WorldEffect,
} from "@/types";
import { HIGHLIGHT_THRESHOLD, WATCH_THRESHOLD } from "./constants";
import { toPublicEvent } from "./events";
import { nextPosition } from "./movement";
import { computeSuspicion } from "./suspicion";

/**
 * TacticalStateEngine — fait évoluer la simulation tour par tour.
 *
 * Règle fondamentale : TacticalState est l'unique source de vérité. Le moteur
 * est 100% déterministe et pur (aucune mutation des entrées, aucun aléa, aucun
 * Date.now()). Les agents IA ne font qu'interpréter l'état produit ici.
 */

/** Recalcule les champs dérivés d'un contact (suspicion + état visuel). */
function withDerived(contact: ContactTrack): ContactTrack {
  const suspicionScore = computeSuspicion(contact);
  return {
    ...contact,
    suspicionScore,
    isUnderWatch: suspicionScore >= WATCH_THRESHOLD,
    isHighlighted: suspicionScore >= HIGHLIGHT_THRESHOLD,
  };
}

/** Applique un effet scénarisé à un contact (immuable). */
function applyEffect(contact: ContactTrack, effect: ContactEffect): ContactTrack {
  let flags = contact.flags;
  if (effect.removeFlags) {
    const toRemove = new Set(effect.removeFlags);
    flags = flags.filter((flag) => !toRemove.has(flag));
  }
  if (effect.addFlags) {
    flags = Array.from(new Set([...flags, ...effect.addFlags]));
  }

  return {
    ...contact,
    flags,
    headingDeg: effect.headingDeg ?? contact.headingDeg,
    speedKnots: effect.speedKnots ?? contact.speedKnots,
    radarConfidence: effect.radarConfidence ?? contact.radarConfidence,
    aisConfidence: effect.aisConfidence ?? contact.aisConfidence,
    optronicConfidence: effect.optronicConfidence ?? contact.optronicConfidence,
    relationTargetId: effect.setRelationTargetId ?? contact.relationTargetId,
  };
}

/** Champs de contexte d'environnement V2 modifiables par `worldEffects`. */
type WorldFields = Pick<
  TacticalState,
  "weather" | "acousticContacts" | "behaviorProfiles"
>;

/**
 * Applique les effets d'environnement V2 (météo, acoustique, comportement) de
 * façon pure et immuable. `sensitiveAreas` est statique (porté par le spread).
 * Sans effet, renvoie les champs inchangés (références identiques → état stable).
 */
function applyWorldEffects(
  state: TacticalState,
  effects: WorldEffect[],
): WorldFields {
  if (effects.length === 0) {
    return {
      weather: state.weather,
      acousticContacts: state.acousticContacts,
      behaviorProfiles: state.behaviorProfiles,
    };
  }

  let weather = state.weather;
  let acoustic = state.acousticContacts ? [...state.acousticContacts] : [];
  let behaviors = state.behaviorProfiles ? [...state.behaviorProfiles] : [];

  for (const effect of effects) {
    switch (effect.kind) {
      case "set_weather":
        weather = { ...effect.weather };
        break;
      case "add_acoustic":
        acoustic = [
          ...acoustic.filter((a) => a.id !== effect.contact.id),
          { ...effect.contact },
        ];
        break;
      case "update_acoustic":
        acoustic = acoustic.map((a) =>
          a.id === effect.id ? { ...a, ...effect.patch } : a,
        );
        break;
      case "remove_acoustic":
        acoustic = acoustic.filter((a) => a.id !== effect.id);
        break;
      case "set_behavior":
        behaviors = [
          ...behaviors.filter((b) => b.contactId !== effect.profile.contactId),
          { ...effect.profile },
        ];
        break;
    }
  }

  return {
    weather,
    // On préserve `undefined` (sémantique V1) si rien n'existe ni n'est ajouté.
    acousticContacts: acoustic.length > 0 ? acoustic : state.acousticContacts,
    behaviorProfiles: behaviors.length > 0 ? behaviors : state.behaviorProfiles,
  };
}

/** Construit l'état initial (tour 0) à partir d'une définition de scénario. */
export function createInitialState(
  scenario: ScenarioDefinition,
  simulationId: string,
): TacticalState {
  const contacts = scenario.initialContacts.map((seed) =>
    withDerived({
      id: seed.id,
      label: seed.label,
      category: seed.category,
      affiliation: seed.affiliation,
      position: seed.position,
      speedKnots: seed.speedKnots,
      headingDeg: seed.headingDeg,
      history: [
        {
          turn: 0,
          position: seed.position,
          speedKnots: seed.speedKnots,
          headingDeg: seed.headingDeg,
        },
      ],
      radarConfidence: seed.radarConfidence,
      aisConfidence: seed.aisConfidence,
      optronicConfidence: seed.optronicConfidence,
      suspicionScore: 0,
      flags: seed.flags ? [...seed.flags] : [],
      relationTargetId: seed.relationTargetId,
    }),
  );

  const missionEvent: TacticalEvent = {
    id: `${scenario.id}-mission-started`,
    turn: 0,
    type: "mission_started",
    severity: "info",
    title: "Mission lancée",
    description: scenario.briefing,
  };

  return {
    simulationId,
    turn: 0,
    scenarioId: scenario.id,
    status: "running",
    contacts,
    events: [missionEvent],
    agentMessages: [],
    suggestedActions: [],
    playerActions: [],
    // V2 — contexte d'environnement (copies immuables ; `undefined` en V1).
    weather: scenario.initialWeather
      ? { ...scenario.initialWeather }
      : undefined,
    sensitiveAreas: scenario.sensitiveAreas?.map((a) => ({
      ...a,
      area: { ...a.area, center: { ...a.area.center } },
    })),
    acousticContacts: scenario.initialAcousticContacts?.map((a) => ({ ...a })),
    behaviorProfiles: scenario.initialBehaviorProfiles?.map((b) => ({ ...b })),
  };
}

/**
 * Avance d'un tour : applique les effets scénarisés, déplace les contacts par
 * inertie, enregistre l'historique, recalcule la suspicion et publie les
 * événements du tour. Renvoie un nouvel état (l'entrée n'est jamais mutée).
 */
export function advanceTurn(
  state: TacticalState,
  scenario: ScenarioDefinition,
): TacticalState {
  if (state.status === "completed" || state.turn >= scenario.maxTurns) {
    return state;
  }

  const nextTurn = state.turn + 1;
  const scriptedEvents = scenario.timeline.filter((e) => e.turn === nextTurn);

  // 1. Applique les effets scénarisés (cap, vitesse, flags, confiances).
  const effectsByContact = new Map<string, ContactEffect[]>();
  for (const event of scriptedEvents) {
    for (const effect of event.effects ?? []) {
      const list = effectsByContact.get(effect.contactId) ?? [];
      list.push(effect);
      effectsByContact.set(effect.contactId, list);
    }
  }

  const contacts = state.contacts.map((contact) => {
    const effects = effectsByContact.get(contact.id) ?? [];
    const updated = effects.reduce(applyEffect, contact);

    // 2. Déplace par inertie + enregistre l'historique de position.
    const position = nextPosition(
      updated.position,
      updated.headingDeg,
      updated.speedKnots,
    );

    // 3. Recalcule les champs dérivés (suspicion, état visuel).
    return withDerived({
      ...updated,
      position,
      history: [
        ...updated.history,
        {
          turn: nextTurn,
          position,
          speedKnots: updated.speedKnots,
          headingDeg: updated.headingDeg,
        },
      ],
    });
  });

  // 4. Applique les effets d'environnement V2 (météo, acoustique, comportement).
  const world = applyWorldEffects(
    state,
    scriptedEvents.flatMap((event) => event.worldEffects ?? []),
  );

  const status =
    nextTurn >= scenario.maxTurns ? "awaiting_player" : "running";

  return {
    ...state,
    turn: nextTurn,
    status,
    contacts,
    events: [...state.events, ...scriptedEvents.map(toPublicEvent)],
    ...world,
  };
}
