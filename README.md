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
