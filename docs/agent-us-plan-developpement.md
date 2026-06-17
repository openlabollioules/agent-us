# Agent Us — Plan de développement détaillé pour IA de codage

Version : V1 stagiaires 5 jours  
Application : **Agent Us**  
Type : serious game naval multi-agents, inspiré de l’esprit Among Us  
Cible de développement : Claude Code, Cursor, assistants IA de codage  
LLM runtime prioritaire : **vLLM + Qwen3.6**  
Mode obligatoire : **Mock mode** pour développement et démonstration hors LLM

---

## 0. Objectif du document

Ce document sert de guide complet pour faire implémenter l’application **Agent Us** par une IA de codage comme Claude Code ou Cursor.

Il contient :

- la vision produit ;
- le périmètre V1 ;
- la stack technique ;
- l’architecture cible ;
- les agents autonomes de l’application ;
- les skills ;
- les MCP simulés ;
- le gameplay détaillé ;
- les fichiers `AGENTS.md` et subagents Claude Code ;
- les règles Cursor ;
- les étapes de développement ;
- les tests ;
- les prompts à donner à l’IA de codage.

L’objectif n’est pas de produire un vrai système naval, mais un **jeu sérieux pédagogique, fictif, non sensible**, permettant de comprendre les notions d’agents IA, de skills, de MCP, de visualisation tactique simplifiée et de collaboration humain-IA.

---

# 1. Vision produit

## 1.1 Nom

L’application s’appelle :

# Agent Us

## 1.2 Concept

**Agent Us** est un serious game naval multi-agents inspiré de l’esprit d’Among Us.

Dans Among Us, le joueur observe des comportements suspects pour identifier un imposteur.  
Dans Agent Us, le joueur observe des comportements maritimes ambigus ou anormaux pour comprendre ce qui se passe.

Les protagonistes ne sont pas des personnages humanoïdes, mais des plateformes navales ou maritimes stylisées :

- bâtiment de surface ;
- sous-marin ;
- drone de surface USV ;
- drone aérien UAV ;
- cargo civil ;
- bateau de pêche ;
- patrouilleur ;
- contact inconnu ;
- capteurs simulés ;
- centre de surveillance.

Le joueur incarne un **opérateur humain / analyste de veille navale**.

Il doit :

1. observer une situation maritime ;
2. écouter les agents IA ;
3. interroger les agents ;
4. demander des analyses ;
5. utiliser ou ignorer les suggestions ;
6. identifier le comportement anormal ;
7. prendre une décision finale ;
8. recevoir un débrief pédagogique.

## 1.3 Positionnement pédagogique

L’application doit expliquer simplement :

- ce qu’est une piste radar ;
- ce qu’est une information AIS ;
- pourquoi un capteur peut être incertain ;
- pourquoi il faut croiser plusieurs sources ;
- comment une IA peut aider sans décider seule ;
- pourquoi l’humain reste dans la boucle ;
- ce qu’est un système multi-agents ;
- ce qu’est une skill ;
- ce qu’est un MCP simulé.

## 1.4 Principes clés

La V1 doit être :

- jouable ;
- visuelle ;
- pédagogique ;
- simple à comprendre ;
- déterministe ;
- codable en 5 jours par des stagiaires avec aide IA ;
- extensible ensuite vers une version démonstrateur ou marketing.

---

# 2. Périmètre V1

## 2.1 Inclus en V1

La V1 doit inclure :

- une application web Next.js ;
- une interface inspirée d’Among Us mais en univers naval ;
- une carte tactique 2D simplifiée ;
- 3 scénarios prédéfinis ;
- 4 agents métier + 1 orchestrateur ;
- des agents définis en Markdown ;
- des skills définies en Markdown + implémentées en TypeScript ;
- des MCP simulés en TypeScript ;
- un moteur de simulation déterministe ;
- un moteur de suggestions d’actions ;
- un moteur d’attention visuelle ;
- une console de messages agents ;
- une zone d’instruction libre joueur ;
- un diagnostic final ;
- un scoring simple ;
- un débrief pédagogique ;
- un mode mock obligatoire ;
- un provider vLLM obligatoire ;
- une configuration pour Qwen3.6.

## 2.2 Exclu en V1

Ne pas implémenter en V1 :

- authentification ;
- base de données ;
- multi-joueur temps réel ;
- cartographie SIG réelle ;
- OpenLayers/Cesium ;
- données navales réelles ;
- données classifiées ;
- règles d’engagement ;
- armement ;
- recommandations offensives ;
- vraie doctrine militaire ;
- simulations physiques avancées ;
- export PDF/PPT ;
- CRM ou génération de scripts marketing ;
- intégration MCP externe réelle.

---

# 3. Direction artistique et UX

## 3.1 Inspiration

L’interface doit évoquer :

- Among Us ;
- un jeu d’enquête ;
- une carte tactique stylisée ;
- un poste de surveillance futuriste, mais ludique.

Elle ne doit pas ressembler à :

- un vrai CMS militaire ;
- une interface opérationnelle réaliste ;
- un système défense dense ou confidentiel.

## 3.2 Ton visuel

Recommandations :

- fond sombre ;
- couleurs vives ;
- halos lumineux ;
- icônes navires stylisées ;
- contacts qui “pulsent” ;
- animations légères ;
- cartes simplifiées ;
- événements façon “Emergency meeting” ;
- suspicion représentée visuellement.

## 3.3 Représentation des protagonistes

Chaque contact maritime doit être traité comme un personnage de jeu.

Exemples :

- Cargo civil : gros navire rectangulaire bleu/gris ;
- USV suspect : petit triangle ou petit point orange ;
- Sous-marin : silhouette sombre semi-transparente ;
- Patrouilleur : navire allié avec contour vert ;
- Contact inconnu : icône avec point d’interrogation ;
- Drone aérien : petit symbole au-dessus de la carte.

## 3.4 États visuels des contacts

Un contact peut être :

- normal ;
- sélectionné ;
- sous surveillance ;
- suspect ;
- fortement suspect ;
- perdu temporairement ;
- confirmé par un capteur ;
- ambigu.

Exemples visuels :

- normal : icône stable ;
- sous surveillance : contour lumineux ;
- suspect : halo orange ;
- fortement suspect : halo rouge pulsé ;
- perdu : transparence + pointillés ;
- ambigu : léger bruit visuel.

---

# 4. Gameplay détaillé

## 4.1 Boucle principale

La boucle de gameplay est :

```txt
1. Présentation de la mission
        ↓
2. Début de simulation calme
        ↓
3. Détection d’un événement inhabituel
        ↓
4. Réactions des agents IA
        ↓
5. Mise en évidence visuelle sur la carte
        ↓
6. Suggestions d’actions au joueur
        ↓
7. Action du joueur : clic ou instruction libre
        ↓
8. Exécution via agent + skill + MCP
        ↓
9. Mise à jour de l’état tactique
        ↓
10. Nouveaux messages agents
        ↓
11. Décision finale du joueur
        ↓
12. Résolution
        ↓
13. Débrief pédagogique
```

## 4.2 Présentation initiale

Au lancement d’un scénario, le GameMasterAgent présente :

- zone générale ;
- contexte ;
- mission ;
- conditions fictives ;
- niveau de difficulté ;
- objectif joueur.

Exemple :

```txt
[GameMasterAgent]
Zone de surveillance active.
Trafic maritime modéré.
Mission : observer les comportements inhabituels et identifier une éventuelle anomalie.
Les agents IA sont disponibles pour assister ton analyse.
```

## 4.3 Simulation calme initiale

Le début doit sembler normal.

Sur la carte :

- les contacts se déplacent ;
- les trajectoires apparaissent progressivement ;
- aucun contact n’est immédiatement déclaré suspect.

But : créer une montée progressive du doute.

## 4.4 Détection d’un comportement inhabituel

Un événement apparaît après quelques tours.

Exemples :

- nouveau petit contact détecté près d’un cargo ;
- perte de piste radar ;
- route AIS incohérente ;
- distance constante entre deux navires ;
- signature optronique ambiguë.

Le système doit alors :

- ajouter un événement à la timeline ;
- afficher un message agent ;
- mettre le contact en évidence ;
- proposer des actions.

Exemple :

```txt
[RadarAgent]
Nouveau contact C-042 détecté à proximité du cargo Blue Marlin.
Confiance radar faible : 42 %.
```

## 4.5 Représentation carte de l’alerte

Quand un événement important survient :

- zoom léger vers la zone ;
- halo autour du contact ;
- trajectoire visible ;
- ligne relationnelle éventuelle entre deux contacts ;
- badge d’événement.

Exemple visuel attendu :

```txt
Cargo Blue Marlin -------- trajectoire stable
       ↑
       | distance constante
       ↓
C-042 petit contact suspect, halo orange pulsé
```

## 4.6 Collaboration agents

Les agents doivent commenter progressivement.

Exemple :

```txt
[RadarAgent]
La piste C-042 est intermittente.

[NavigationAgent]
La trajectoire de C-042 reste parallèle à celle du cargo depuis plusieurs minutes.

[ThreatAssessmentAgent]
Plusieurs indices convergent vers un comportement inhabituel, mais la confiance reste moyenne.
```

Les agents doivent toujours exprimer l’incertitude :

- “probablement” ;
- “possiblement” ;
- “confiance faible” ;
- “hypothèse” ;
- “à confirmer”.

## 4.7 Suggestions d’actions

Le SuggestionEngine propose des actions selon l’état courant.

Exemples :

- Demander confirmation optronique ;
- Comparer avec AIS ;
- Analyser la trajectoire ;
- Demander synthèse menace ;
- Vérifier stabilité radar ;
- Suivre le contact pendant un tour supplémentaire ;
- Demander hypothèses alternatives.

Chaque suggestion doit avoir :

- un libellé ;
- une description pédagogique ;
- un agent cible ;
- une skill cible ;
- une priorité ;
- un niveau de difficulté ;
- un prompt prérempli.

Exemple :

```txt
▶ Comparer trajectoire avec AIS
Pourquoi ?
Comparer la route observée avec la route déclarée aide à détecter un comportement incohérent.
```

## 4.8 Instruction libre

Le joueur peut aussi écrire librement :

```txt
NavigationAgent, est-ce que C-042 suit volontairement le cargo ?
```

Le système doit :

1. détecter l’agent mentionné ;
2. router l’instruction vers cet agent ;
3. sinon passer par GameMasterAgent ;
4. exécuter la skill pertinente si possible ;
5. ajouter la réponse dans la console agents.

## 4.9 Exécution d’une action

Une action joueur déclenche :

- ajout dans playerActions ;
- appel d’un agent ;
- appel éventuel d’une skill ;
- lecture d’un MCP simulé ;
- génération d’un message agent ;
- mise à jour éventuelle du score de suspicion ;
- mise à jour du focus visuel ;
- nouvelles suggestions.

## 4.10 Décision finale

Le joueur choisit :

- contact suspect ;
- type d’anomalie ;
- justification ;
- niveau de confiance personnel.

Exemple :

```txt
Contact suspect : C-042
Anomalie : suivi discret d’un cargo
Justification : trajectoire parallèle, distance constante, signature faible.
```

## 4.11 Résolution

Le système révèle :

- la vraie anomalie ;
- si le joueur a raison ;
- ce qui aurait dû être observé ;
- quelles actions ont aidé ;
- quelles actions auraient pu aider.

## 4.12 Débrief pédagogique

Le débrief doit contenir :

- résumé du scénario ;
- bonne réponse ;
- score ;
- explication simple ;
- indices visibles ;
- actions utiles ;
- agents les plus utiles ;
- notion IA ou métier apprise.

---

# 5. Scénarios V1

## 5.1 Scénario 1 — Drone de surface suivant un cargo

### Objectif joueur

Identifier qu’un petit contact suit un cargo civil à distance quasi constante.

### Contacts

- C-001 : cargo civil Blue Marlin ;
- C-042 : petit contact inconnu, en réalité USV fictif.

### Timeline

```txt
Tour 1 : cargo détecté, comportement normal.
Tour 2 : petit contact détecté à proximité.
Tour 3 : confiance radar faible sur C-042.
Tour 4 : trajectoire parallèle observée.
Tour 5 : distance constante confirmée.
Tour 6 : observation optronique partielle.
Tour 7 : suspicion élevée.
Tour 8 : décision joueur.
```

### Indices

- faible signature ;
- proximité avec cargo ;
- trajectoire parallèle ;
- distance stable ;
- AIS absent.

### Bonne décision

C-042 présente un comportement de suivi discret.

## 5.2 Scénario 2 — Route AIS incohérente

### Objectif joueur

Identifier qu’un navire civil suit une route différente de sa route AIS déclarée.

### Contacts

- C-014 : cargo civil ;
- C-100 : patrouilleur allié.

### Anomalie

Le cargo dévie progressivement vers une zone surveillée.

### Indices

- route AIS déclarée normale ;
- route observée divergente ;
- changement de cap progressif ;
- vitesse stable mais direction incohérente.

### Bonne décision

C-014 présente une incohérence route AIS / route observée.

## 5.3 Scénario 3 — Perte radar ambiguë

### Objectif joueur

Comprendre qu’une perte radar temporaire n’est pas toujours une menace.

### Contacts

- C-020 : bateau de pêche ;
- C-030 : contact côtier ambigu.

### Anomalie apparente

Le radar perd un contact puis le retrouve.

### Vérité scénario

La perte radar est due à un facteur fictif de masquage ou d’incertitude capteur.

### Bonne décision

Ne pas conclure trop vite. Demander confirmation et réduire l’incertitude.

---

# 6. Stack technique

## 6.1 Frontend

- Next.js App Router ;
- React ;
- TypeScript strict ;
- Tailwind CSS ;
- shadcn/ui ;
- Framer Motion ;
- Zustand.

## 6.2 Backend

- API Routes Next.js ;
- TypeScript ;
- pas de base de données en V1 ;
- état en mémoire ou store client selon simplicité.

## 6.3 IA runtime

Providers :

- mock ;
- vLLM ;
- Claude optionnel ;
- OpenAI optionnel.

vLLM doit être supporté dès la V1 via API compatible OpenAI.

## 6.4 Variables d’environnement

```env
LLM_PROVIDER=vllm
VLLM_BASE_URL=http://localhost:8000/v1
VLLM_MODEL=Qwen/Qwen3.6-35B-A3B-FP8
LLM_API_KEY=EMPTY
NEXT_PUBLIC_APP_NAME=Agent Us
NEXT_PUBLIC_DEBUG=true
```

---

# 7. Architecture cible

```txt
UI Layer
 ├── ScenarioSelector
 ├── TacticalMap
 ├── AgentConsole
 ├── ActionSuggestions
 ├── FreeInstructionInput
 ├── Timeline
 └── DebriefPanel

Application Layer
 ├── SimulationController
 ├── TacticalStateEngine
 ├── ScenarioGenerator
 ├── VisualAttentionEngine
 ├── SuggestionEngine
 └── ScoringEngine

Agent Runtime Layer
 ├── GameMasterAgent
 ├── RadarAgent
 ├── NavigationAgent
 ├── OptronicAgent
 └── ThreatAssessmentAgent

Skill Layer
 ├── Markdown SKILL.md
 └── TypeScript implementations

MCP Layer
 ├── RadarMCP
 ├── AISMCP
 ├── OptronicMCP
 └── ScenarioMCP

Provider Layer
 ├── MockLLMProvider
 ├── VLLMProvider
 ├── ClaudeProvider optional
 └── OpenAIProvider optional
```

---

# 8. Structure de repository

```txt
agent-us/
├── AGENTS.md
├── README.md
├── package.json
├── .env.example
├── .env.local

├── .claude/
│   └── agents/
│       ├── architecture-agent.md
│       ├── simulation-agent.md
│       ├── runtime-agent.md
│       ├── ux-agent.md
│       └── qa-agent.md

├── .cursor/
│   └── rules/
│       ├── project-rules.md
│       ├── simulation-rules.md
│       ├── ui-rules.md
│       └── safety-rules.md

├── agents/
│   ├── game-master-agent.md
│   ├── radar-agent.md
│   ├── navigation-agent.md
│   ├── optronic-agent.md
│   └── threat-assessment-agent.md

├── skills/
│   ├── detect-contact/
│   │   ├── SKILL.md
│   │   ├── implementation.ts
│   │   └── examples.json
│   ├── track-contact/
│   ├── compare-ais-route/
│   ├── detect-abnormal-trajectory/
│   ├── classify-surface-contact/
│   ├── estimate-confidence/
│   ├── estimate-threat-level/
│   ├── suggest-next-actions/
│   └── generate-pedagogical-explanation/

├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   └── api/
│   │       └── simulation/
│   │           ├── start/route.ts
│   │           ├── step/route.ts
│   │           ├── action/route.ts
│   │           └── diagnose/route.ts
│   │
│   ├── components/
│   │   ├── scenario/
│   │   ├── tactical-map/
│   │   ├── agents/
│   │   ├── actions/
│   │   ├── timeline/
│   │   └── debrief/
│   │
│   ├── core/
│   │   ├── simulation/
│   │   ├── agents/
│   │   ├── skills/
│   │   ├── mcp/
│   │   ├── llm/
│   │   └── scoring/
│   │
│   ├── data/
│   │   └── scenarios/
│   │
│   ├── providers/
│   └── types/
```

---

# 9. Modèles de données TypeScript

## 9.1 TacticalState

```ts
export type TacticalState = {
  simulationId: string;
  turn: number;
  scenarioId: string;
  status: "not_started" | "running" | "awaiting_player" | "completed";

  contacts: ContactTrack[];
  events: TacticalEvent[];
  agentMessages: AgentMessage[];
  suggestedActions: SuggestedAction[];
  playerActions: PlayerAction[];

  visualFocus?: VisualFocus;
  diagnosis?: PlayerDiagnosis;
};
```

## 9.2 ContactTrack

```ts
export type ContactCategory =
  | "surface_vessel"
  | "submarine"
  | "usv_drone"
  | "uav_drone"
  | "cargo"
  | "fishing_vessel"
  | "patrol_boat"
  | "unknown";

export type ContactTrack = {
  id: string;
  label: string;
  category: ContactCategory;
  affiliation: "friendly" | "neutral" | "unknown";

  position: { x: number; y: number };
  speedKnots: number;
  headingDeg: number;

  history: ContactHistoryPoint[];

  radarConfidence: number;
  aisConfidence: number;
  optronicConfidence: number;

  suspicionScore: number;
  flags: ContactFlag[];

  isHighlighted?: boolean;
  isUnderWatch?: boolean;
  relationTargetId?: string;
};
```

## 9.3 ContactFlag

```ts
export type ContactFlag =
  | "ais_missing"
  | "ais_route_mismatch"
  | "trajectory_anomaly"
  | "low_radar_confidence"
  | "radar_contact_lost"
  | "small_object_near_civilian"
  | "constant_distance_following"
  | "optronic_confirmation_needed"
  | "possible_false_positive";
```

## 9.4 TacticalEvent

```ts
export type TacticalEvent = {
  id: string;
  turn: number;
  type:
    | "mission_started"
    | "contact_detected"
    | "radar_confidence_drop"
    | "ais_mismatch"
    | "trajectory_anomaly"
    | "optronic_hint"
    | "threat_level_changed"
    | "player_action"
    | "system";

  severity: "info" | "low" | "medium" | "high";
  contactId?: string;
  title: string;
  description: string;

  visualCue?: {
    focusContactId?: string;
    showTrajectory?: boolean;
    showRelationLines?: boolean;
    highlightArea?: boolean;
    zoomLevel?: "normal" | "close";
  };
};
```

## 9.5 SuggestedAction

```ts
export type SuggestedAction = {
  id: string;
  label: string;
  description: string;
  targetAgentId: string;
  skillName?: string;
  priority: "low" | "medium" | "high";
  difficulty: "beginner" | "intermediate" | "expert";
  promptTemplate: string;
};
```

## 9.6 AgentMessage

```ts
export type AgentMessage = {
  id: string;
  turn: number;
  agentId: string;
  agentName: string;
  message: string;
  confidence?: number;
  referencedContacts: string[];
  usedSkills: string[];
  timestamp: string;
};
```

## 9.7 PlayerAction

```ts
export type PlayerAction = {
  id: string;
  turn: number;
  type: "suggested_action" | "free_instruction";
  instruction: string;
  targetAgentId?: string;
  skillName?: string;
};
```

## 9.8 PlayerDiagnosis

```ts
export type PlayerDiagnosis = {
  contactId: string;
  anomalyType:
    | "discreet_following"
    | "ais_route_mismatch"
    | "sensor_uncertainty"
    | "false_positive"
    | "unknown";
  justification: string;
  playerConfidence: number;
};
```

---

# 10. Agents autonomes de l’application

Les agents runtime sont définis dans `agents/*.md` et implémentés dans `src/core/agents`.

## 10.1 GameMasterAgent

### Fichier : `agents/game-master-agent.md`

```md
# GameMasterAgent

## Role

Main orchestrator of Agent Us.

## Responsibilities

- Present the mission.
- Advance simulation turns.
- Inject scenario events.
- Select relevant agents.
- Keep the simulation coherent.
- Route free player instructions.
- Trigger final debrief.

## Constraints

- Never invent tactical facts.
- TacticalState is the single source of truth.
- Keep the simulation fictional and pedagogical.
- Do not recommend offensive actions.
- Keep the human player in the decision loop.

## Style

Calm, clear, playful tactical narrator.

## Example message

Zone de surveillance active. Le trafic semble normal pour l’instant. Les agents sont prêts à t’aider si un comportement inhabituel apparaît.
```

## 10.2 RadarAgent

### Fichier : `agents/radar-agent.md`

```md
# RadarAgent

## Role

Analyze simulated radar tracks.

## Skills

- detect_contact
- track_contact
- estimate_confidence

## MCP Access

- RadarMCP

## Responsibilities

- Report detected contacts.
- Mention radar confidence.
- Detect unstable tracks.
- Recommend cross-sensor confirmation.

## Constraints

- Do not infer hostility.
- Do not invent radar values.
- Always mention uncertainty if confidence is low.

## Style

Precise but understandable to high-school students.

## Example message

Contact C-042 détecté avec une confiance radar faible. La piste est instable, je recommande une confirmation par un autre capteur.
```

## 10.3 NavigationAgent

### Fichier : `agents/navigation-agent.md`

```md
# NavigationAgent

## Role

Analyze trajectories and AIS consistency.

## Skills

- track_contact
- compare_ais_route
- detect_abnormal_trajectory

## MCP Access

- AISMCP

## Responsibilities

- Analyze heading and speed.
- Compare observed route with AIS.
- Detect constant-distance following.
- Detect unusual route changes.

## Constraints

- A route anomaly is not proof of threat.
- Explain movement patterns simply.
- Do not invent AIS data.

## Style

Analytical, clear, educational.

## Example message

Le contact C-042 conserve une distance presque constante avec le cargo. C’est un indice de suivi discret, mais cela doit être confirmé.
```

## 10.4 OptronicAgent

### Fichier : `agents/optronic-agent.md`

```md
# OptronicAgent

## Role

Analyze simulated visual and thermal observations.

## Skills

- classify_surface_contact
- estimate_confidence

## MCP Access

- OptronicMCP

## Responsibilities

- Describe simulated shape.
- Describe thermal signature.
- Provide probable classification.
- Mention image quality and uncertainty.

## Constraints

- Never invent real images.
- Never claim certainty when confidence is low.

## Style

Descriptive and cautious.

## Example message

La signature thermique est compacte et basse sur l’eau. Classification probable : petit objet de surface. Confiance : 58 %.
```

## 10.5 ThreatAssessmentAgent

### Fichier : `agents/threat-assessment-agent.md`

```md
# ThreatAssessmentAgent

## Role

Fuse observations and estimate suspicion.

## Skills

- estimate_threat_level
- generate_pedagogical_explanation
- detect_abnormal_trajectory

## MCP Access

- RadarMCP
- AISMCP
- OptronicMCP

## Responsibilities

- Combine radar, AIS, optronic and trajectory observations.
- Estimate suspicion level.
- Explain evidence.
- Recommend non-offensive next analysis actions.

## Constraints

- Never recommend engagement.
- Never recommend weapons.
- Keep the human in the loop.
- Always explain uncertainty.

## Style

Synthetic, calm, pedagogical.

## Example message

Le niveau de suspicion est moyen à élevé. Les principaux indices sont la faible signature radar, la trajectoire parallèle et la distance constante avec le cargo.
```

---

# 11. Skills Markdown + implémentations TypeScript

Chaque skill doit avoir :

- `SKILL.md` : description lisible par agents IA ;
- `implementation.ts` : fonction exécutable ;
- `examples.json` : exemples d’entrée/sortie.

## 11.1 detect-contact

### `skills/detect-contact/SKILL.md`

```md
# Skill: detect_contact

## Purpose

Detect and describe a simulated maritime radar contact.

## Inputs

- contactId
- rangeNm
- bearingDeg
- speedKnots
- radarConfidence
- radarStatus

## Outputs

Return:

- summary
- confidence
- flags
- recommendedAction

## Rules

- Never infer hostility.
- Mention uncertainty.
- Recommend cross-sensor confirmation if confidence is low.
- Use only provided radar data.

## Example

Input:

```json
{
  "contactId": "C-042",
  "rangeNm": 8.2,
  "bearingDeg": 74,
  "speedKnots": 18,
  "radarConfidence": 0.42,
  "radarStatus": "unstable"
}
```

Output:

```json
{
  "summary": "Contact C-042 detected but radar confidence is low.",
  "confidence": 0.42,
  "flags": ["low_radar_confidence"],
  "recommendedAction": "Request optronic confirmation."
}
```
```

### `skills/detect-contact/implementation.ts`

```ts
import { RadarObservation, SkillResult } from "@/types";

export function detectContact(input: RadarObservation): SkillResult {
  const lowConfidence = input.radarConfidence < 0.5;

  return {
    skill: "detect_contact",
    summary: lowConfidence
      ? `Contact ${input.contactId} detected but radar confidence is low.`
      : `Contact ${input.contactId} is tracked correctly.`,
    confidence: input.radarConfidence,
    flags: lowConfidence ? ["low_radar_confidence"] : [],
    recommendedAction: lowConfidence
      ? "Request optronic confirmation."
      : "Continue tracking.",
  };
}
```

## 11.2 track-contact

### `skills/track-contact/SKILL.md`

```md
# Skill: track_contact

## Purpose

Analyze the evolution of a contact over several turns.

## Inputs

- contact history
- previous position
- current position
- speed
- heading

## Outputs

- trajectory summary
- stability assessment
- flags
- confidence

## Rules

- Do not overinterpret a single movement.
- Mention if history is insufficient.
- Identify significant heading or speed changes.
```

### `skills/track-contact/implementation.ts`

```ts
import { ContactTrack, SkillResult } from "@/types";

export function trackContact(contact: ContactTrack): SkillResult {
  const last = contact.history.at(-1);
  const previous = contact.history.at(-2);

  if (!last || !previous) {
    return {
      skill: "track_contact",
      summary: "Not enough history to analyze trajectory.",
      confidence: 0.3,
      flags: [],
      recommendedAction: "Continue tracking for one more turn.",
    };
  }

  const headingDelta = Math.abs(last.headingDeg - previous.headingDeg);
  const speedDelta = Math.abs(last.speedKnots - previous.speedKnots);

  const abnormal = headingDelta > 25 || speedDelta > 8;

  return {
    skill: "track_contact",
    summary: abnormal
      ? `Contact ${contact.id} shows a notable movement change.`
      : `Contact ${contact.id} trajectory is stable.`,
    confidence: abnormal ? 0.72 : 0.6,
    flags: abnormal ? ["trajectory_anomaly"] : [],
    recommendedAction: abnormal
      ? "Ask NavigationAgent to analyze trajectory consistency."
      : "Continue monitoring.",
  };
}
```

## 11.3 compare-ais-route

### `skills/compare-ais-route/SKILL.md`

```md
# Skill: compare_ais_route

## Purpose

Compare observed movement with declared AIS route.

## Inputs

- contactId
- observed heading
- observed movement
- AIS declared route
- AIS route status

## Outputs

- route consistency summary
- confidence
- flags
- recommended action

## Rules

- AIS is declarative information.
- AIS mismatch does not automatically mean threat.
- Explain uncertainty clearly.
```

### `skills/compare-ais-route/implementation.ts`

```ts
import { AISData, ContactTrack, SkillResult } from "@/types";

export function compareAisRoute(contact: ContactTrack, ais: AISData): SkillResult {
  const mismatch = ais.declaredRouteStatus === "mismatch";
  const missing = ais.declaredRouteStatus === "missing";

  return {
    skill: "compare_ais_route",
    summary: missing
      ? `No AIS route is available for ${contact.id}.`
      : mismatch
        ? `Observed trajectory for ${contact.id} differs from AIS declared route.`
        : `Observed trajectory for ${contact.id} is consistent with AIS.`,
    confidence: mismatch ? 0.82 : missing ? 0.55 : 0.65,
    flags: mismatch ? ["ais_route_mismatch"] : missing ? ["ais_missing"] : [],
    recommendedAction: mismatch
      ? "Ask ThreatAssessmentAgent to include this inconsistency in the analysis."
      : "Continue monitoring.",
  };
}
```

## 11.4 detect-abnormal-trajectory

### `skills/detect-abnormal-trajectory/SKILL.md`

```md
# Skill: detect_abnormal_trajectory

## Purpose

Detect unusual maritime movement behavior.

## Detectable Patterns

- abrupt heading changes
- constant-distance following
- route mismatch
- unusual loitering
- suspicious proximity

## Rules

- An anomaly is an indicator, not proof.
- Recommend additional analysis.
- Explain behavior in simple words.
```

### `skills/detect-abnormal-trajectory/implementation.ts`

```ts
import { ContactTrack, SkillResult } from "@/types";

export function detectAbnormalTrajectory(contact: ContactTrack): SkillResult {
  const abnormalFlags = [
    "constant_distance_following",
    "ais_route_mismatch",
    "trajectory_anomaly",
  ];

  const matchedFlags = contact.flags.filter(flag => abnormalFlags.includes(flag));

  const abnormal = matchedFlags.length > 0;

  return {
    skill: "detect_abnormal_trajectory",
    summary: abnormal
      ? `Contact ${contact.id} shows unusual movement behavior: ${matchedFlags.join(", ")}.`
      : `No significant trajectory anomaly detected for ${contact.id}.`,
    confidence: abnormal ? 0.78 : 0.55,
    flags: abnormal ? ["trajectory_anomaly"] : [],
    recommendedAction: abnormal
      ? "Compare with AIS and request a threat synthesis."
      : "Continue monitoring.",
  };
}
```

## 11.5 classify-surface-contact

### `skills/classify-surface-contact/SKILL.md`

```md
# Skill: classify_surface_contact

## Purpose

Classify a simulated maritime object from visual or thermal observation.

## Inputs

- contactId
- thermalSignature
- shape
- imageQuality
- classificationHint

## Outputs

- probable classification
- confidence
- flags
- recommended action

## Rules

- Never invent real imagery.
- Classification must remain probabilistic.
- Mention image quality.
```

### `skills/classify-surface-contact/implementation.ts`

```ts
import { OptronicObservation, SkillResult } from "@/types";

export function classifySurfaceContact(obs: OptronicObservation): SkillResult {
  const lowQuality = obs.imageQuality < 0.5;

  return {
    skill: "classify_surface_contact",
    summary: `Probable classification for ${obs.contactId}: ${obs.classificationHint}. Image quality: ${Math.round(obs.imageQuality * 100)}%.`,
    confidence: obs.imageQuality,
    flags:
      obs.classificationHint === "small_surface_object"
        ? ["small_object_near_civilian"]
        : [],
    recommendedAction: lowQuality
      ? "Continue tracking and request another observation."
      : "Use this classification in the threat synthesis.",
  };
}
```

## 11.6 estimate-confidence

### `skills/estimate-confidence/SKILL.md`

```md
# Skill: estimate_confidence

## Purpose

Estimate confidence level from one or more observations.

## Inputs

- radar confidence
- AIS confidence
- optronic confidence

## Outputs

- combined confidence
- explanation

## Rules

- Confidence is not certainty.
- Low confidence should trigger cross-checking.
```

### `skills/estimate-confidence/implementation.ts`

```ts
export function estimateConfidence(values: number[]) {
  if (values.length === 0) {
    return {
      skill: "estimate_confidence",
      confidence: 0,
      summary: "No confidence values available.",
      flags: [],
      recommendedAction: "Gather more observations.",
    };
  }

  const average = values.reduce((a, b) => a + b, 0) / values.length;

  return {
    skill: "estimate_confidence",
    confidence: average,
    summary: `Combined confidence is ${Math.round(average * 100)}%.`,
    flags: average < 0.5 ? ["low_confidence"] : [],
    recommendedAction: average < 0.5
      ? "Request cross-sensor confirmation."
      : "Use confidence in assessment.",
  };
}
```

## 11.7 estimate-threat-level

### `skills/estimate-threat-level/SKILL.md`

```md
# Skill: estimate_threat_level

## Purpose

Estimate a fictional suspicion level from combined observations.

## Inputs

- suspicionScore
- contact flags
- sensor confidence

## Outputs

- suspicion level
- confidence
- explanation
- recommended next action

## Rules

- Use the word suspicion, not threat certainty.
- Never recommend offensive action.
- Keep human decision authority.
```

### `skills/estimate-threat-level/implementation.ts`

```ts
import { ContactTrack, SkillResult } from "@/types";

export function estimateThreatLevel(contact: ContactTrack): SkillResult {
  const score = contact.suspicionScore;

  const level = score >= 0.75 ? "high" : score >= 0.45 ? "medium" : "low";

  return {
    skill: "estimate_threat_level",
    summary: `Suspicion level for ${contact.id}: ${level}.`,
    confidence: score,
    flags: [],
    recommendedAction:
      level === "high"
        ? "Ask the human player to make a diagnosis."
        : "Continue collecting evidence.",
  };
}
```

## 11.8 suggest-next-actions

### `skills/suggest-next-actions/SKILL.md`

```md
# Skill: suggest_next_actions

## Purpose

Suggest relevant human-in-the-loop actions based on the current tactical state.

## Inputs

- tactical state
- contacts
- flags
- suspicion scores
- latest events

## Outputs

- list of suggested actions

## Rules

- Suggestions must help beginners.
- Suggestions must not force the player.
- Always allow free instruction.
- Explain why each action is useful.
```

### `skills/suggest-next-actions/implementation.ts`

```ts
import { TacticalState, SuggestedAction } from "@/types";

export function suggestNextActions(state: TacticalState): SuggestedAction[] {
  const suggestions: SuggestedAction[] = [];

  for (const contact of state.contacts) {
    if (contact.flags.includes("low_radar_confidence")) {
      suggestions.push({
        id: `ask-optronic-${contact.id}`,
        label: "Demander confirmation optronique",
        description:
          "Quand la confiance radar baisse, une observation visuelle peut réduire l’incertitude.",
        targetAgentId: "optronic-agent",
        skillName: "classify_surface_contact",
        priority: "high",
        difficulty: "beginner",
        promptTemplate: `OptronicAgent, peux-tu confirmer la classification du contact ${contact.id} ?`,
      });
    }

    if (contact.flags.includes("ais_route_mismatch")) {
      suggestions.push({
        id: `compare-ais-${contact.id}`,
        label: "Comparer avec AIS",
        description:
          "Comparer la route observée et la route déclarée aide à repérer une incohérence.",
        targetAgentId: "navigation-agent",
        skillName: "compare_ais_route",
        priority: "high",
        difficulty: "beginner",
        promptTemplate: `NavigationAgent, compare la trajectoire observée de ${contact.id} avec sa route AIS.`,
      });
    }

    if (contact.flags.includes("constant_distance_following")) {
      suggestions.push({
        id: `analyze-following-${contact.id}`,
        label: "Analyser le suivi discret",
        description:
          "Un contact qui garde une distance stable avec un autre peut indiquer un comportement de suivi.",
        targetAgentId: "navigation-agent",
        skillName: "detect_abnormal_trajectory",
        priority: "high",
        difficulty: "intermediate",
        promptTemplate: `NavigationAgent, analyse si ${contact.id} suit discrètement un autre contact.`,
      });
    }

    if (contact.suspicionScore > 0.65) {
      suggestions.push({
        id: `threat-summary-${contact.id}`,
        label: "Demander synthèse suspicion",
        description:
          "Quand plusieurs indices convergent, une synthèse aide à décider.",
        targetAgentId: "threat-assessment-agent",
        skillName: "estimate_threat_level",
        priority: "medium",
        difficulty: "intermediate",
        promptTemplate: `ThreatAssessmentAgent, fais une synthèse du niveau de suspicion pour ${contact.id}.`,
      });
    }
  }

  return suggestions.slice(0, 5);
}
```

## 11.9 generate-pedagogical-explanation

### `skills/generate-pedagogical-explanation/SKILL.md`

```md
# Skill: generate_pedagogical_explanation

## Purpose

Explain a maritime surveillance concept in simple words.

## Inputs

- contact flags
- scenario type
- player action history

## Outputs

- short educational explanation

## Rules

- Use simple language.
- Avoid jargon or explain it.
- Connect explanation to what the player saw.
```

### `skills/generate-pedagogical-explanation/implementation.ts`

```ts
import { ContactTrack } from "@/types";

export function generatePedagogicalExplanation(contact: ContactTrack): string {
  if (contact.flags.includes("constant_distance_following")) {
    return "Un contact qui garde une distance presque constante avec un navire civil peut indiquer un comportement de suivi discret. Ce n’est pas une preuve, mais c’est un indice à vérifier.";
  }

  if (contact.flags.includes("ais_route_mismatch")) {
    return "L’AIS est une information déclarée par le navire. Si la route observée ne correspond pas à la route déclarée, cela peut venir d’une erreur, d’une panne ou d’un comportement volontairement ambigu.";
  }

  if (contact.flags.includes("radar_contact_lost")) {
    return "Une perte radar ne veut pas forcément dire qu’un contact se cache. Un capteur peut perdre une piste à cause de l’environnement ou d’une faible qualité de détection.";
  }

  return "L’analyse reste incertaine. Il est utile de croiser plusieurs sources avant de conclure.";
}
```

---

# 12. MCP simulés

Les MCP sont des services TypeScript locaux qui simulent l’accès à des données.

## 12.1 RadarMCP

```ts
export type RadarObservation = {
  contactId: string;
  rangeNm: number;
  bearingDeg: number;
  speedKnots: number;
  radarConfidence: number;
  radarStatus: "tracked" | "lost" | "unstable";
};

export class RadarMCP {
  getObservation(state: TacticalState, contactId: string): RadarObservation {
    const contact = state.contacts.find(c => c.id === contactId);

    if (!contact) {
      throw new Error(`Unknown contact ${contactId}`);
    }

    return {
      contactId: contact.id,
      rangeNm: 8.2,
      bearingDeg: contact.headingDeg,
      speedKnots: contact.speedKnots,
      radarConfidence: contact.radarConfidence,
      radarStatus: contact.flags.includes("radar_contact_lost")
        ? "lost"
        : contact.radarConfidence < 0.5
          ? "unstable"
          : "tracked",
    };
  }
}
```

## 12.2 AISMCP

```ts
export type AISData = {
  contactId: string;
  shipName?: string;
  declaredType?: string;
  declaredRoute?: string;
  declaredRouteStatus: "normal" | "mismatch" | "missing";
};

export class AISMCP {
  getAISData(state: TacticalState, contactId: string): AISData {
    const contact = state.contacts.find(c => c.id === contactId);

    if (!contact) {
      throw new Error(`Unknown contact ${contactId}`);
    }

    if (contact.flags.includes("ais_missing")) {
      return {
        contactId,
        declaredRouteStatus: "missing",
      };
    }

    return {
      contactId,
      shipName: contact.label,
      declaredType: contact.category,
      declaredRoute: "Fictional declared commercial route",
      declaredRouteStatus: contact.flags.includes("ais_route_mismatch")
        ? "mismatch"
        : "normal",
    };
  }
}
```

## 12.3 OptronicMCP

```ts
export type OptronicObservation = {
  contactId: string;
  thermalSignature: "low" | "medium" | "compact_hot_spot";
  shape: "large_hull" | "low_profile_object" | "unknown";
  imageQuality: number;
  classificationHint:
    | "cargo"
    | "fishing_vessel"
    | "surface_vessel"
    | "usv_drone"
    | "small_surface_object"
    | "unknown";
};

export class OptronicMCP {
  getObservation(state: TacticalState, contactId: string): OptronicObservation {
    const contact = state.contacts.find(c => c.id === contactId);

    if (!contact) {
      throw new Error(`Unknown contact ${contactId}`);
    }

    if (contact.category === "usv_drone" || contact.category === "unknown") {
      return {
        contactId,
        thermalSignature: "compact_hot_spot",
        shape: "low_profile_object",
        imageQuality: contact.optronicConfidence,
        classificationHint: "small_surface_object",
      };
    }

    return {
      contactId,
      thermalSignature: "medium",
      shape: "large_hull",
      imageQuality: contact.optronicConfidence,
      classificationHint: contact.category,
    };
  }
}
```

## 12.4 ScenarioMCP

```ts
export class ScenarioMCP {
  getEventsForTurn(scenario: ScenarioDefinition, turn: number): TacticalEvent[] {
    return scenario.timeline.filter(event => event.turn === turn);
  }
}
```

---

# 13. LLM providers

## 13.1 Interface commune

```ts
export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export interface LLMProvider {
  id: "mock" | "vllm" | "claude" | "openai";
  chat(messages: ChatMessage[]): Promise<string>;
}
```

## 13.2 MockLLMProvider

```ts
export class MockLLMProvider implements LLMProvider {
  id = "mock" as const;

  async chat(messages: ChatMessage[]): Promise<string> {
    const last = messages.at(-1)?.content ?? "";

    if (last.includes("radar")) {
      return "La piste radar est incertaine. Une confirmation par un autre capteur serait utile.";
    }

    if (last.includes("AIS")) {
      return "La route observée semble diverger de la route déclarée.";
    }

    return "Analyse simulée : plusieurs indices doivent être vérifiés avant de conclure.";
  }
}
```

## 13.3 VLLMProvider

```ts
export class VLLMProvider implements LLMProvider {
  id = "vllm" as const;

  constructor(
    private baseUrl: string,
    private model: string,
    private apiKey: string = "EMPTY"
  ) {}

  async chat(messages: ChatMessage[]): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.4,
        max_tokens: 512,
      }),
    });

    if (!response.ok) {
      throw new Error(`vLLM request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? "";
  }
}
```

---

# 14. Hermes Agent configuration conceptuelle

Créer un fichier : `src/core/agents/hermes.config.ts`.

```ts
export const hermesConfig = {
  application: {
    name: "Agent Us",
    mode: "educational-serious-game",
    safetyProfile: "fictional-naval-training",
  },

  llm: {
    provider: process.env.LLM_PROVIDER ?? "mock",
    model: process.env.VLLM_MODEL ?? "mock-model",
    baseUrl: process.env.VLLM_BASE_URL,
  },

  orchestrator: {
    id: "game-master-agent",
    strategy: "turn-based",
    maxTurns: 8,
    humanInTheLoop: true,
    sharedState: "tactical-state",
  },

  agents: [
    {
      id: "radar-agent",
      name: "RadarAgent",
      role: "Simulated radar track analyst",
      skills: ["detect_contact", "track_contact", "estimate_confidence"],
      mcps: ["radar-mcp"],
    },
    {
      id: "navigation-agent",
      name: "NavigationAgent",
      role: "Trajectory and AIS consistency analyst",
      skills: ["track_contact", "compare_ais_route", "detect_abnormal_trajectory"],
      mcps: ["ais-mcp"],
    },
    {
      id: "optronic-agent",
      name: "OptronicAgent",
      role: "Simulated visual and thermal classification analyst",
      skills: ["classify_surface_contact", "estimate_confidence"],
      mcps: ["optronic-mcp"],
    },
    {
      id: "threat-assessment-agent",
      name: "ThreatAssessmentAgent",
      role: "Pedagogical evidence fusion analyst",
      skills: [
        "estimate_threat_level",
        "generate_pedagogical_explanation",
        "detect_abnormal_trajectory",
      ],
      mcps: ["radar-mcp", "ais-mcp", "optronic-mcp"],
    },
  ],

  mcps: [
    { id: "radar-mcp", type: "simulated", endpoint: "local://RadarMCP" },
    { id: "ais-mcp", type: "simulated", endpoint: "local://AISMCP" },
    { id: "optronic-mcp", type: "simulated", endpoint: "local://OptronicMCP" },
    { id: "scenario-mcp", type: "simulated", endpoint: "local://ScenarioMCP" },
  ],

  constraints: {
    noRealMilitaryData: true,
    noWeaponRecommendation: true,
    noRulesOfEngagement: true,
    agentsCannotInventTacticalFacts: true,
    explainUncertainty: true,
  },
};
```

---

# 15. Moteurs applicatifs

## 15.1 TacticalStateEngine

Responsabilités :

- créer l’état initial ;
- avancer les tours ;
- déplacer les contacts ;
- appliquer les événements ;
- mettre à jour les flags ;
- maintenir la cohérence.

Règle fondamentale :

```txt
Les agents IA n’inventent pas les données tactiques. Ils interprètent TacticalState.
```

## 15.2 SimulationController

Responsabilités :

- démarrer scénario ;
- appeler TacticalStateEngine ;
- appeler ScenarioMCP ;
- appeler agents ;
- appeler SuggestionEngine ;
- appeler VisualAttentionEngine ;
- retourner nouvel état.

## 15.3 SuggestionEngine

Responsabilités :

- lire flags et événements ;
- produire actions suggérées ;
- prioriser ;
- expliquer pourquoi ;
- limiter à 5 actions.

## 15.4 VisualAttentionEngine

Responsabilités :

- calculer le contact à mettre en avant ;
- définir zoom et centre ;
- afficher trajectoires ;
- afficher relations ;
- attirer l’attention sans surcharger.

Exemple :

```ts
export function computeVisualFocus(state: TacticalState): VisualFocus | undefined {
  const highSuspicion = state.contacts.find(c => c.suspicionScore > 0.7);

  if (highSuspicion) {
    return {
      contactIds: [highSuspicion.id],
      center: highSuspicion.position,
      zoom: 1.4,
      reason: `Contact ${highSuspicion.id} sous surveillance`,
      showTrajectories: true,
      showRelationLines: true,
    };
  }

  const latestEvent = state.events.at(-1);

  if (latestEvent?.contactId) {
    const contact = state.contacts.find(c => c.id === latestEvent.contactId);
    if (!contact) return undefined;

    return {
      contactIds: [contact.id],
      center: contact.position,
      zoom: latestEvent.severity === "high" ? 1.5 : 1.2,
      reason: latestEvent.title,
      showTrajectories: true,
      showRelationLines: false,
    };
  }

  return undefined;
}
```

## 15.5 ScoringEngine

Responsabilités :

- évaluer diagnostic ;
- attribuer score ;
- expliquer erreurs ;
- valoriser bonnes actions.

Exemple :

```ts
export function scoreDiagnosis(
  diagnosis: PlayerDiagnosis,
  scenario: ScenarioDefinition,
  state: TacticalState
): ScoreResult {
  let score = 0;
  const feedback: string[] = [];

  if (diagnosis.contactId === scenario.expectedDiagnosis.contactId) {
    score += 40;
    feedback.push("Bon contact identifié.");
  }

  if (diagnosis.anomalyType === scenario.expectedDiagnosis.anomalyType) {
    score += 30;
    feedback.push("Bon type d’anomalie détecté.");
  }

  if (diagnosis.justification.length > 40) {
    score += 10;
    feedback.push("Justification suffisamment développée.");
  }

  const usefulActions = state.playerActions.filter(a =>
    [
      "compare_ais_route",
      "classify_surface_contact",
      "estimate_threat_level",
      "detect_abnormal_trajectory",
    ].includes(a.skillName ?? "")
  );

  score += Math.min(20, usefulActions.length * 7);

  return {
    score: Math.min(score, 100),
    feedback,
  };
}
```

---

# 16. Composants UI

## 16.1 ScenarioSelector

Affiche les 3 scénarios V1.

Chaque carte scénario affiche :

- titre ;
- difficulté ;
- objectif ;
- durée ;
- bouton lancer.

## 16.2 TacticalMap

Affiche :

- fond sombre ;
- grille ;
- contacts ;
- trajectoires ;
- halos ;
- relations ;
- focus visuel ;
- événements.

Fonctions :

- clic contact ;
- tooltip contact ;
- zoom automatique ;
- animation légère.

## 16.3 AgentConsole

Affiche :

- messages agents ;
- agent auteur ;
- icône agent ;
- confiance ;
- skills utilisées ;
- contacts référencés.

## 16.4 ActionSuggestions

Affiche :

- actions suggérées ;
- priorité ;
- explication ;
- bouton exécuter.

## 16.5 FreeInstructionInput

Permet au joueur d’écrire :

```txt
RadarAgent, pourquoi la piste C-042 est-elle instable ?
```

## 16.6 Timeline

Affiche :

- événements par tour ;
- niveau de sévérité ;
- contact lié ;
- possibilité de cliquer pour recentrer carte.

## 16.7 DiagnosisPanel

Permet de choisir :

- contact suspect ;
- type d’anomalie ;
- justification ;
- confiance joueur.

## 16.8 DebriefPanel

Affiche :

- score ;
- bonne réponse ;
- erreurs éventuelles ;
- explication métier ;
- actions utiles ;
- notion IA apprise.

---

# 17. API routes

## 17.1 POST `/api/simulation/start`

Entrée :

```json
{
  "scenarioId": "drone-following-cargo"
}
```

Sortie : TacticalState initial.

## 17.2 POST `/api/simulation/step`

Entrée :

```json
{
  "state": {}
}
```

Sortie : TacticalState mis à jour.

## 17.3 POST `/api/simulation/action`

Entrée :

```json
{
  "state": {},
  "action": {}
}
```

Sortie : TacticalState enrichi avec réponse agent.

## 17.4 POST `/api/simulation/diagnose`

Entrée :

```json
{
  "state": {},
  "diagnosis": {}
}
```

Sortie : score + débrief.

---

# 18. AGENTS.md racine

Créer `AGENTS.md` :

```md
# AGENTS.md — Agent Us

## Project Overview

Agent Us is a fictional educational naval multi-agent game inspired by Among Us.

Players collaborate with AI agents to identify suspicious maritime behaviors.

The project is intentionally:

- fictional,
- educational,
- non-sensitive,
- human-in-the-loop,
- playful.

## Primary Goals

- Demonstrate multi-agent orchestration.
- Demonstrate explainable AI.
- Teach basic naval surveillance concepts.
- Provide a fun tactical gameplay experience.

## Mandatory Stack

- Next.js App Router
- TypeScript strict
- Tailwind CSS
- Zustand
- Framer Motion

## Mandatory AI Support

- Mock mode
- vLLM mode
- Qwen3.6 support

## Critical Rules

- Never use real military data.
- Never implement weapons.
- Never implement rules of engagement.
- Never recommend offensive actions.
- Agents cannot invent tactical facts.
- TacticalState is the single source of truth.
- UI must remain playful and readable.
- Deterministic scenarios in V1.

## Development Workflow

1. Define types first.
2. Build TacticalStateEngine.
3. Build scenario system.
4. Build tactical map.
5. Build mock agents.
6. Build vLLM integration.
7. Build suggestion system.
8. Build scoring and debrief.
9. Add polish and tests.

## Commands

npm run dev
npm run build
npm run lint
npm run test
```

---

# 19. Claude Code subagents

Créer dans `.claude/agents/`.

## 19.1 architecture-agent.md

```md
---
name: architecture-agent
description: Responsible for architecture consistency.
tools: Read, Write, Edit, Bash
---

You maintain the architecture of Agent Us.

Responsibilities:

- folder organization,
- module boundaries,
- dependency control,
- shared types,
- application scalability.

Rules:

- business logic must stay in src/core,
- UI must stay in src/components,
- avoid coupling UI and simulation logic,
- favor small testable modules.
```

## 19.2 simulation-agent.md

```md
---
name: simulation-agent
description: Responsible for tactical simulation consistency.
tools: Read, Write, Edit, Bash
---

You are responsible for:

- TacticalStateEngine,
- trajectories,
- deterministic simulation,
- anomaly generation,
- event timelines.

Rules:

- contacts move coherently,
- contacts keep inertia,
- anomalies must be explainable,
- events must remain pedagogical,
- no real military data.
```

## 19.3 runtime-agent.md

```md
---
name: runtime-agent
description: Responsible for AI runtime and orchestration.
tools: Read, Write, Edit, Bash
---

You implement:

- agent runtime,
- skill execution,
- MCP orchestration,
- provider abstraction,
- vLLM integration.

Rules:

- support mock mode,
- support vLLM,
- providers must share the same interface,
- agents interpret tactical state,
- agents do not create tactical facts.
```

## 19.4 ux-agent.md

```md
---
name: ux-agent
description: Responsible for gameplay and tactical UX.
tools: Read, Write, Edit, Bash
---

You design the user experience.

Focus on:

- playful tactical UI,
- Among Us inspiration,
- visual attention guidance,
- animated suspicious contacts,
- clear interaction flows.

Rules:

- gameplay first,
- readability first,
- avoid realistic military density,
- explain visually why something is suspicious.
```

## 19.5 qa-agent.md

```md
---
name: qa-agent
description: Responsible for tests and consistency.
tools: Read, Write, Edit, Bash
---

You validate:

- scenario consistency,
- trajectory consistency,
- tactical logic,
- UI regressions,
- agent outputs.

Rules:

- every major module must have tests,
- scenarios must remain deterministic,
- tactical state must remain valid.
```

---

# 20. Cursor rules

Créer `.cursor/rules/`.

## 20.1 project-rules.md

```md
# Project Rules — Agent Us

- Use Next.js, TypeScript strict, Tailwind CSS.
- Keep business logic in src/core.
- Keep UI in src/components.
- Keep data scenarios in src/data/scenarios.
- Do not introduce database or auth in V1.
- Always preserve mock mode.
```

## 20.2 simulation-rules.md

```md
# Simulation Rules

- TacticalState is the single source of truth.
- Agents must not invent tactical facts.
- Scenarios must be deterministic.
- Contact movements must be coherent and gradual.
- Anomalies must be visible and explainable.
```

## 20.3 ui-rules.md

```md
# UI Rules

- UI must feel playful and game-like.
- Use Among Us inspiration without copying assets.
- Use stylized vessels instead of real military symbols.
- Always show why attention is focused somewhere.
- Avoid dense professional military UI.
```

## 20.4 safety-rules.md

```md
# Safety Rules

- No real military data.
- No weapons.
- No rules of engagement.
- No offensive recommendations.
- Keep all scenarios fictional and educational.
```

---

# 21. Plan de développement détaillé

## Phase 0 — Initialisation projet

### Objectif

Créer le socle technique.

### Tâches

1. Créer projet Next.js TypeScript.
2. Installer Tailwind CSS.
3. Installer Zustand.
4. Installer Framer Motion.
5. Installer Vitest.
6. Créer structure dossiers.
7. Ajouter `.env.example`.
8. Ajouter `AGENTS.md`.
9. Ajouter règles Cursor.
10. Ajouter subagents Claude Code.

### Critère de succès

`npm run dev`, `npm run build`, `npm run lint` fonctionnent.

---

## Phase 1 — Types et modèles

### Objectif

Stabiliser les types avant de coder l’UI.

### Tâches

1. Créer `src/types/tactical.ts`.
2. Créer `src/types/simulation.ts`.
3. Créer `src/types/agents.ts`.
4. Créer `src/types/skills.ts`.
5. Créer `src/types/mcp.ts`.
6. Ajouter tests de validation basiques.

### Critère de succès

Tous les modules peuvent importer les types sans circularité.

---

## Phase 2 — Scénarios

### Objectif

Créer les 3 scénarios déterministes.

### Tâches

1. Créer `drone-following-cargo.ts`.
2. Créer `ais-route-mismatch.ts`.
3. Créer `radar-loss.ts`.
4. Définir contacts initiaux.
5. Définir timeline.
6. Définir diagnostic attendu.
7. Définir objectifs pédagogiques.

### Critère de succès

Chaque scénario peut générer un état initial valide.

---

## Phase 3 — TacticalStateEngine

### Objectif

Faire évoluer la simulation tour par tour.

### Tâches

1. Créer état initial.
2. Implémenter `advanceTurn`.
3. Déplacer les contacts.
4. Ajouter historique des positions.
5. Appliquer événements de scénario.
6. Mettre à jour flags.
7. Mettre à jour suspicionScore.

### Critère de succès

La simulation avance sur 8 tours avec trajectoires cohérentes.

---

## Phase 4 — MCP simulés

### Objectif

Créer les sources de données utilisées par les agents.

### Tâches

1. Implémenter RadarMCP.
2. Implémenter AISMCP.
3. Implémenter OptronicMCP.
4. Implémenter ScenarioMCP.
5. Ajouter tests.

### Critère de succès

Chaque MCP retourne du JSON cohérent depuis TacticalState.

---

## Phase 5 — Skills

### Objectif

Créer les skills Markdown + TypeScript.

### Tâches

1. Créer dossiers `skills/*`.
2. Ajouter tous les `SKILL.md`.
3. Implémenter toutes les fonctions TypeScript.
4. Ajouter exemples JSON.
5. Ajouter tests unitaires.

### Critère de succès

Chaque skill peut être appelée indépendamment.

---

## Phase 6 — Agents mock

### Objectif

Créer des agents fonctionnels sans LLM.

### Tâches

1. Créer BaseAgent.
2. Créer GameMasterAgent.
3. Créer RadarAgent.
4. Créer NavigationAgent.
5. Créer OptronicAgent.
6. Créer ThreatAssessmentAgent.
7. Connecter agents aux MCP et skills.
8. Générer messages déterministes.

### Critère de succès

Les agents produisent des messages cohérents en mode mock.

---

## Phase 7 — Provider vLLM

### Objectif

Permettre l’utilisation de Qwen3.6 via vLLM.

### Tâches

1. Créer interface LLMProvider.
2. Créer MockLLMProvider.
3. Créer VLLMProvider.
4. Ajouter sélection par env var.
5. Ajouter fallback mock si vLLM indisponible.
6. Tester requête chat completions.

### Critère de succès

L’application fonctionne en mock et peut appeler vLLM si disponible.

---

## Phase 8 — Agent Runtime / orchestration

### Objectif

Orchestrer agents, skills et MCP.

### Tâches

1. Créer AgentRuntime.
2. Charger définitions agents.
3. Router instruction libre.
4. Appeler agent cible.
5. Appeler skill pertinente.
6. Ajouter réponse à agentMessages.
7. Respecter contraintes.

### Critère de succès

Une instruction joueur déclenche une réponse agent utile.

---

## Phase 9 — SuggestionEngine

### Objectif

Guider le joueur débutant.

### Tâches

1. Implémenter règles de suggestion.
2. Prioriser suggestions.
3. Ajouter descriptions pédagogiques.
4. Limiter à 5 suggestions.
5. Connecter UI.

### Critère de succès

Les suggestions changent selon la situation.

---

## Phase 10 — VisualAttentionEngine

### Objectif

Guider visuellement le joueur.

### Tâches

1. Calculer focus contact.
2. Définir zoom.
3. Activer trajectoires.
4. Activer relation lines.
5. Réagir aux événements.

### Critère de succès

La carte attire l’attention vers l’événement important.

---

## Phase 11 — UI carte tactique

### Objectif

Créer l’expérience visuelle principale.

### Tâches

1. Créer TacticalMap.
2. Dessiner grille.
3. Dessiner contacts stylisés.
4. Dessiner trajectoires.
5. Dessiner halos suspicion.
6. Dessiner relation lines.
7. Gérer sélection contact.
8. Ajouter animations.

### Critère de succès

La carte raconte visuellement le scénario.

---

## Phase 12 — UI gameplay

### Objectif

Assembler l’expérience joueur.

### Tâches

1. ScenarioSelector.
2. AgentConsole.
3. ActionSuggestions.
4. FreeInstructionInput.
5. Timeline.
6. ContactDetailsPanel.
7. DiagnosisPanel.
8. DebriefPanel.

### Critère de succès

Le joueur peut jouer une session complète.

---

## Phase 13 — API routes

### Objectif

Exposer la simulation via API Next.js.

### Tâches

1. `/api/simulation/start`.
2. `/api/simulation/step`.
3. `/api/simulation/action`.
4. `/api/simulation/diagnose`.
5. Gestion erreurs.
6. Validation entrées.

### Critère de succès

Le frontend peut piloter la simulation via API.

---

## Phase 14 — Scoring et débrief

### Objectif

Résoudre la partie et expliquer.

### Tâches

1. Implémenter ScoringEngine.
2. Calculer score.
3. Générer feedback.
4. Afficher bonne réponse.
5. Afficher indices manqués.
6. Afficher notion pédagogique.

### Critère de succès

Le joueur comprend pourquoi il a réussi ou échoué.

---

## Phase 15 — Polish

### Objectif

Rendre la démo agréable.

### Tâches

1. Ajouter animations.
2. Ajouter transitions.
3. Ajouter sons optionnels.
4. Améliorer textes.
5. Améliorer couleurs.
6. Vérifier responsive.
7. Corriger bugs.

### Critère de succès

L’application est présentable à des élèves.

---

## Phase 16 — Tests

### Objectif

Sécuriser la V1.

### Tests minimum

- TacticalStateEngine avance les tours ;
- chaque scénario est valide ;
- les contacts restent dans la carte ;
- les skills retournent un résultat ;
- les MCP retournent les données attendues ;
- SuggestionEngine propose les bonnes actions ;
- ScoringEngine donne un score cohérent ;
- VLLMProvider construit une requête valide.

---

# 22. Prompts prêts à donner à Claude Code

## Prompt initial

```txt
Tu es un assistant de développement senior. Tu dois implémenter Agent Us, un serious game naval multi-agents fictif inspiré de l’esprit Among Us.

Respecte strictement le document de plan de développement.

Commence par :
1. créer la structure projet,
2. créer les types TypeScript,
3. créer les scénarios,
4. créer TacticalStateEngine.

Ne commence pas par l’UI.

Contraintes :
- Next.js App Router,
- TypeScript strict,
- Tailwind,
- Zustand,
- Framer Motion,
- mock mode obligatoire,
- vLLM provider obligatoire,
- pas de données militaires réelles,
- pas d’armes,
- pas de règles d’engagement.
```

## Prompt pour la simulation

```txt
Implémente TacticalStateEngine et les 3 scénarios V1.

Les trajectoires doivent être cohérentes, déterministes, faciles à visualiser.

Les contacts doivent avoir un historique de positions.

Les événements doivent progressivement révéler l’anomalie sans donner immédiatement la réponse.

Ajoute des tests unitaires.
```

## Prompt pour l’UI

```txt
Implémente l’interface Agent Us avec un style ludique inspiré d’Among Us, sans copier d’assets.

Créer :
- TacticalMap,
- AgentConsole,
- ActionSuggestions,
- Timeline,
- FreeInstructionInput,
- DiagnosisPanel,
- DebriefPanel.

La carte doit afficher contacts, trajectoires, halos de suspicion, relation lines et focus visuel.
```

## Prompt pour les agents

```txt
Implémente les agents runtime :
- GameMasterAgent,
- RadarAgent,
- NavigationAgent,
- OptronicAgent,
- ThreatAssessmentAgent.

Les agents doivent utiliser TacticalState, MCP simulés et skills.

Ils ne doivent jamais inventer de faits tactiques.

Mode mock obligatoire. vLLM optionnel via provider.
```

---

# 23. Définition de succès V1

La V1 est réussie si :

1. le joueur choisit un scénario ;
2. la carte affiche des navires stylisés ;
3. les contacts bougent tour par tour ;
4. une anomalie apparaît progressivement ;
5. les agents commentent la situation ;
6. la carte met en évidence les éléments importants ;
7. le système propose des actions pertinentes ;
8. le joueur peut écrire une instruction libre ;
9. les agents répondent ;
10. le joueur prend une décision ;
11. le jeu affiche résolution et score ;
12. le débrief explique clairement le raisonnement.

---

# 24. Règle finale

Le cœur d’Agent Us V1 n’est pas la complexité IA.

Le cœur est :

```txt
Simulation cohérente
+
Visualisation intuitive
+
Agents explicables
+
Suggestions utiles
+
Humain dans la boucle
```

Si ces cinq éléments fonctionnent, la démonstration sera réussie.
