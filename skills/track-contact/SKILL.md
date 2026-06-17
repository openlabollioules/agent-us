# Skill: track_contact

## Objectif
Analyse l'évolution d'un contact sur plusieurs tours en comparant les deux derniers points d'historique. Ne surinterprète pas un seul mouvement et signale un historique insuffisant.

## Entrées
- `contact: ContactTrack`
  - utilise `contact.id` et `contact.history` (liste de `ContactHistoryPoint` : `turn`, `position`, `speedKnots`, `headingDeg`).

## Sorties
Un `SkillResult` :
- `skill`: `"track_contact"`
- `summary`: décrit la stabilité ou un changement de mouvement notable.
- `confidence`: `0.3` si historique insuffisant ; `0.72` si anomalie ; `0.6` si stable.
- `flags`: `["insufficient_history"]` si moins de deux points ; `["trajectory_anomaly"]` si anomalie ; sinon `[]`.
- `recommendedAction`: suivre un tour de plus (historique insuffisant), analyser la cohérence via le NavigationAgent (anomalie), ou continuer la surveillance.

## Règles
- Univers fictif et pédagogique : aucune donnée réelle.
- Sans au moins deux points d'historique, aucune conclusion n'est tirée (`insufficient_history`, confiance `0.3`).
- Une anomalie est détectée si la variation de cap `> 25°` OU la variation de vitesse `> 8 kn` entre les deux derniers points.
- Une anomalie est un indicateur, pas une preuve : aucune inférence d'hostilité, aucune action offensive.
- L'humain reste dans la boucle.

## Exemple
Entrée :
```json
{
  "id": "C-042",
  "label": "Contact 042",
  "category": "unknown",
  "affiliation": "unknown",
  "position": { "x": 14.2, "y": -3.1 },
  "speedKnots": 18.0,
  "headingDeg": 80,
  "history": [
    { "turn": 3, "position": { "x": 12.0, "y": -2.0 }, "speedKnots": 9.0, "headingDeg": 45 },
    { "turn": 4, "position": { "x": 14.2, "y": -3.1 }, "speedKnots": 18.0, "headingDeg": 80 }
  ],
  "radarConfidence": 0.6,
  "aisConfidence": 0.4,
  "optronicConfidence": 0.5,
  "suspicionScore": 0.5,
  "flags": []
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
