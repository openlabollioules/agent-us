# Contrat maritime-scene/1

La spécification exécutable est [schema.ts](schema.ts). Tous les objets sont stricts, les nombres finis, les identifiants bornés ; les identifiants de contact sont uniques. Le renderer C++ revérifie les champs avant de remplacer la scène. Le contrat contient uniquement la présentation courante, aucune décision d’agent ou réponse de diagnostic.

## Repère et temps

- JSON : mètres, X est, Y sud, Z haut ; Unreal : mêmes axes, valeurs multipliées par 100. Un mesh a son étrave vers +X.
- Projection Agent Us : `x=(map.x−500)*10`, `y=(map.y−500)*10`. Il s’agit d’un espace fictif, sans coordonnées géographiques réelles.
- Cap : 0° nord, 90° est ; rotation Unreal `yaw=headingDeg−90`.
- Le déplacement existant vaut `speedKnots*2` unités par tour ; avec cette échelle visuelle, `timeSeconds=turn*20/(1852/3600)`, soit environ 38,88 secondes par tour. Ce temps d’exercice ne dépend pas du temps d’attente du joueur.
- `position.z` vient exclusivement d’une altitude/profondeur scénarisée connue. Les pistes sous-marines non confirmées restent des repères à Z=0, sans profondeur inventée.
- Les paramètres météo sont des presets de présentation associés à `TacticalState.weather`, pas des mesures réelles ni de nouveaux indices.

## HTTP local

| Requête | Réponse / effet |
| --- | --- |
| `GET /health` | `{protocol:"maritime-scene/1",rendererReady:boolean}` ; heartbeat renderer inférieur à 4 s |
| `POST /frame` | Corps `{owner,revision,snapshot,camera}` ; 200 accepté, 400 invalide, 409 session occupée/révision ancienne, 413 trop gros |
| `GET /frame` | Réservé au renderer natif avec `X-Maritime-Renderer: 1` ; `{generation,frame}` ; frame null après libération/expiration |
| `DELETE /frame` | En-tête `X-Scene-Owner` ; libère seulement la session correspondante |

`owner` est un identifiant aléatoire de session de présentation (pas un identifiant tactique). `revision` croît à chaque changement d’état ou de caméra, y compris au même tour. Une répétition de la même révision renouvelle le bail mais ne modifie pas la scène. Bail : 8 s ; publication du client : 200 ms, une seule requête en vol. Limite : 2 Mio. Les dates de heartbeat appartiennent au transport, pas à la simulation déterministe.

Une origine web non autorisée est refusée. `SCENE_ORIGINS` configure une liste exacte séparée par virgules, par défaut `http://localhost:3000,http://127.0.0.1:3000`. Les requêtes natives n’ont pas d’en-tête Origin. Le header renderer distingue les sondes de navigateur des lectures natives ; ce n’est **pas un mécanisme d’authentification réseau**. Le serveur écoute uniquement `127.0.0.1`; `SCENE_PORT` change le port.

## Caméra et vidéo

`camera` contient `auto`, `targetId` optionnel, `yawDeg`, `pitchDeg`, `distanceM`, `altitudeOffsetM`. Valeurs absolues pour rendre les retries idempotents. Si `auto=true`, le moteur calcule la distance et l’inclinaison à partir du focus ; l’état tactique ne change jamais.

Le lecteur iframe poste `{type:"maritime-stream",status:"playing"}` une fois par seconde uniquement si le temps vidéo progresse. Le parent vérifie **l’origine et la fenêtre source**. Délai initial : 30 s ; perte après démarrage : 8 s. Un serveur HTTP joignable sans vidéo ne suffit donc pas à maintenir la vue 3D. La connexion WebRTC et les gestes nécessaires à l’autoplay sont gérés par le client officiel Epic.
