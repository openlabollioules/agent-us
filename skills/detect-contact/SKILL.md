# Skill: detect_contact

## Objectif
Décrit un contact radar simulé et signale l'incertitude liée à la confiance radar. N'infère jamais d'hostilité.

## Entrées
- `input: RadarObservation`
  - `contactId: string`
  - `rangeNm: number`
  - `bearingDeg: number`
  - `speedKnots: number`
  - `radarConfidence: number` (0..1)
  - `radarStatus: "tracked" | "lost" | "unstable"`

## Sorties
Un `SkillResult` :
- `skill`: `"detect_contact"`
- `summary`: phrase décrivant le contact ; mentionne explicitement une confiance faible le cas échéant.
- `confidence`: égale à `radarConfidence`.
- `flags`: `["low_radar_confidence"]` si `radarConfidence < 0.5`, sinon `[]`.
- `recommendedAction`: `"Demander une confirmation optronique."` si confiance faible, sinon `"Continuer le suivi."`.

## Règles
- Univers fictif et pédagogique : aucune donnée militaire réelle.
- N'infère jamais d'hostilité à partir d'une simple détection.
- Exprime toujours l'incertitude : une confiance radar `< 0.5` déclenche le drapeau `low_radar_confidence` et une recommandation de croisement capteur (optronique).
- Aucune action offensive recommandée ; l'humain reste dans la boucle.

## Exemple
Entrée :
```json
{
  "contactId": "C-042",
  "rangeNm": 12.4,
  "bearingDeg": 137,
  "speedKnots": 9.5,
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
