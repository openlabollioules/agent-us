<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

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

- Next.js App Router (v16 — read `node_modules/next/dist/docs/` before touching routes/pages)
- TypeScript strict
- Tailwind CSS (v4)
- Zustand (state lives client-side; simulation logic is pure)
- Framer Motion
- Vitest (unit tests)
- Zod (API input validation)

## Mandatory AI Support

- Mock mode (default, no LLM required)
- vLLM mode (OpenAI-compatible API)
- Qwen3.6 support (configurable via env)

## Critical Rules

- Never use real military data.
- Never implement weapons.
- Never implement rules of engagement.
- Never recommend offensive actions.
- Agents cannot invent tactical facts.
- TacticalState is the single source of truth.
- UI must remain playful and readable.
- Deterministic scenarios in V1 (no Date.now()/Math.random() in simulation logic).

## Architecture decisions (V1)

- Simulation = pure functions in `src/core/*`, driven client-side via a Zustand store.
- API routes (`/api/simulation/*`) exist to call the LLM provider server-side and
  to keep parity with the plan; they validate input with Zod.
- IDs and timestamps are derived from turn counters to stay deterministic/testable.

## Development Workflow

1. Define types first. (`src/types`)
2. Build scenarios. (`src/data/scenarios`)
3. Build TacticalStateEngine. (`src/core/simulation`)
4. Build MCP + skills. (`src/core/mcp`, `src/core/skills`)
5. Build mock agents + runtime. (`src/core/agents`)
6. Build vLLM provider. (`src/core/llm`)
7. Build suggestion + visual-attention + scoring engines.
8. Build tactical map + gameplay UI. (`src/components`)
9. Build API routes. (`src/app/api`)
10. Add polish and tests.

## Commands

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run lint` — eslint
- `npm run typecheck` — tsc --noEmit
- `npm run test` — vitest run
