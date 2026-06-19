# Runtime Hermes pour Agent Us

Hermes (`nousresearch/hermes-agent`) est le backend agentique qui **verbalise**
les messages d'agents d'Agent Us. Le cœur du jeu reste déterministe ; Hermes ne
fait que reformuler (voir `src/core/llm/verbalize.ts` et la route
`POST /api/llm/verbalize`). Sans Hermes, Agent Us tourne en mode déterministe.

## 1. Tunnel SSH vers le LLM distant

Le LLM (vLLM sur la machine GPU `192.168.1.100`, port 8000) est exposé en local
sur le port **18000** :

```bash
ssh -L 18000:127.0.0.1:8000 openlab@192.168.1.100
```

Depuis le conteneur Hermes (Docker Desktop), ce tunnel est joignable via
`host.docker.internal:18000`.

## 2. Lancer Hermes en mode gateway (port 8642)

### Option A — `docker run` (la commande de référence)

```bash
docker run -d \
  --name hermes \
  --restart unless-stopped \
  -v ~/DEV/hermes/data:/opt/data \
  -v ~/DEV/hermes/workspace:/workspace \
  -w /workspace \
  -p 127.0.0.1:8642:8642 \
  -e API_SERVER_ENABLED=true \
  -e API_SERVER_HOST=0.0.0.0 \
  -e API_SERVER_KEY="$(openssl rand -hex 32)" \
  nousresearch/hermes-agent gateway run
```

### Option B — docker compose (équivalent)

```bash
export HERMES_API_KEY=$(openssl rand -hex 32)
docker compose up -d hermes
```

Récupérer la clé générée :

```bash
docker exec hermes env | grep API_SERVER_KEY
```

## 3. Connecter Agent Us

Dans `.env.local` :

```env
LLM_PROVIDER=hermes
NEXT_PUBLIC_LLM_ENABLED=1
HERMES_BASE_URL=http://localhost:8642/v1
HERMES_MODEL=hermes-agent
HERMES_API_KEY=<clé récupérée à l'étape 2>
```

Puis `npm run dev`. Les messages d'agents passent par Hermes ; en cas d'erreur
ou de timeout, repli automatique sur le texte déterministe.

## 4. Skills

Les capacités des subagents Agent Us sont décrites dans `hermes/skills/`
(9 `SKILL.md` + `manifest.json`). Voir `hermes/skills/README.md` pour le mapping
subagents → skills → MCP et le dépôt côté Hermes (`/opt/data`).
