# Skill: detect_contact

## Subagent propriétaire
RadarAgent

## Accès MCP (outils)
- RadarMCP — `getObservation(state, contactId)` retourne une `RadarObservation` (`contactId`, `rangeNm`, `bearingDeg`, `speedKnots`, `radarConfidence`, `radarStatus`) entièrement dérivée du `TacticalState` (rien n'est inventé).

## Objectif
Décrit un contact radar simulé et signale l'incertitude liée à la confiance radar. N'infère jamais d'hostilité à partir d'une simple détection.

## Entrées
- `input: RadarObservation`
  - `contactId: string`
  - `rangeNm: number`
  - `bearingDeg: number`
  - `speedKnots: number`
  - `radarConfidence: number` (0..1)
  - `radarStatus: "tracked" | "lost" | "unstable"`

## Sorties (résultat déterministe)
Un `SkillResult` :
- `skill`: `"detect_contact"`
- `summary`: phrase factuelle décrivant le contact ; mentionne explicitement une confiance radar faible le cas échéant.
- `confidence`: égale à `input.radarConfidence`.
- `flags`: `["low_radar_confidence"]` si `radarConfidence < 0.5`, sinon `[]`.
- `recommendedAction`: `"Demander une confirmation optronique."` si confiance faible, sinon `"Continuer le suivi."`.

## Contrat de verbalisation
Le cœur déterministe calcule `summary` (texte factuel). Hermes REFORMULE ce summary en message d'agent lisible, SANS inventer de fait, position ni action. En l'absence de backend, `summary` est affiché tel quel.

## Règles
- Univers fictif et pédagogique : aucune donnée militaire réelle.
- N'infère jamais d'hostilité à partir d'une simple détection.
- Exprime toujours l'incertitude : une confiance radar `< 0.5` déclenche le drapeau `low_radar_confidence` et une recommandation de croisement capteur (optronique).
- Aucune action offensive recommandée ; l'humain reste dans la boucle.

## Exemple
Scénario « Le suiveur discret » (drone-following-cargo), tour 3 : la confiance radar de C-042 chute à 0.42.

Entrée :
```json
{
  "contactId": "C-042",
  "rangeNm": 13.5,
  "bearingDeg": 168.69,
  "speedKnots": 14,
  "radarConfidence": 0.42,
  "radarStatus": "unstable"
}
```
Sortie :
```json
{
  "skill": "detect_contact",
  "summary": "Contact C-042 détecté mais la confiance radar est faible.",
  "confidence": 0.42,
  "flags": ["low_radar_confidence"],
  "recommendedAction": "Demander une confirmation optronique."
}
```
