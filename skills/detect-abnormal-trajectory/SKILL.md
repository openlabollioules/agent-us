# Skill: detect_abnormal_trajectory

## Objectif
Détecte un comportement de mouvement inhabituel à partir des drapeaux déjà attachés au contact. Une anomalie est un indicateur, pas une preuve.

## Entrées
- `contact: ContactTrack` (utilise `contact.id` et `contact.flags`)

## Sorties
Un `SkillResult` :
- `skill`: `"detect_abnormal_trajectory"`
- `summary`: liste les drapeaux anormaux détectés, ou indique l'absence d'anomalie significative.
- `confidence`: `0.78` si au moins un drapeau anormal ; `0.55` sinon.
- `flags`: l'intersection des drapeaux du contact avec les drapeaux anormaux considérés — les drapeaux précis sont conservés (jamais écrasés par un `trajectory_anomaly` générique).
- `recommendedAction`: comparer avec l'AIS et demander une synthèse de suspicion (anomalie), ou continuer la surveillance.

## Règles
- Univers fictif et pédagogique : aucune donnée réelle.
- Drapeaux considérés comme anormaux : `constant_distance_following`, `ais_route_mismatch`, `trajectory_anomaly`.
- Les drapeaux précis détectés sont conservés tels quels dans la sortie.
- Une anomalie est un indice à vérifier (croiser l'AIS, demander une synthèse), jamais une preuve d'hostilité ni un déclencheur d'action offensive.
- L'humain reste dans la boucle.

## Exemple
Entrée :
```json
{
  "id": "C-042",
  "flags": ["constant_distance_following", "low_radar_confidence"]
}
```
Sortie :
```json
{
  "skill": "detect_abnormal_trajectory",
  "summary": "Le contact C-042 présente un comportement inhabituel : constant_distance_following.",
  "confidence": 0.78,
  "flags": ["constant_distance_following"],
  "recommendedAction": "Comparer avec l'AIS et demander une synthèse de suspicion."
}
```
