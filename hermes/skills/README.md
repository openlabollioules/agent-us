# Skills Hermes — Agent Us

Ce dossier est un **bundle de skills portable** prêt à charger dans le runtime agentique **Hermes** (`nousresearch/hermes-agent`). Il décrit, de façon indépendante de l'implémentation, les **capacités des subagents Hermes** d'Agent Us — un serious game naval pédagogique dans un **univers fictif**.

Chaque skill est documentée dans `<kebab-case>/SKILL.md` (en français). L'index machine se trouve dans [`manifest.json`](./manifest.json).

## 1. Rôle de ce bundle

Ces `SKILL.md` ne sont pas une re-implémentation : ils sont la **description portable** de ce que chaque subagent sait faire. Le comportement de référence vit dans le code TypeScript du projet (`src/core/skills/*.ts`, `src/core/agents/*.ts`, `src/core/mcp/*.ts`). Ces fichiers sont rédigés pour rester **fidèles** à ce comportement (valeurs de confiance, drapeaux, seuils, recommandations) et servir de source de vérité côté Hermes.

## 2. Mapping subagents → skills → MCP

Cinq subagents, pilotés par un orchestrateur, partagent un `TacticalState`. Les MCP (RadarMCP, AISMCP, OptronicMCP, ScenarioMCP) sont des **sources de données simulées** : elles dérivent tout du `TacticalState` et n'inventent rien.

| Subagent | Skills | MCP |
| --- | --- | --- |
| **GameMasterAgent** (orchestrateur) | *aucune skill métier* — présente la mission, narre, propose des coups via `suggest_next_actions` | ScenarioMCP |
| **RadarAgent** | `detect_contact`, `track_contact`, `estimate_confidence` | RadarMCP |
| **NavigationAgent** | `track_contact`, `compare_ais_route`, `detect_abnormal_trajectory` | AISMCP |
| **OptronicAgent** | `classify_surface_contact`, `estimate_confidence` | OptronicMCP |
| **ThreatAssessmentAgent** | `estimate_threat_level`, `generate_pedagogical_explanation`, `detect_abnormal_trajectory` | RadarMCP, AISMCP, OptronicMCP |

Skills partagées : `track_contact` (Radar + Navigation), `estimate_confidence` (Radar + Optronic), `detect_abnormal_trajectory` (Navigation + ThreatAssessment).

MCP et leurs outils principaux :
- **RadarMCP** — `getObservation(state, contactId)` → `RadarObservation`.
- **AISMCP** — `getAISData(state, contactId)` → `AISData`.
- **OptronicMCP** — `getObservation(state, contactId)` → `OptronicObservation`.
- **ScenarioMCP** — `getEventsForTurn(scenario, turn)` → `TacticalEvent[]` (événements publics).

## 3. Principe : coeur déterministe + verbalisation Hermes

Chaque skill a un **coeur déterministe** : pour une entrée donnée, elle renvoie toujours le même résultat (`SkillResult`, `SuggestedAction[]` ou `string`). Ce résultat contient un champ factuel (`summary`, ou les `label`/`description` des suggestions, ou la chaîne pédagogique).

Le rôle de Hermes :
- Hermes décide **COMMENT** commenter (ton, formulation, niveau de détail) et **QUELLE** skill / MCP appeler à quel moment.
- Hermes ne décide **PAS ce qui arrive** : le **scénario** pilote les tours et les événements (`timeline` des `ScenarioDefinition`), et les MCP dérivent tout du `TacticalState`.
- Hermes **REFORMULE** le champ factuel en message d'agent lisible, **SANS inventer** de fait, de position, ni d'action, et sans altérer les cibles (`targetAgentId`/`skillName`) ni le sens (un indice n'est jamais une preuve).
- **En l'absence de backend**, le champ factuel (`summary` / `description` / chaîne) est affiché tel quel : le jeu reste cohérent et sûr même sans LLM.

Types de retour (voir `manifest.json`) :
- `SkillResult` : `{ skill, summary, confidence, flags, recommendedAction }` — 7 skills.
- `SuggestedAction[]` : `suggest_next_actions` (≤ 5 propositions human-in-the-loop).
- `string` : `generate_pedagogical_explanation`.

## 4. Où déposer ces skills côté Hermes

Hermes lit ses skills dans **`/opt/data/skills/<catégorie>/<skill>/SKILL.md`** (côté hôte `~/DEV/hermes/data/skills`, voir `hermes/README.md`).

Utilisez le script de synchro plutôt qu'une copie manuelle :

```bash
./hermes/sync-skills.sh            # → catégorie "agent-us"
# ou : ./hermes/sync-skills.sh <catégorie>
# ou : HERMES_DATA=/chemin/data ./hermes/sync-skills.sh
```

Il copie chaque `<skill>/SKILL.md` vers `~/DEV/hermes/data/skills/agent-us/`, écrit le `DESCRIPTION.md` de catégorie et retire les skills supprimés. Ré-exécutez-le après toute modification/ajout de skill. (`manifest.json` n'est pas copié : Hermes indexe lui-même.)

> **Note de version.** Le schéma on-disk exact (nom du sous-dossier, format d'index, chargement automatique) **dépend de la version de Hermes** installée. Adaptez le point de montage / le nom de répertoire à votre version ; **ces `SKILL.md` restent la source de vérité** du comportement attendu des subagents, quelle que soit la manière dont Hermes les indexe.

## 5. Contraintes de sûreté

Ce bundle respecte le profil de sûreté d'Agent Us (`fictional-naval-training`) :
- **Univers fictif** : aucune donnée militaire réelle, aucune position réelle.
- **Aucune arme, aucune action offensive** : les recommandations orientent uniquement vers l'observation, le croisement de sources, l'analyse ou la réduction d'incertitude. Pas de règles d'engagement.
- **Humain dans la boucle** : les agents proposent, ne décident jamais ; l'opérateur humain conserve l'autorité de décision (un niveau de suspicion élevé invite seulement à poser un diagnostic).
- **Exprimer l'incertitude** : confiances, drapeaux et formulations « probable » / « indice à vérifier » sont systématiques ; une anomalie ou une incohérence AIS est un indice, jamais une preuve d'hostilité.
- **Pas d'invention tactique** : les agents ne créent pas de faits ; ils reformulent les résultats déterministes dérivés du scénario et du `TacticalState`.
