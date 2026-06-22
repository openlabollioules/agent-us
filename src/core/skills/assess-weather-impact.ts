import type { ContactTrack, SkillResult, WeatherReport } from "@/types";

/**
 * assess_weather_impact — estime si une anomalie capteur sur un contact peut
 * s'expliquer par la météo. Pédagogie : une dégradation météo rend une perte de
 * piste ou une faible confiance attendues — donc moins suspectes.
 */
export function assessWeatherImpact(
  weather: WeatherReport,
  contact: ContactTrack,
): SkillResult {
  const sensorAnomaly =
    contact.flags.includes("low_radar_confidence") ||
    contact.flags.includes("radar_contact_lost") ||
    contact.flags.includes("weather_degraded");

  const weatherExplains = weather.degradesRadar && sensorAnomaly;

  return {
    skill: "assess_weather_impact",
    summary: weatherExplains
      ? `${weather.summary} L'anomalie capteur sur ${contact.id} est cohérente avec ces conditions : prudence avant de conclure à une menace.`
      : `${weather.summary} La météo n'explique pas à elle seule le comportement de ${contact.id}.`,
    // Plus la dégradation est forte, plus on est "confiant" que la météo joue.
    confidence: weatherExplains
      ? weather.sensorDegradation
      : 1 - weather.sensorDegradation,
    flags: [],
    recommendedAction: weatherExplains
      ? "Traiter l'anomalie comme une possible fausse alerte météo et croiser les capteurs."
      : "Continuer l'analyse : la météo seule ne suffit pas à expliquer le contact.",
  };
}
