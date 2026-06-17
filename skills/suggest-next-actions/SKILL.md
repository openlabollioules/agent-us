# Skill: suggest_next_actions

## Objectif
Propose des actions « human-in-the-loop » pertinentes selon l'état tactique courant. Les suggestions aident le débutant sans jamais le forcer et expliquent toujours leur intérêt. Limitées à 5.

## Entrées
- `state: TacticalState` (parcourt `state.contacts` : leurs `flags` et `suspicionScore`)

## Sorties
Un tableau `SuggestedAction[]` (au maximum 5, via `slice(0, 5)`). Chaque `SuggestedAction` :
- `id`, `label`, `description`, `targetAgentId`, `skillName?`, `priority`, `difficulty`, `promptTemplate`.

Règles de génération (une suggestion ajoutée par condition vraie, dans cet ordre, pour chaque contact) :
- `low_radar_confidence` -> « Demander confirmation optronique » (`classify_surface_contact`, priorité `high`, niveau `beginner`).
- `ais_route_mismatch` -> « Comparer avec l'AIS » (`compare_ais_route`, priorité `high`, niveau `beginner`).
- `constant_distance_following` -> « Analyser le suivi discret » (`detect_abnormal_trajectory`, priorité `high`, niveau `intermediate`).
- `suspicionScore > 0.65` -> « Demander une synthèse de suspicion » (`estimate_threat_level`, priorité `medium`, niveau `intermediate`).
- `possible_false_positive` -> « Réduire l'incertitude » (`estimate_confidence`, priorité `medium`, niveau `intermediate`).

## Règles
- Univers fictif et pédagogique : aucune donnée réelle.
- Les suggestions sont des propositions, jamais des ordres : elles expliquent toujours leur intérêt (`description`).
- Aucune action offensive proposée ; toutes orientent vers une analyse, une comparaison ou une réduction d'incertitude.
- L'humain reste dans la boucle et garde la décision finale.

## Exemple
Entrée :
```json
{
  "simulationId": "sim-1",
  "turn": 5,
  "scenarioId": "drone-following-cargo",
  "status": "awaiting_player",
  "contacts": [
    {
      "id": "C-042",
      "flags": ["low_radar_confidence", "constant_distance_following"],
      "suspicionScore": 0.7
    }
  ],
  "events": [],
  "agentMessages": [],
  "suggestedActions": [],
  "playerActions": []
}
```
Sortie :
```json
[
  {
    "id": "ask-optronic-C-042",
    "label": "Demander confirmation optronique",
    "description": "Quand la confiance radar baisse, une observation visuelle peut réduire l'incertitude.",
    "targetAgentId": "optronic-agent",
    "skillName": "classify_surface_contact",
    "priority": "high",
    "difficulty": "beginner",
    "promptTemplate": "OptronicAgent, peux-tu confirmer la classification du contact C-042 ?"
  },
  {
    "id": "analyze-following-C-042",
    "label": "Analyser le suivi discret",
    "description": "Un contact qui garde une distance stable avec un autre peut indiquer un comportement de suivi.",
    "targetAgentId": "navigation-agent",
    "skillName": "detect_abnormal_trajectory",
    "priority": "high",
    "difficulty": "intermediate",
    "promptTemplate": "NavigationAgent, analyse si C-042 suit discrètement un autre contact."
  },
  {
    "id": "threat-summary-C-042",
    "label": "Demander une synthèse de suspicion",
    "description": "Quand plusieurs indices convergent, une synthèse aide à décider.",
    "targetAgentId": "threat-assessment-agent",
    "skillName": "estimate_threat_level",
    "priority": "medium",
    "difficulty": "intermediate",
    "promptTemplate": "ThreatAssessmentAgent, fais une synthèse du niveau de suspicion pour C-042."
  }
]
```
