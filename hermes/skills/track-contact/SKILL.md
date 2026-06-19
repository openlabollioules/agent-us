# Skill: track_contact

## Subagent propriétaire
RadarAgent et NavigationAgent (skill partagée)

## Accès MCP (outils)
- RadarMCP — `getObservation(state, contactId)` (côté RadarAgent, pour rafraîchir vitesse/position).
- AISMCP — `getAISData(state, contactId)` (côté NavigationAgent, pour relier la trajectoire à la route déclarée).
- La skill consomme directement le `contact.history` du `TacticalState` (deux derniers points).

## Objectif
Analyse l'évolution d'un contact sur plusieurs tours en comparant les deux derniers points d'historique. Ne surinterprète pas un seul mouvement et signale un historique insuffisant.

## Entrées
- `contact: ContactTrack`
  - utilise `contact.id` et `contact.history` (liste de `ContactHistoryPoint` : `turn`, `position`, `speedKnots`, `headingDeg`).

## Sorties (résultat déterministe)
Un `SkillResult` :
- `skill`: `"track_contact"`
- `summary`: décrit la stabilité de la trajectoire ou un changement de mouvement notable.
- `confidence`: `0.3` si historique insuffisant ; `0.72` si anomalie ; `0.6` si stable.
- `flags`: `["insufficient_history"]` si moins de deux points ; `["trajectory_anomaly"]` si anomalie ; sinon `[]`.
- `recommendedAction`: suivre un tour de plus (historique insuffisant), demander au NavigationAgent d'analyser la cohérence de la trajectoire (anomalie), ou continuer la surveillance.

## Contrat de verbalisation
Le cœur déterministe calcule `summary` (texte factuel). Hermes REFORMULE ce summary en message d'agent lisible, SANS inventer de fait, position ni action. En l'absence de backend, `summary` est affiché tel quel.

## Règles
- Univers fictif et pédagogique : aucune donnée réelle.
- Sans au moins deux points d'historique, aucune conclusion n'est tirée (`insufficient_history`, confiance `0.3`).
- Une anomalie est détectée si la variation de cap `> 25°` OU la variation de vitesse `> 8 kn` entre les deux derniers points.
- Une anomalie est un indicateur, pas une preuve : aucune inférence d'hostilité, aucune action offensive.
- L'humain reste dans la boucle.

## Exemple
Scénario « Le suiveur discret », C-042 entre les tours 3 et 4 (ajustement de cap pour devenir parallèle au cargo).

Entrée :
```json
{
  "id": "C-042",
  "label": "Contact inconnu",
  "category": "usv_drone",
  "affiliation": "unknown",
  "position": { "x": 300, "y": 770 },
  "speedKnots": 14,
  "headingDeg": 55,
  "history": [
    { "turn": 3, "position": { "x": 300, "y": 770 }, "speedKnots": 14, "headingDeg": 85 },
    { "turn": 4, "position": { "x": 320, "y": 790 }, "speedKnots": 14, "headingDeg": 55 }
  ],
  "radarConfidence": 0.42,
  "aisConfidence": 0,
  "optronicConfidence": 0.4,
  "suspicionScore": 0.5,
  "flags": ["low_radar_confidence", "trajectory_anomaly"]
}
```
Sortie :
```json
{
  "skill": "track_contact",
  "summary": "Le contact C-042 présente un changement de mouvement notable.",
  "confidence": 0.72,
  "flags": ["trajectory_anomaly"],
  "recommendedAction": "Demander au NavigationAgent d'analyser la cohérence de la trajectoire."
}
```
