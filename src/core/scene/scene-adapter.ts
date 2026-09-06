import type { TacticalState, Vec2, WeatherCondition } from "@/types";
import type { ModelId, SceneSnapshot } from "../../../modules/maritime-sim/protocol/schema";

// Fictional display scale. 1 unit = 10 m; 2 units/knot/turn implies 38.88 s/turn.
export const METERS_PER_UNIT = 10;
export const SECONDS_PER_TURN = 20 / (1852 / 3600);
const world = (p: Vec2, z = 0) => ({ x: (p.x - 500) * METERS_PER_UNIT,
  y: (p.y - 500) * METERS_PER_UNIT, z });
const presets: Record<WeatherCondition, { waveHeightM: number; visibilityM: number }> = {
  clear: { waveHeightM: 0.5, visibilityM: 20000 },
  rain: { waveHeightM: 1.5, visibilityM: 5000 },
  fog: { waveHeightM: 0.3, visibilityM: 600 },
  storm: { waveHeightM: 4, visibilityM: 1800 },
  high_sea: { waveHeightM: 5, visibilityM: 9000 },
};
const defaults: Record<string, ModelId> = {
  cargo: "cargo", fishing_vessel: "fishing", patrol_boat: "patrol",
  surface_vessel: "fdi", usv_drone: "seaquest-s", uav_drone: "vsr700",
  submarine: "suffren", unknown: "uncertain",
};

/** Only current public state crosses the boundary; uncertain identities stay hidden. */
export function toSceneSnapshot(state: TacticalState): SceneSnapshot {
  const condition = state.weather?.condition ?? "clear";
  const contacts = state.contacts.map((c) => {
    // An underwater model at a fabricated depth would reveal a diagnosis.
    const uncertain = c.category === "unknown" ||
      (c.category === "submarine" && (c.affiliation !== "friendly" || c.visual?.elevationM === undefined)) ||
      c.flags.includes("radar_contact_lost") || c.flags.includes("acoustic_only") ||
      (c.affiliation !== "friendly" && c.optronicConfidence < 0.65);
    const model: ModelId = uncertain ? "uncertain" : c.visual?.model ?? defaults[c.category];
    return {
      id: c.id, label: c.label, model, position: world(c.position, uncertain ? 0 : c.visual?.elevationM ?? 0),
      headingDeg: ((c.headingDeg % 360) + 360) % 360,
      uncertain, highlighted: !!c.isHighlighted, affiliation: c.affiliation,
      trail: state.visualFocus?.showTrajectories || c.isUnderWatch
        ? c.history.slice(-256).map((h) => world(h.position)) : [],
      ...(state.visualFocus?.showRelationLines && c.relationTargetId &&
        state.contacts.some((target) => target.id === c.relationTargetId)
        ? { relationTargetId: c.relationTargetId } : {}),
    };
  });
  const focused = contacts.filter((c) => state.visualFocus?.contactIds.includes(c.id));
  const targets = focused.length ? focused : contacts;
  const center = state.visualFocus ? world(state.visualFocus.center) : targets.length
    ? { x: targets.reduce((sum, c) => sum + c.position.x, 0) / targets.length,
      y: targets.reduce((sum, c) => sum + c.position.y, 0) / targets.length, z: 0 }
    : { x: 0, y: 0, z: 0 };
  const radiusM = Math.max(250, ...targets.map((c) =>
    Math.hypot(c.position.x - center.x, c.position.y - center.y) + 150));
  return {
    protocol: "maritime-scene/1", simulationId: state.simulationId,
    scenarioId: state.scenarioId, turn: state.turn, presentation: "exercise",
    timeSeconds: state.turn * SECONDS_PER_TURN,
    environment: { condition, ...presets[condition], sunElevationDeg: 35 },
    contacts,
    areas: (state.sensitiveAreas ?? []).map((area) => ({ id: area.id,
      label: area.label, center: world(area.area.center),
      radiusM: area.area.radiusUnits * METERS_PER_UNIT })),
    focus: { center, radiusM, contactIds: targets.map((c) => c.id) },
  };
}
