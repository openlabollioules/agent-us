# Skill: generate_pedagogical_explanation

## Objectif
Explique en mots simples un concept de surveillance maritime, relié à ce que le joueur a observé sur le contact.

## Entrées
- `contact: ContactTrack` (utilise `contact.flags`)

## Sorties
Une `string` (texte pédagogique), choisie selon les drapeaux, dans cet ordre de priorité :
1. `constant_distance_following` -> explication sur le suivi discret (« indice à vérifier », pas une preuve).
2. `ais_route_mismatch` -> explication sur l'AIS déclaratif (erreur, panne ou comportement ambigu).
3. `possible_false_positive` ou `radar_contact_lost` -> explication sur la perte radar (pas forcément un contact qui se cache).
4. Par défaut -> rappel d'incertitude et nécessité de croiser plusieurs sources.

## Règles
- Univers fictif et pédagogique : aucune donnée réelle.
- Chaque explication insiste sur l'incertitude : les indices ne sont jamais des preuves.
- Aucune inférence d'hostilité, aucune action offensive.
- Toujours encourager le croisement de sources et la décision humaine ; l'humain reste dans la boucle.

## Exemple
Entrée :
```json
{ "flags": ["constant_distance_following"] }
```
Sortie :
```json
"Un contact qui garde une distance presque constante avec un navire civil peut indiquer un comportement de suivi discret. Ce n'est pas une preuve, mais un indice à vérifier."
```
