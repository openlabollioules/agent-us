# Révision visuelle 4 — éclairage, matériaux et mouvements

Cette révision du 9 septembre 2026 concerne uniquement le visualiseur Unreal et ses outils. Agent Us, ses scénarios et `maritime-scene/1` restent inchangés. Les extérieurs restent des reconstructions à partir de références publiques ; les coefficients de réponse aux vagues sont artistiques, sans caractéristiques militaires réelles.

## Corrections des avertissements

| Message | Cause et correction |
|---|---|
| `[VSM] Non-nanite marking job queue overflow` | La côte opaque utilise maintenant Nanite. L'écume translucide est séparée dans `SM_surf`, et les anciens slots de matériau inutilisés sont retirés au réimport : un slot translucide résiduel suffisait à désactiver Nanite. La mer, le fond et les effets de surface ne projettent plus d'ombres. Les bâtiments opaques utilisent aussi Nanite. Les messages VSM restent activés. |
| `Cached lighting ... clipped`, exposition 13,5 EV | `r.EyeAdaptation.CachedLightingPreExposure=8` étend le domaine du cache à environ **[−4,16] EV**, au lieu de [−8,12]. Valeur vérifiée dans `PostProcessEyeAdaptation.cpp` de UE 5.8.2 installé. Ce réglage protège les calculs du cache ; il ne remplace pas l'exposition photographique de la caméra. |
| `Convex hull ... zero convex particles`, `TConvex ... has no Geometry` | L'import supprime les collisions des assets purement visuels, y compris les anciens volumes créés par Interchange sur les plans mer/fond. Désactiver la collision du composant seul ne suffisait pas à corriger les avertissements au cook. |
| Captures de contrôle noires | Les rotations Python utilisent désormais les arguments nommés `pitch`, `yaw`, `roll`. Leur ordre positionnel différait de celui du constructeur C++. L'outil utilise le viewport Unreal avec son historique Lumen et son exposition, puis exporte des PNG. |

Epic décrit pourquoi les [grandes surfaces non Nanite coûtent cher aux VSM](https://www.unrealengine.com/tech-blog/virtual-shadow-maps-in-fortnite-battle-royale-chapter-4). Les corrections portent sur la géométrie et les calculs, sans masquer les alertes.

## Mer et coques

- Le déplacement de la surface, ses grandes normales et les crêtes d'écume partagent les mêmes quatre vagues. Les petites rides sont filtrées selon la taille du pixel ; les directions et fréquences sont calculées à la génération du shader. Un bruit à plusieurs échelles remplace les motifs périodiques de l'écume de mer, des sillages et du rivage.
- La surface lointaine est prolongée et courbée pour rejoindre l'horizon atmosphérique. Les terres dépassent les bords de la carte fictive ; leurs collines et criques évitent les plateaux et limites rectangulaires de l'ancien relief. La projection des scans est déformée progressivement pour réduire les répétitions visibles.
- La mer suit la caméra par pas de 3,125 m au lieu de 100 m. Les limites verticales des meshes incluent explicitement le déplacement par les vagues ; multiplier les limites d'un plan parfaitement plat ne suffisait pas.
- Neuf points répartis sur la surface de flottaison donnent une inclinaison moyenne. Le soulèvement, le tangage et le roulis utilisent des réponses amorties distinctes, adaptées à la taille géométrique du modèle. Les longs bâtiments filtrent davantage les vagues courtes.
- La solution du ressort amorti est analytique : un ralentissement du rendu ne provoque pas d'explosion numérique. L'action de chaque vague diminue avec la profondeur des modèles immergés.
- L'horloge visuelle reste continue lors des changements de tour. La hauteur de houle change progressivement. Les positions reçues et les caps sont interpolés sans inventer une navigation après le dernier état reçu.
- Le sillage s'estompe après l'arrivée au dernier point reçu, au lieu de persister sur un bâtiment immobile. Les inscriptions sont subdivisées sur les coques courbes. `PositionPrecision=2` conserve un pas Nanite de **0,25 cm** : Unreal calcule ce pas avec `2^(-PositionPrecision)`, et la valeur inverse dégradait les inscriptions. L'audit vérifie aussi ce réglage.
- Les paramètres de matériau des coques sont actualisés lors des changements de scène, au lieu de parcourir tous les slots à chaque image.

Il s'agit d'une animation de présentation crédible, pas d'un solveur de tenue à la mer. Les sillages restent des effets de surface. Les embruns, la pluie particulaire, l'écoulement autour des étraves et la diffraction près des côtes demandent encore des développements dédiés.

## Textures et lumière

Quinze cartes 2K CC0 sont téléchargées, avec contrôle d'intégrité et manifeste local. Les neuf cartes côtières de [la révision 3](VISUAL_V3.md) sont conservées. S'y ajoutent :

| Scan public | Auteur | Usage visuel |
|---|---|---|
| [Metal Plate 02](https://polyhaven.com/a/metal_plate_02) | Rob Tuytel | Microrelief et variations modérées de rugosité des peintures et métaux |
| [Rubber Tiles](https://polyhaven.com/a/rubber_tiles) | Amal Kumar | Grain, usure légère et joints des revêtements noirs et ponts |

Ces scans génériques ne documentent pas les matériaux de vrais navires. Les couleurs rouillées du scan métallique ne sont pas appliquées aux coques : seule une variation faible de luminance module la peinture grise. Les peintures restent diélectriques ; le métal nu a son propre matériau. Le gris, l'exposition et la rugosité mouillée ont été rééquilibrés. La licence des scans est [CC0](https://polyhaven.com/license).

Les marquages D660/S635 et les noms de types de la révision 3 sont conservés. Leur placement pédagogique et les limites des références restent documentés dans [VISUAL_V3.md](VISUAL_V3.md).

## Installation et mise à jour

**Aucun nouveau plugin, achat Fab ou installation de Water n'est requis.** Nanite, Lumen, TSR, Single Layer Water, Sky Atmosphere et les nuages volumétriques sont intégrés à Unreal. Le plugin Water est une autre solution de surface et de flottabilité ; l'activer seul n'améliorerait pas ce renderer, qui possède déjà son spectre commun CPU/GPU.

Fermer Unreal et l'application du module, puis depuis la racine du dépôt :

```powershell
./modules/maritime-sim/scripts/update-visuals.ps1 -EngineRoot 'G:/Program Files/Epic Games/UE_5.8'
./modules/maritime-sim/scripts/build.ps1 -EngineRoot 'G:/Program Files/Epic Games/UE_5.8' -Package
```

`-Offline` sur `update-visuals` réutilise les textures déjà téléchargées. `-MaterialsOnly` sert aux itérations de matériaux après un import complet v4. La première conversion Nanite et la compilation des shaders peuvent prendre plusieurs minutes.

`setup_unreal.py` compare maintenant les empreintes des sources. Le build habituel met à jour les meshes générés qui ont changé au lieu de conserver silencieusement leur ancienne version. Les matériaux changés sont aussi reconstruits. Les assets remplacés sont sauvegardés une fois dans `/Game/Maritime/BackupBeforeExteriorV4/`, exclu du packaging. Les sauvegardes v2/v3 restent disponibles. Les sources visuelles doivent accompagner un retour à une ancienne sauvegarde.

La génération conserve la date de `MaritimeSea.h` si son contenu est identique : une modification de matériau n'impose plus à elle seule de recompiler le C++ des cibles Editor et Game. Les réglages de collision et Nanite sont appliqués par lot. Le package Windows cible DX12/SM6 ; la permutation DX11/SM5 inutile est retirée du cook.

Le traitement Nanite/collision exige un **éditeur** : utiliser `-ExecutePythonScript`, comme les scripts fournis, et non `-run=pythonscript` (commandlet sans `StaticMeshEditorSubsystem`). Le RHI nul convient à l'import, mais pas à la vérification visuelle.

Sous Ubuntu, commandes équivalentes :

```bash
export UE_ROOT=/opt/UnrealEngine-5.8
bash modules/maritime-sim/scripts/update-visuals.sh
bash modules/maritime-sim/scripts/build.sh --package
```

Ubuntu 24.04/26.04 doit encore être qualifié sur la machine cible. Pour compiler Linux depuis Windows, installer la [toolchain Epic v26 / clang 20.1.8](https://dev.epicgames.com/documentation/unreal-engine/linux-development-requirements-for-unreal-engine). Elle n'est pas nécessaire au package Windows.

## Autres messages des logs fournis

- `MSVC 14.51 ... not preferred` : le build a réussi. Pour utiliser la version préférée par cette installation UE, ajouter MSVC 14.50 dans Visual Studio Installer et sélectionner cette toolchain ; aucune désinstallation de 14.51 n'est nécessaire. Ce message ne dégrade pas directement le rendu.
- Les SDK Android, Apple et Linux absents sont recensés par `ValidatePlatforms -AllPlatforms`, même pendant un build Win64. Leur absence n'est pas une erreur de packaging Windows.
- L'absence de journal NTFS empêche un cache de découverte rapide des assets. Elle ne change pas les textures, les ombres ou la simulation ; aucun réglage administrateur du disque n'est requis pour ce correctif.
- `RenderDoc ... not loaded`, audio input absent et les lignes `Display` ne justifient pas d'installer des plugins pour améliorer l'image. Les messages d'initialisation de plugins internes sont distincts des erreurs de shaders et de cook du projet.

## Contrôles reproductibles

```powershell
node --test modules/maritime-sim/scripts/visuals/geometry.test.mjs modules/maritime-sim/bridge/server.test.mjs
./modules/maritime-sim/scripts/render-lookdev.ps1 -EngineRoot 'G:/Program Files/Epic Games/UE_5.8' -MotionTests
./modules/maritime-sim/scripts/render-lookdev.ps1 -EngineRoot 'G:/Program Files/Epic Games/UE_5.8' -RuntimeCheck
./modules/maritime-sim/scripts/render-lookdev.ps1 -EngineRoot 'G:/Program Files/Epic Games/UE_5.8' -GpuCheck
./modules/maritime-sim/scripts/render-lookdev.ps1 -EngineRoot 'G:/Program Files/Epic Games/UE_5.8'
```

Les tests natifs exécutent le véritable code C++ des réponses amorties. Le test PIE contrôle les contacts connus/incertains via une fixture privée. `-GpuCheck` exécute ces contrôles avec DX12, produit `generated/appearance-runtime.png` et consigne les intervalles d'images du monde éditeur. L'audit `generated/asset-audit.json` contrôle les collisions et les variantes de matériaux Nanite réellement enregistrées. Les captures et leur manifeste sont dans `generated/lookdev/` ; elles servent à vérifier les matériaux, les identités et l'éclairage. Ces contrôles ne constituent pas une mesure de FPS du package ou de latence Pixel Streaming.

Pour comparer qualité et coût en jeu, utiliser `stat unit`, `stat gpu` et les groupes `sg.GlobalIlluminationQuality` / `sg.ReflectionQuality` : **3 = Epic**, **2 = High**. Le [guide Epic sur Lumen](https://dev.epicgames.com/documentation/unreal-engine/lumen-performance-guide-for-unreal-engine) explique ces budgets. Les objectifs FPS d'Epic sur consoles ne constituent pas une garantie sur votre PC. Commencer à 1920×1080 avec TSR avant d'augmenter la résolution ou les réglages cinématiques.

## Résultats locaux du 9 septembre 2026

Machine : Windows 11, UE **5.8.2**, i7-4770, 32 Go de RAM, GeForce RTX 4060 Ti. Les contrôles ont été exécutés sur cette installation, sans modification du moteur de jeu Agent Us.

| Contrôle | Résultat |
|---|---|
| Géométrie, spectre commun et passerelle Node | **13 tests réussis** |
| Tests C++ `Maritime.Visual.Damping` et `WaterlineResponse` | **2 tests réussis** dans Unreal ; amortissement stable, réponse selon la taille et la profondeur, mer calme |
| Renderer C++ en PIE, RHI nul | **8 contrôles réussis**, fixture indépendante sur 18787 |
| Même fixture en DX12/SM6 | **8 contrôles réussis**, capture `generated/appearance-runtime.png` |
| Audit des assets enregistrés | **18 meshes validés**, aucune collision simple, côte Nanite, variantes de matériaux et précision des petits détails contrôlées |
| Compilation et packaging Windows Development | **BUILD SUCCESSFUL** ; cook : **0 erreur, 0 avertissement** |
| Outils | Syntaxe des six scripts Python et des scripts PowerShell vérifiée ; régénération identique du spectre sans modification de la date du header C++ |

Le package actualisé est dans `modules/maritime-sim/packages/Win64/`, avec son lanceur `MaritimeSim.exe`. Redémarrer le module pour charger ses nouveaux assets ; les services Agent Us, de passerelle et de signalisation conservent leur configuration habituelle. Les fichiers produits restent ignorés par Git.

Rapports locaux : `generated/package-v4.log`, `setup-assets.log`, `asset-audit.json`, `motion-tests.log`, `appearance-check.json` et `appearance-gpu.json`. Les avertissements de compilateur non préféré et de SDK des autres plateformes restent distincts du résultat du cook. Les alertes VSM/Lumen signalées n'ont pas été reproduites pendant le contrôle GPU ; cette observation ne couvre pas toutes les combinaisons possibles de contacts, météo et caméra.

La qualification Ubuntu 24.04/26.04, les mesures de FPS du package et la latence Pixel Streaming restent à effectuer. Le rendu reste une reconstruction procédurale : détails rapprochés, optique sous-marine, embruns et interactions locales entre eau et coque demandent encore de la finition. Les fonctions intégrées permettent cette révision sans installation supplémentaire ; un plugin ne remplacerait pas ce travail de modélisation et de validation visuelle.
