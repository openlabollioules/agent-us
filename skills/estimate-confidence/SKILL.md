# Skill: estimate_confidence

## Objectif
Combine plusieurs niveaux de confiance capteur en une confiance moyenne. Une confiance faible doit déclencher un croisement de sources.

## Entrées
- `values: number[]` (liste de confiances 0..1)

## Sorties
Un `SkillResult` :
- `skill`: `"estimate_confidence"`
- `summary`: confiance combinée en pourcentage, ou message d'absence de valeur.
- `confidence`: moyenne arrondie à deux décimales (`round2`) ; `0` si la liste est vide.
- `flags`: `["low_confidence"]` (drapeau d'analyse `AnalysisFlag`) si la moyenne `< 0.5` ; sinon `[]`. Liste vide -> `[]`.
- `recommendedAction`: si confiance faible, demander une confirmation croisée entre capteurs ; sinon utiliser cette confiance dans l'évaluation ; si liste vide, recueillir davantage d'observations.

## Règles
- Univers fictif et pédagogique : aucune donnée réelle.
- `low_confidence` est un drapeau d'**analyse** (`AnalysisFlag`), pas un `ContactFlag`.
- Une moyenne `< 0.5` impose un croisement de sources avant toute conclusion (l'incertitude est explicite).
- Une liste vide ne produit aucune conclusion (confiance `0`, aucun drapeau).
- Aucune action offensive ; l'humain reste dans la boucle.

## Exemple
Entrée :
```json
{ "values": [0.4, 0.3] }
```
Sortie :
```json
{
  "skill": "estimate_confidence",
  "summary": "Confiance combinée : 35 %.",
  "confidence": 0.35,
  "flags": ["low_confidence"],
  "recommendedAction": "Demander une confirmation croisée entre capteurs."
}
```
