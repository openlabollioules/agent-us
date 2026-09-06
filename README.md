# Agent Us

Serious game naval multi-agents (inspiré d'Among Us). Le cœur du jeu est
déterministe ; un backend agentique **Hermes** (optionnel) verbalise les
messages des agents.

## Démarrage (dev local)

```bash
npm install
npm run dev   # http://localhost:3000  (mode déterministe par défaut)
```

Autres commandes : `npm run build`, `npm run lint`, `npm run typecheck`, `npm run test`.

## 🐳 Lancer avec Docker (Agent Us + Hermes, une seule commande)

Prérequis : Docker + l'image `nousresearch/hermes-agent`. Si le LLM est distant,
ouvrir d'abord le tunnel SSH (ex. `ssh -L 18000:127.0.0.1:8000 openlab@192.168.1.100`).

```bash
docker compose up --build
```

- **Agent Us** → http://localhost:3000
- **Hermes** (API OpenAI-compatible) → http://localhost:8642 (interne : `hermes:8642`)

Agent Us délègue la verbalisation à Hermes via le réseau interne, avec **repli
déterministe automatique** si Hermes n'est pas prêt.

### Clé API partagée

Par défaut, une clé de dev (`agent-us-dev-key`) est partagée entre les deux
services. Pour une vraie clé :

```bash
export HERMES_API_KEY=$(openssl rand -hex 32)
docker compose up --build
```

(ou placer `HERMES_API_KEY=...` dans un fichier `.env` à côté du `docker-compose.yml`.)

### Volumes Hermes

Hermes monte `~/DEV/hermes/data` (mémoire + skills, dont le bundle `agent-us`)
et `~/DEV/hermes/workspace`, comme le lancement manuel. La config du LLM de
Hermes (vLLM/OpenRouter) vit dans `~/DEV/hermes/data`.

### Construire / lancer séparément

```bash
docker build -t agent-us:latest .          # image de l'app seule
docker compose up --build agent-us         # app seule (sans hermes)
```

## Architecture

- `src/core` : logique métier déterministe (simulation, MCP, skills, agents, scoring).
- `src/components`, `src/store` : UI (Next.js App Router + Zustand).
- `src/app/api` : routes serveur (simulation + `/api/llm/verbalize`).
- `hermes/` : skills Hermes (`hermes/skills/`) + `sync-skills.sh`.

Voir `hermes/README.md` pour brancher Hermes en détail.

## Vue immersive Unreal Engine 5 — module optionnel

Le projet propose désormais une intégration 3D indépendante dans [`modules/maritime-sim`](modules/maritime-sim/README.md). Le bouton **Carte 2D / Vue 3D · Unreal** apparaît dans la zone de carte. Sans configuration ou moteur disponible, la carte 2D et le jeu restent utilisables. La perte du moteur ou du flux vidéo provoque un retour à la 2D.

**Il s’agit d’un prototype d’intégration, pas encore d’un rendu ultra-réaliste livré.** Le projet C++ UE5.8, le lecteur Pixel Streaming, la passerelle et les générateurs d’assets sont présents. Les silhouettes sont des modèles d’étude procéduraux remplaçables ; aucun binaire Unreal ni modèle photoréaliste n’est fourni. La compilation native, le rendu et la compatibilité effective des pilotes restent à valider sur les machines cibles.

La vue permet l’orbite, le zoom, les changements d’altitude et de profondeur, ainsi qu’un **cadrage auto** suivant l’attention du jeu. Les positions et les évolutions restent pilotées par `TacticalState`. La 3D ne commande ni les agents ni les tours. Un contact incertain reste un repère anonyme : une silhouette détaillée ou une profondeur inventée ne doit pas dévoiler le diagnostic.

Les presets graphiques couvrent mer calme, pluie, brouillard, tempête et forte mer en ajustant houle et visibilité. Les vagues sont liées au tour. Le ciel, le soleil et l’ambiance sous-marine sont amorcés ; textures PBR détaillées, réfraction, écume, sillages, précipitations et hydrodynamique réalistes restent à produire.

- [Installation et construction Windows 11](modules/maritime-sim/README.md#installation-windows-11).
- [Installation Ubuntu 24.04 et qualification Ubuntu 26.04](modules/maritime-sim/README.md#installation-ubuntu-2404--qualification-2604).
- [Lancement, Pixel Streaming et variables d’environnement](modules/maritime-sim/README.md#lancer-les-services-et-connecter-agent-us).
- [Galerie et utilisation indépendante d’Agent Us](modules/maritime-sim/README.md#utilisation-indépendante).
- [Contrat public de scène](modules/maritime-sim/protocol/README.md), [catalogue](modules/maritime-sim/catalog/models.json) et [références visuelles publiques](modules/maritime-sim/catalog/REFERENCES.md).

Le catalogue comprend FDI/Amiral Ronarc’h, Suffren/Barracuda, Seaquest S/M/L, Seagent M/XL, France Libre et VSR700. La [nomenclature publique Naval Group](https://www.naval-group.com/en/drones) distingue **Seaquest pour la surface** et **Seagent pour le sous-marin**. Le France Libre est représenté comme un concept futur, avec des proportions fictives.

## Scénarios pédagogiques

Les neuf scénarios durent chacun **8 tours**. À chaque tour, consulter les événements et les analyses, solliciter les agents ou leurs suggestions, puis formuler le diagnostic final : contact, type d’anomalie, justification et confiance. Le scoring repose sur les mêmes règles en 2D et en 3D. Les données, identités d’exercice, capacités de capteurs et routes sont entièrement fictives.

| Scénario | Situation et indices à travailler | Présentation 3D |
| --- | --- | --- |
| **Le suiveur discret** (`drone-following-cargo`) | Cargo et petit contact ; rapprocher route parallèle, distance constante et indices optroniques. | Cargo et habillage Seaquest S lorsque le visuel est suffisamment confirmé ; sinon repère incertain. |
| **La route qui ment** (`ais-route-mismatch`) | Écart progressif entre route déclarée et déplacement observé. Croiser AIS et radar. | Cargo civil conservé ; participant allié habillé en FDI d’exercice. |
| **Le fantôme du radar** (`radar-loss`) | Perte puis retour d’une piste côtière. Distinguer incertitude capteur et comportement suspect. | Pêcheur et repère anonyme ; aucune identité cachée révélée. |
| **Le mirage de la tempête** (`weather-false-positive`) | Dégradation météo et échos fluctuants. Éviter le faux positif en croisant les observations. | Visibilité et houle liées aux changements météo du scénario. |
| **Le pêcheur imprévisible** (`fishing-vessel-ambiguous`) | Manœuvres irrégulières compatibles avec une activité civile. Exprimer l’incertitude. | Silhouette de pêche conservée pour maintenir le sens de l’exercice. |
| **Le rôdeur du seuil** (`drone-near-sensitive-area`) | Petit contact qui reste près d’une zone sensible fictive. Examiner durée, trajectoire et distance. | Zone matérialisée, FDI coopérative et petit drone à habillage Seaquest S. |
| **L’ombre sous la surface** (`submarine-contact`) | Piste intermittente, absence de visuel, indices acoustiques. Qualifier un faisceau d’indices sans certitude excessive. | Référence Suffren prévue, mais la piste non confirmée reste anonyme et sans profondeur révélée pendant le jeu. |
| **Deux ombres à la fois** (`dual-anomaly`) | Analyser séparément un suivi discret et un écho côtier instable. Hiérarchiser les indices. | Cargo, habillage Seaquest S et repère incertain indépendant. |
| **GAN — Le suiveur dans l’exercice** (`gan-exercise`) | Variante du suivi discret autour du France Libre. Les participants coopératifs ne sont pas des indices contre le contact analysé. | France Libre, FDI, Suffren, Seaquest S/M/L, Seagent M/XL et VSR700. Profondeurs/altitude des participants connus explicitement scénarisées et fictives. |

Les habillages des scénarios historiques changent uniquement leur représentation, pas leurs mesures, trajectoires, événements, réponses attendues ou scores. L’exercice GAN ajoute un cadre explicite à la présence de bâtiments français jouant des rôles différents, avec uniquement des actions d’observation et d’analyse.
