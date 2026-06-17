# Skill: classify_surface_contact

## Objectif
Classe un objet maritime à partir d'une observation optronique (visuelle/thermique). La classification reste probabiliste et mentionne la qualité d'image.

## Entrées
- `obs: OptronicObservation`
  - `contactId: string`
  - `thermalSignature: "low" | "medium" | "compact_hot_spot"`
  - `shape: "large_hull" | "low_profile_object" | "unknown"`
  - `imageQuality: number` (0..1)
  - `classificationHint: "cargo" | "fishing_vessel" | "surface_vessel" | "usv_drone" | "small_surface_object" | "unknown"`

## Sorties
Un `SkillResult` :
- `skill`: `"classify_surface_contact"`
- `summary`: classification probable + qualité d'image en pourcentage (`Math.round(imageQuality * 100)`).
- `confidence`: égale à `imageQuality`.
- `flags`: `["small_object_near_civilian"]` si `classificationHint === "small_surface_object"`, sinon `[]`.
- `recommendedAction`: si `imageQuality < 0.5`, continuer le suivi et demander une nouvelle observation ; sinon utiliser la classification dans la synthèse de suspicion.

## Règles
- Univers fictif et pédagogique : aucune donnée réelle.
- La classification est toujours présentée comme « probable » et accompagnée de la qualité d'image.
- Une image de faible qualité (`< 0.5`) impose de relancer une observation avant de conclure.
- Aucune inférence d'hostilité, aucune action offensive ; l'humain reste dans la boucle.

## Exemple
Entrée :
```json
{
  "contactId": "C-042",
  "thermalSignature": "compact_hot_spot",
  "shape": "low_profile_object",
  "imageQuality": 0.62,
  "classificationHint": "small_surface_object"
}
```
Sortie :
```json
{
  "skill": "classify_surface_contact",
  "summary": "Classification probable pour C-042 : small_surface_object. Qualité d'image : 62 %.",
  "confidence": 0.62,
  "flags": ["small_object_near_civilian"],
  "recommendedAction": "Utiliser cette classification dans la synthèse de suspicion."
}
```
