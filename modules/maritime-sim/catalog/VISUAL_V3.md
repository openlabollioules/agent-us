# Révision visuelle 3 — sources et reproduction

Le périmètre est le rendu du module Unreal. Aucun changement dans le moteur de jeu Agent Us, les agents, les scénarios ou le contrat `maritime-scene/1`.

## Revêtements et environnement

- Gris naval satiné avec microrelief, variations de peinture, coulures discrètes et effet mouillé. Une peinture sur acier reste diélectrique (`Metallic=0`) ; seules les pièces de métal nu ont une réponse métallique.
- Noir des sous-marins avec rugosité et humidité variables. Le motif de surface est artistique, sans prétendre reproduire des propriétés ou un assemblage de revêtement réel.
- Mer à quatre composantes de houle, petites rides, absorption, diffusion, reflets et écume. Le fichier `sea-spectrum.json` est partagé entre l'import de matériaux et la génération du code de mouvement C++.
- Roulis/tangage/soulèvement par échantillonnage du même spectre. Amplitude atténuée en immersion. Aucun déplacement prédit ; interpolation limitée aux deux positions reçues. Le rendu ne publie aucun état tactique.
- Sillages de surface tessellés uniquement pour les déplacements attestés dans les frames ; pas de sillage pour une cible inconnue ou profondément immergée. Rotor principal du VSR700 animé par matériau, fréquence artistique.
- Soleil en unités d'éclairage Unreal, exposition adaptative, teinte de lumière rasante, ciel atmosphérique et nuages volumétriques intégrés. La météo modifie l'humidité, l'intensité du soleil et le brouillard. Pas encore de pluie particulaire ni de couverture nuageuse pilotée par la météo.
- Côtes fictives continues, textures photographiques triplanaires, sable humide, rochers et écume au rivage. Aucune géographie militaire réelle.

## Textures photographiques

Les neuf cartes 2K (albédo, normale, rugosité) sont téléchargées par `scripts/fetch-pbr-textures.mjs`. Elles sont sous [CC0 — Poly Haven](https://polyhaven.com/license), utilisables et redistribuables avec le package. Les photos de navires servent uniquement de référence visuelle et ne sont pas plaquées sur les meshes.

| Texture | Auteur(s) | Usage |
|---|---|---|
| [Coast Sand Rocks 02](https://polyhaven.com/a/coast_sand_rocks_02) | Rob Tuytel | Plage et fond sableux |
| [Rock Boulder Dry](https://polyhaven.com/a/rock_boulder_dry) | Dimitrios Savva, Rico Cilliers | Rochers et pentes |
| [Aerial Grass Rock](https://polyhaven.com/a/aerial_grass_rock) | Rob Tuytel | Sol côtier et végétation basse |

Les téléchargements sont vérifiés contre taille et MD5 du fournisseur. Un manifeste local enregistre URLs, licence et SHA-256. L'import vérifie SHA-256 et convertit les normales OpenGL vers la convention Unreal en inversant le canal vert. Albédos sRGB ; normales et rugosités linéaires. Les textures et `.uasset` restent dans les répertoires ignorés ; une autre machine les régénère avec `update-visuals`.

## Identités visibles

| Modèle | Texte appliqué aux deux bords | Statut |
|---|---|---|
| Amiral Ronarc'h | D660, FDI, AMIRAL RONARCH | Numéro attesté par la [liste publique de la Marine](https://www.defense.gouv.fr/sites/default/files/marine/Liste%20navires%20MN.pdf) |
| Suffren | S635, SNA SUFFREN | Identité attestée par la [fiche de la Marine](https://www.defense.gouv.fr/marine/marins/marins-nucleaires-dattaque-sna-type-suffren) |
| Seaquest S/M/L | SEAQUEST S/M/L | Nom de modèle, sans numéro de coque inventé |
| Seagent M/XL | SEAGENT M/XL | Nom de modèle, sans numéro de coque inventé |
| France Libre | FRANCE LIBRE, PA-NG | Reconstruction du concept, sans numéro attesté |
| VSR700 | VSR700 | Type, sans immatriculation de prototype inventée |

Les familles Seaquest et Seagent sont celles du [catalogue public Naval Group](https://www.naval-group.com/en/drones). Les lettres sont une géométrie originale projetée sur la coque, éclairée comme de la peinture. La typographie, la disposition des sous-titres de type et l'affichage S635 sur le massif sont des choix de lisibilité de l'exercice, pas une affirmation que chaque photographie ou configuration réelle porte ces inscriptions. Plusieurs instances d'un modèle gardent le même marquage de référence ; les noms de contacts du jeu restent distincts. Une piste incertaine conserve son repère anonyme.

## Extensions Unreal

Aucune extension supplémentaire requise. Le rendu utilise les fonctions intégrées Lumen, Sky Atmosphere, Volumetric Cloud et Single Layer Water. Les plugins d'import déjà déclarés dans le projet suffisent. Aucun achat Fab, Water plugin ou plugin océan propriétaire n'est nécessaire pour cette révision. Les outils de compilation et GPU DX12/SM6 ou Vulkan/SM6 restent nécessaires, comme pour le module existant.

## Validation et limites

Validation locale du 7 septembre 2026 : compilation C++ `MaritimeSimEditor Win64 Development` réussie sous UE 5.8.2 ; 13 tests Node réussis ; import des 17 meshes et neuf textures terminé sans erreur. Le test PIE `check-appearance.py` a validé six comportements du renderer réel : houle visible, absence d'avance horizontale autonome, arrivée à la position reçue, présence du sillage après déplacement, modèle anonyme après perte d'identification, suppression de son sillage. Il utilise le RHI nul et une fixture HTTP privée sur le port 18787 ; il ne valide pas le rendu GPU.

```powershell
./modules/maritime-sim/scripts/render-lookdev.ps1 -EngineRoot 'G:/Program Files/Epic Games/UE_5.8' -RuntimeCheck
```

Rapport local : `generated/appearance-check.json`. Le test n'utilise pas la passerelle de votre partie sur 8787 et ne sauvegarde aucune carte.

`node --test scripts/visuals/geometry.test.mjs bridge/server.test.mjs` contrôle géométrie, normales, sens des marquages, continuité des anneaux océaniques et du spectre, ainsi que la passerelle. `render-lookdev.ps1` calcule les planches dans Unreal et vérifie la présence d'images non noires et l'absence d'erreurs de compilation des matériaux. Le manifeste donne la version du moteur et les caméras.

Les coefficients des matériaux, dimensions non publiées et mouvements sont artistiques. Le résultat nécessite encore une comparaison visuelle à plusieurs angles et une finition des petits détails pour prétendre à une fidélité photographique complète. Il n'y a pas de simulation de fluides, d'embruns volumétriques, de rotor secondaire animé ni de pluie particulaire. La compilation Windows ne prouve pas l'exécution sous Ubuntu ; les commandes Linux sont fournies pour qualification sur cette plateforme.
