# Skill: compare_ais_route

## Subagent propriétaire
NavigationAgent

## Accès MCP (outils)
- AISMCP — `getAISData(state, contactId)` retourne une `AISData` (`contactId`, `shipName?`, `declaredType?`, `declaredRoute?`, `declaredRouteStatus`). Le statut vaut `missing` si le contact porte le drapeau `ais_missing`, `mismatch` s'il porte `ais_route_mismatch`, sinon `normal`.

## Objectif
Compare la route observée d'un contact avec sa route AIS déclarée. L'AIS étant déclaratif, une incohérence n'est pas automatiquement une menace.

## Entrées
- `contact: ContactTrack` (utilise `contact.id`)
- `ais: AISData`
  - `contactId: string`
  - `shipName?: string`
  - `declaredType?: string`
  - `declaredRoute?: string`
  - `declaredRouteStatus: "normal" | "mismatch" | "missing"`

## Sorties (résultat déterministe)
Un `SkillResult` :
- `skill`: `"compare_ais_route"`
- `summary`: route AIS absente, incohérence observée, ou cohérence avec l'AIS.
- `confidence`: `0.82` si `mismatch` ; `0.55` si `missing` ; `0.65` si `normal`.
- `flags`: `["ais_route_mismatch"]` si `mismatch` ; `["ais_missing"]` si `missing` ; sinon `[]`.
- `recommendedAction`: en cas de `mismatch`, demander au ThreatAssessmentAgent d'intégrer l'incohérence à l'analyse ; sinon `"Continuer la surveillance."`.

## Contrat de verbalisation
Le cœur déterministe calcule `summary` (texte factuel). Hermes REFORMULE ce summary en message d'agent lisible, SANS inventer de fait, position ni action. En l'absence de backend, `summary` est affiché tel quel.

## Règles
- Univers fictif et pédagogique : aucune donnée réelle.
- L'AIS est une information déclarée : une incohérence (`mismatch`) ou une absence (`missing`) reste un indice, jamais une preuve d'hostilité.
- L'incertitude est toujours exprimée via les drapeaux et les niveaux de confiance.
- Aucune action offensive ; l'humain reste dans la boucle.

## Exemple
Scénario « La route qui ment » (ais-route-mismatch), tour 5 : le cargo Star Horizon (C-014) dévie de sa route AIS déclarée.

Entrée :
```json
{
  "contact": { "id": "C-014" },
  "ais": {
    "contactId": "C-014",
    "shipName": "Star Horizon",
    "declaredType": "cargo",
    "declaredRoute": "Route commerciale déclarée (fictive)",
    "declaredRouteStatus": "mismatch"
  }
}
```
Sortie :
```json
{
  "skill": "compare_ais_route",
  "summary": "La trajectoire observée de C-014 diffère de sa route AIS déclarée.",
  "confidence": 0.82,
  "flags": ["ais_route_mismatch"],
  "recommendedAction": "Demander au ThreatAssessmentAgent d'intégrer cette incohérence à l'analyse."
}
```
