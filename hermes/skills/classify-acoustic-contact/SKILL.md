# Skill: classify_acoustic_contact

## Subagent propriétaire
RadarAgent

## Accès MCP (outils)
- AcousticMCP — `getReportForContact(state, contactId)` retourne un `AcousticReport` (`hasTrack`, `trackId?`, `bearingDeg?`, `classification?`, `confidence`) dérivé de `state.acousticContacts`. L'acoustique fournit un relèvement et une classification incertaine, pas une position.

## Objectif
Interprète une piste acoustique corrélée à un contact. Un contact tenu uniquement à l'acoustique (ni radar de surface, ni AIS, ni visuel) peut être immergé : c'est un faisceau d'indices, jamais une preuve.

## Entrées
- `input: AcousticReport`
  - `hasTrack: boolean`
  - `trackId?: string`
  - `bearingDeg?: number`
  - `classification?: "biologic" | "surface_traffic" | "submerged" | "unknown"`
  - `confidence: number` (0..1 ; 0 si aucune piste)

## Sorties (résultat déterministe)
Un `SkillResult` :
- `skill`: `"classify_acoustic_contact"`
- `summary`: relèvement + classification + confiance, ou absence de piste.
- `confidence`: égale à `input.confidence`.
- `flags`: `["acoustic_only"]` si `classification === "submerged"`, sinon `[]`.
- `recommendedAction`: croiser radar/optronique si immergé ; sinon confirmer la classification.

## Contrat de verbalisation
Le cœur déterministe calcule `summary` (texte factuel). Hermes REFORMULE ce summary en message d'agent lisible, SANS inventer de fait, position ni action. En l'absence de backend, `summary` est affiché tel quel.

## Règles
- Univers fictif et pédagogique : aucune donnée militaire réelle.
- L'acoustique oriente (relèvement), elle ne localise pas : exprime l'incertitude.
- « Immergé » suggère un possible contact sous-marin à confirmer par croisement, jamais une certitude.
- Aucune action offensive recommandée ; l'humain reste dans la boucle.

## Exemple
Scénario « L'ombre sous la surface » (submarine-contact), tour 3 : C-440 a plongé, la piste acoustique AC-1 se précise.

Entrée :
```json
{
  "hasTrack": true,
  "trackId": "AC-1",
  "bearingDeg": 295,
  "classification": "submerged",
  "confidence": 0.6
}
```
Sortie :
```json
{
  "skill": "classify_acoustic_contact",
  "summary": "Piste acoustique au relèvement 295° : contact immergé (confiance 60 %).",
  "confidence": 0.6,
  "flags": ["acoustic_only"],
  "recommendedAction": "Croiser avec radar et optronique : faisceau possible de contact sous-marin."
}
```
