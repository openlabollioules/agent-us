import type { TacticalState, WeatherReport } from "@/types";

/** Seuil de dégradation à partir duquel un capteur est jugé affecté. */
const DEGRADATION_THRESHOLD = 0.35;

/**
 * WeatherMCP — expose les conditions météo de la zone et leur impact sur les
 * capteurs. Tout est dérivé de `state.weather` (rien n'est inventé). Sans météo
 * déclarée (scénarios V1), renvoie un temps clair sans dégradation.
 */
export class WeatherMCP {
  getReport(state: TacticalState): WeatherReport {
    const weather = state.weather;

    if (!weather) {
      return {
        condition: "clear",
        sensorDegradation: 0,
        degradesRadar: false,
        degradesOptronic: false,
        summary: "Conditions météo nominales : aucun impact capteur.",
      };
    }

    const degraded = weather.sensorDegradation >= DEGRADATION_THRESHOLD;
    return {
      condition: weather.condition,
      sensorDegradation: weather.sensorDegradation,
      degradesRadar: degraded,
      degradesOptronic: degraded,
      summary: `${weather.description} (dégradation capteur : ${Math.round(
        weather.sensorDegradation * 100,
      )} %).`,
    };
  }
}
