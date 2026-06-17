"use client";

import { motion } from "framer-motion";
import type { ContactTrack, TacticalState } from "@/types";
import { MAP_SIZE } from "@/core/simulation";
import { ContactIcon } from "./ContactIcon";
import {
  AFFILIATION_STROKE,
  CATEGORY_FILL,
  HALO_COLOR,
  suspicionTier,
} from "./contact-visuals";

export type TacticalMapProps = {
  state: TacticalState;
  selectedContactId?: string;
  onSelectContact?: (id: string) => void;
};

const MAP_CENTER = MAP_SIZE / 2;
const GRID_STEP = 100;

/** Transform "caméra" qui zoome/centre la carte sur le focus visuel. */
function cameraTransform(
  center: { x: number; y: number },
  zoom: number,
): string {
  const tx = MAP_CENTER - zoom * center.x;
  const ty = MAP_CENTER - zoom * center.y;
  return `translate(${tx} ${ty}) scale(${zoom})`;
}

function gridLines(): number[] {
  const lines: number[] = [];
  for (let v = GRID_STEP; v < MAP_SIZE; v += GRID_STEP) lines.push(v);
  return lines;
}

/**
 * TacticalMap — carte tactique 2D stylisée. Raconte visuellement le scénario :
 * contacts, trajectoires, liens relationnels, halos de suspicion et zoom de
 * mise en évidence pilotés par TacticalState.
 */
export function TacticalMap({
  state,
  selectedContactId,
  onSelectContact,
}: TacticalMapProps) {
  const focus = state.visualFocus;
  const camera = focus
    ? cameraTransform(focus.center, focus.zoom)
    : `translate(0 0) scale(1)`;
  const focusIds = new Set(focus?.contactIds ?? []);
  const byId = new Map(state.contacts.map((c) => [c.id, c]));

  const showTrajectory = (c: ContactTrack) =>
    c.id === selectedContactId ||
    c.isUnderWatch ||
    (!!focus?.showTrajectories && focusIds.has(c.id));

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
      <svg
        viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}
        className="h-full w-full"
        role="img"
        aria-label="Carte tactique"
      >
        {/* Fond */}
        <rect width={MAP_SIZE} height={MAP_SIZE} fill="#020617" />

        {/* Grille */}
        <g stroke="#1e293b" strokeWidth={1}>
          {gridLines().map((v) => (
            <line key={`v-${v}`} x1={v} y1={0} x2={v} y2={MAP_SIZE} />
          ))}
          {gridLines().map((v) => (
            <line key={`h-${v}`} x1={0} y1={v} x2={MAP_SIZE} y2={v} />
          ))}
        </g>

        <g
          transform={camera}
          style={{ transition: "transform 0.6s ease", transformOrigin: "0 0" }}
        >
          {/* Liens relationnels (ex : USV ↔ cargo suivi) */}
          {state.contacts.map((c) => {
            if (!c.relationTargetId) return null;
            const target = byId.get(c.relationTargetId);
            if (!target) return null;
            const visible =
              focus?.showRelationLines || c.id === selectedContactId;
            if (!visible) return null;
            return (
              <line
                key={`rel-${c.id}`}
                x1={c.position.x}
                y1={c.position.y}
                x2={target.position.x}
                y2={target.position.y}
                stroke="#f97316"
                strokeWidth={2}
                strokeDasharray="8 6"
                opacity={0.7}
              />
            );
          })}

          {/* Trajectoires (historique des positions) */}
          {state.contacts.map((c) =>
            showTrajectory(c) && c.history.length > 1 ? (
              <polyline
                key={`traj-${c.id}`}
                points={c.history.map((h) => `${h.position.x},${h.position.y}`).join(" ")}
                fill="none"
                stroke="#475569"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
            ) : null,
          )}

          {/* Contacts */}
          {state.contacts.map((c) => {
            const tier = suspicionTier(c);
            const haloColor = HALO_COLOR[tier];
            const isSelected = c.id === selectedContactId;

            return (
              <motion.g
                key={c.id}
                data-contact-id={c.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, x: c.position.x, y: c.position.y }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                onClick={() => onSelectContact?.(c.id)}
                className="cursor-pointer"
              >
                {tier !== "none" && (
                  <motion.circle
                    cx={0}
                    cy={0}
                    r={34}
                    fill={haloColor}
                    initial={{ opacity: 0.25, scale: 0.9 }}
                    animate={
                      tier === "high"
                        ? { opacity: [0.35, 0.1, 0.35], scale: [0.95, 1.25, 0.95] }
                        : { opacity: 0.22, scale: 1 }
                    }
                    transition={
                      tier === "high"
                        ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
                        : { duration: 0.4 }
                    }
                  />
                )}

                {isSelected && (
                  <circle
                    cx={0}
                    cy={0}
                    r={30}
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth={2}
                    strokeDasharray="3 4"
                  />
                )}

                <ContactIcon
                  category={c.category}
                  fill={CATEGORY_FILL[c.category]}
                  stroke={AFFILIATION_STROKE[c.affiliation]}
                />

                <text
                  x={0}
                  y={34}
                  textAnchor="middle"
                  fontSize={16}
                  fill="#e2e8f0"
                >
                  {c.id}
                </text>
              </motion.g>
            );
          })}
        </g>
      </svg>

      {focus?.reason && (
        <div className="pointer-events-none absolute left-3 top-3 rounded-md bg-slate-900/80 px-3 py-1 text-xs font-medium text-amber-300">
          🔍 {focus.reason}
        </div>
      )}
    </div>
  );
}
