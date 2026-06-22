# Skill: check_area_proximity

## Subagent propriétaire
NavigationAgent

## Accès MCP (outils)
- GeoMCP — `getProximity(state, contactId)` retourne un `AreaProximityReport` (`contactId`, `nearestAreaId?`, `nearestAreaLabel?`, `distanceToEdgeUnits`, `isInside`, `isNear`). Géométrie pure et déterministe, dérivée de `state.sensitiveAreas` et de la position du contact.

## Objectif
Qualifie la position d'un contact par rapport aux zones sensibles déclarées. Être proche ou à l'intérieur n'est pas une preuve, mais un contact qui s'attarde au bord d'une zone sensible justifie une surveillance accrue.

## Entrées
- `input: AreaProximityReport`
  - `contactId: string`
  - `nearestAreaId?: string`
  - `nearestAreaLabel?: string`
  - `distanceToEdgeUnits: number` (unités carte ; `<0` = à l'intérieur)
  - `isInside: boolean`
  - `isNear: boolean`

## Sorties (résultat déterministe)
Un `SkillResult` :
- `skill`: `"check_area_proximity"`
- `summary`: situe le contact (à l'intérieur / proche du bord / à distance) de la zone la plus proche.
- `confidence`: `0.7` si une zone est concernée, sinon `1`.
- `flags`: `["near_sensitive_area"]` si `isNear`, sinon `[]`.
- `recommendedAction`: vérifier transit vs stationnement (loitering) si proche/à l'intérieur.

## Contrat de verbalisation
Le cœur déterministe calcule `summary` (texte factuel). Hermes REFORMULE ce summary en message d'agent lisible, SANS inventer de fait, position ni action. En l'absence de backend, `summary` est affiché tel quel.

## Règles
- Univers fictif et pédagogique : aucune donnée militaire réelle ; zones sensibles fictives.
- La proximité est un indice contextuel, pas une preuve d'intention.
- Distinguer un transit (traverse) d'un stationnement (reste/tourne en boucle).
- Aucune action offensive recommandée ; l'humain reste dans la boucle.

## Exemple
Scénario « Le rôdeur du seuil » (drone-near-sensitive-area), tour 5 : C-330 maintient une distance constante au bord de la zone « AREA-N ».

Entrée :
```json
{
  "contactId": "C-330",
  "nearestAreaId": "AREA-N",
  "nearestAreaLabel": "Seuil portuaire (zone sensible)",
  "distanceToEdgeUnits": 42,
  "isInside": false,
  "isNear": true
}
```
Sortie :
```json
{
  "skill": "check_area_proximity",
  "summary": "C-330 se trouve à 42 unités du bord de la zone « Seuil portuaire (zone sensible) ».",
  "confidence": 0.7,
  "flags": ["near_sensitive_area"],
  "recommendedAction": "Vérifier s'il transite ou s'il s'attarde (loitering) au bord de la zone."
}
```
