# Skill: estimate_confidence

## Subagent propriétaire
RadarAgent et OptronicAgent (skill partagée)

## Accès MCP (outils)
- RadarMCP — `getObservation(state, contactId)` (côté RadarAgent : fournit `radarConfidence`).
- OptronicMCP — `getObservation(state, contactId)` (côté OptronicAgent : fournit `imageQuality`).
- La skill agrège des niveaux de confiance issus des différents capteurs ; elle ne consulte aucun MCP par elle-même.

## Objectif
Combine plusieurs niveaux de confiance capteur en une confiance moyenne. Une confiance faible doit déclencher un croisement de sources.

## Entrées
- `values: number[]` (liste de confiances 0..1)

## Sorties (résultat déterministe)
Un `SkillResult` :
- `skill`: `"estimate_confidence"`
- `summary`: confiance combinée en pourcentage, ou message d'absence de valeur.
- `confidence`: moyenne arrondie à deux décimales (`round2`) ; `0` si la liste est vide.
- `flags`: `["low_confidence"]` (drapeau d'**analyse** `AnalysisFlag`) si la moyenne `< 0.5` ; sinon `[]`. Liste vide → `[]`.
- `recommendedAction`: si confiance faible, demander une confirmation croisée entre capteurs ; sinon utiliser cette confiance dans l'évaluation ; si liste vide, recueillir davantage d'observations.

## Contrat de verbalisation
Le cœur déterministe calcule `summary` (texte factuel). Hermes REFORMULE ce summary en message d'agent lisible, SANS inventer de fait, position ni action. En l'absence de backend, `summary` est affiché tel quel.

## Règles
- Univers fictif et pédagogique : aucune donnée réelle.
- `low_confidence` est un drapeau d'**analyse** (`AnalysisFlag`), pas un `ContactFlag`.
- Une moyenne `< 0.5` impose un croisement de sources avant toute conclusion (l'incertitude est explicite).
- Une liste vide ne produit aucune conclusion (confiance `0`, aucun drapeau).
- Aucune action offensive ; l'humain reste dans la boucle.

## Exemple
Scénario « Le suiveur discret », tour 3 : combinaison de la confiance radar (0.42) et de la confiance optronique (0.4) de C-042.

Entrée :
```json
{ "values": [0.42, 0.4] }
```
Sortie :
```json
{
  "skill": "estimate_confidence",
  "summary": "Confiance combinée : 41 %.",
  "confidence": 0.41,
  "flags": ["low_confidence"],
  "recommendedAction": "Demander une confirmation croisée entre capteurs."
}
```
