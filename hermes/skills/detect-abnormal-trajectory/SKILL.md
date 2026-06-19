# Skill: detect_abnormal_trajectory

## Subagent propriétaire
NavigationAgent et ThreatAssessmentAgent (skill partagée)

## Accès MCP (outils)
- AISMCP — `getAISData(state, contactId)` (côté NavigationAgent, pour croiser l'anomalie avec la route déclarée).
- RadarMCP / OptronicMCP — `getObservation(state, contactId)` (côté ThreatAssessmentAgent, pour la fusion). La skill lit directement `contact.flags` du `TacticalState`.

## Objectif
Détecte un comportement de mouvement inhabituel à partir des drapeaux déjà attachés au contact. Une anomalie est un indicateur, pas une preuve.

## Entrées
- `contact: ContactTrack` (utilise `contact.id` et `contact.flags`)

## Sorties (résultat déterministe)
Un `SkillResult` :
- `skill`: `"detect_abnormal_trajectory"`
- `summary`: liste les drapeaux anormaux détectés (joints par `, `), ou indique l'absence d'anomalie significative.
- `confidence`: `0.78` si au moins un drapeau anormal ; `0.55` sinon.
- `flags`: l'intersection des drapeaux du contact avec les drapeaux anormaux considérés — les drapeaux précis sont conservés (jamais écrasés par un `trajectory_anomaly` générique).
- `recommendedAction`: comparer avec l'AIS et demander une synthèse de suspicion (anomalie), ou continuer la surveillance.

## Contrat de verbalisation
Le cœur déterministe calcule `summary` (texte factuel). Hermes REFORMULE ce summary en message d'agent lisible, SANS inventer de fait, position ni action. En l'absence de backend, `summary` est affiché tel quel.

## Règles
- Univers fictif et pédagogique : aucune donnée réelle.
- Drapeaux considérés comme anormaux : `constant_distance_following`, `ais_route_mismatch`, `trajectory_anomaly`.
- Les drapeaux précis détectés sont conservés tels quels dans la sortie (filtre sur l'ensemble anormal, ordre préservé).
- Une anomalie est un indice à vérifier (croiser l'AIS, demander une synthèse), jamais une preuve d'hostilité ni un déclencheur d'action offensive.
- L'humain reste dans la boucle.

## Exemple
Scénario « Le suiveur discret », tour 5 : C-042 porte plusieurs drapeaux dont un seul anormal au sens de cette skill.

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
