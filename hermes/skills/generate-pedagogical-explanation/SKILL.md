# Skill: generate_pedagogical_explanation

## Subagent propriétaire
ThreatAssessmentAgent

## Accès MCP (outils)
- RadarMCP, AISMCP, OptronicMCP — le ThreatAssessmentAgent dispose de ces accès pour contextualiser l'explication. La skill elle-même lit uniquement `contact.flags` du `TacticalState` et ne consulte aucun MCP.

## Objectif
Explique en mots simples un concept de surveillance maritime, relié à ce que le joueur a observé sur le contact.

## Entrées
- `contact: ContactTrack` (utilise `contact.flags`)

## Sorties (résultat déterministe)
Une `string` (texte pédagogique), choisie selon les drapeaux, dans cet ordre de priorité :
1. `constant_distance_following` → explication sur le suivi discret (« indice à vérifier », pas une preuve).
2. `ais_route_mismatch` → explication sur l'AIS déclaratif (erreur, panne ou comportement ambigu).
3. `possible_false_positive` ou `radar_contact_lost` → explication sur la perte radar (pas forcément un contact qui se cache).
4. Par défaut → rappel d'incertitude et nécessité de croiser plusieurs sources.

## Contrat de verbalisation
Le cœur déterministe renvoie directement une `string` pédagogique factuelle. Hermes peut la REFORMULER en message d'agent lisible, SANS inventer de fait, position ni action, et sans en altérer le sens (l'indice n'est jamais une preuve). En l'absence de backend, la chaîne est affichée telle quelle.

## Règles
- Univers fictif et pédagogique : aucune donnée réelle.
- Chaque explication insiste sur l'incertitude : les indices ne sont jamais des preuves.
- Aucune inférence d'hostilité, aucune action offensive.
- Toujours encourager le croisement de sources et la décision humaine ; l'humain reste dans la boucle.

## Exemple
Scénario « Le suiveur discret », tour 5 : C-042 porte le drapeau `constant_distance_following`.

Entrée :
```json
{ "flags": ["constant_distance_following"] }
```
Sortie :
```json
"Un contact qui garde une distance presque constante avec un navire civil peut indiquer un comportement de suivi discret. Ce n'est pas une preuve, mais un indice à vérifier."
```
