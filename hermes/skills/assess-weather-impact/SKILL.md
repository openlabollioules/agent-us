# Skill: assess_weather_impact

## Subagent propriétaire
RadarAgent

## Accès MCP (outils)
- WeatherMCP — `getReport(state)` retourne un `WeatherReport` (`condition`, `sensorDegradation`, `degradesRadar`, `degradesOptronic`, `summary`) dérivé de `state.weather` (rien n'est inventé ; sans météo déclarée, temps clair sans dégradation).

## Objectif
Estime si une anomalie capteur observée sur un contact peut s'expliquer par la météo. Pédagogie : par mauvais temps, une perte de piste ou une faible confiance radar sont *attendues* — donc moins suspectes.

## Entrées
- `weather: WeatherReport`
  - `condition: "clear" | "rain" | "fog" | "storm" | "high_sea"`
  - `sensorDegradation: number` (0..1)
  - `degradesRadar: boolean`
  - `degradesOptronic: boolean`
- `contact: ContactTrack` (on lit ses `flags` : `low_radar_confidence`, `radar_contact_lost`, `weather_degraded`).

## Sorties (résultat déterministe)
Un `SkillResult` :
- `skill`: `"assess_weather_impact"`
- `summary`: relie (ou non) l'anomalie capteur du contact aux conditions météo.
- `confidence`: `sensorDegradation` si la météo explique l'anomalie, sinon `1 - sensorDegradation`.
- `flags`: `[]` (drapeau de contexte ; la fausse alerte reste portée par `possible_false_positive`).
- `recommendedAction`: traiter comme possible fausse alerte météo et croiser les capteurs, sinon poursuivre l'analyse.

## Contrat de verbalisation
Le cœur déterministe calcule `summary` (texte factuel). Hermes REFORMULE ce summary en message d'agent lisible, SANS inventer de fait, position ni action. En l'absence de backend, `summary` est affiché tel quel.

## Règles
- Univers fictif et pédagogique : aucune donnée militaire réelle.
- La météo dégradée explique une anomalie capteur, elle ne disculpe ni n'accuse : elle invite à la prudence.
- N'infère jamais d'hostilité ; n'élimine jamais seule une menace.
- Aucune action offensive recommandée ; l'humain reste dans la boucle.

## Exemple
Scénario « Le mirage de la tempête » (weather-false-positive), tour 4 : grain orageux (dégradation 0.6), C-210 vient de perdre sa piste radar.

Entrée :
```json
{
  "weather": {
    "condition": "storm",
    "sensorDegradation": 0.6,
    "degradesRadar": true,
    "degradesOptronic": true
  },
  "contact": { "id": "C-210", "flags": ["radar_contact_lost", "weather_degraded"] }
}
```
Sortie :
```json
{
  "skill": "assess_weather_impact",
  "summary": "Grain orageux actif (dégradation capteur : 60 %). L'anomalie capteur sur C-210 est cohérente avec ces conditions : prudence avant de conclure à une menace.",
  "confidence": 0.6,
  "flags": [],
  "recommendedAction": "Traiter l'anomalie comme une possible fausse alerte météo et croiser les capteurs."
}
```
