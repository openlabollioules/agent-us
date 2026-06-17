# Simulation Rules

- TacticalState is the single source of truth.
- Agents must not invent tactical facts; they interpret TacticalState.
- Scenarios must be deterministic (no Date.now()/Math.random()).
- Contact movements must be coherent and gradual (inertia + scripted effects).
- Anomalies must be visible and explainable.
