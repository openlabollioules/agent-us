# Skill: estimate_threat_level

## Objectif
Estime un niveau de *suspicion* fictif à partir du score de suspicion du contact (jamais une certitude de menace). Ne recommande aucune action offensive ; l'humain conserve l'autorité de décision.

## Entrées
- `contact: ContactTrack` (utilise `contact.id` et `contact.suspicionScore`)

## Sorties
Un `SkillResult` :
- `skill`: `"estimate_threat_level"`
- `summary`: niveau de suspicion qualifié (`faible` / `moyen` / `élevé`).
- `confidence`: égale à `contact.suspicionScore`.
- `flags`: toujours `[]`.
- `recommendedAction`: si niveau `high`, proposer à l'opérateur humain de poser un diagnostic ; sinon continuer à recueillir des indices.

## Règles
- Univers fictif et pédagogique : aucune donnée réelle.
- On parle de **suspicion**, jamais de certitude de menace.
- Seuils qualitatifs : `high` si `suspicionScore >= 0.75` ; `medium` si `>= 0.45` ; sinon `low`.
- Aucune recommandation d'action offensive : le niveau élevé invite seulement l'humain à poser un diagnostic.
- L'humain conserve l'autorité de décision et reste dans la boucle.

## Exemple
Entrée :
```json
{ "id": "C-042", "suspicionScore": 0.82 }
```
Sortie :
```json
{
  "skill": "estimate_threat_level",
  "summary": "Niveau de suspicion pour C-042 : élevé.",
  "confidence": 0.82,
  "flags": [],
  "recommendedAction": "Proposer à l'opérateur humain de poser un diagnostic."
}
```
