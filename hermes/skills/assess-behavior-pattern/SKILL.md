# Skill: assess_behavior_pattern

## Subagent propriétaire
NavigationAgent

## Accès MCP (outils)
- Aucun MCP dédié : la skill lit directement le profil de comportement déduit (`state.behaviorProfiles`), produit de façon déterministe par le moteur via les `worldEffects` des scénarios.

## Objectif
Interprète le profil de comportement déduit pour un contact (transit, loitering, erratique, shadowing, pêche, plongée). Une faible cohérence signale un comportement *ambigu* : il faut alors éviter de conclure.

## Entrées
- `input: BehaviorProfile | undefined`
  - `contactId: string`
  - `pattern: "transit" | "loitering" | "erratic" | "shadowing" | "fishing" | "diving"`
  - `consistency: number` (0..1 ; faible = ambigu)
  - `note: string`

## Sorties (résultat déterministe)
Un `SkillResult` :
- `skill`: `"assess_behavior_pattern"`
- `summary`: décrit le motif, sa cohérence et la note ; signale l'absence de profil.
- `confidence`: égale à `consistency` (0 si aucun profil).
- `flags`: `["low_confidence"]` si `consistency < 0.6` ; `["insufficient_history"]` si aucun profil ; sinon `[]`.
- `recommendedAction`: surveiller sans conclure si ambigu ; intégrer le motif à la synthèse sinon.

## Contrat de verbalisation
Le cœur déterministe calcule `summary` (texte factuel). Hermes REFORMULE ce summary en message d'agent lisible, SANS inventer de fait, position ni action. En l'absence de backend, `summary` est affiché tel quel.

## Règles
- Univers fictif et pédagogique : aucune donnée militaire réelle.
- Un comportement ambigu (faible cohérence) n'est ni clairement normal ni clairement suspect : ne pas sur-interpréter.
- Rattacher un motif à une activité plausible (ex. trajectoire erratique ↔ pêche) avant de soupçonner.
- Aucune action offensive recommandée ; l'humain reste dans la boucle.

## Exemple
Scénario « Le pêcheur imprévisible » (fishing-vessel-ambiguous), tour 6 : gréement de pêche visible sur C-220, mais le classement reste peu sûr.

Entrée :
```json
{
  "contactId": "C-220",
  "pattern": "fishing",
  "consistency": 0.55,
  "note": "Gréement de pêche visible : activité de pêche probable, sans certitude."
}
```
Sortie :
```json
{
  "skill": "assess_behavior_pattern",
  "summary": "Comportement de C-220 : activité de pêche (cohérence 55 %). Gréement de pêche visible : activité de pêche probable, sans certitude.",
  "confidence": 0.55,
  "flags": ["low_confidence"],
  "recommendedAction": "Comportement ambigu : maintenir la surveillance sans conclure."
}
```
