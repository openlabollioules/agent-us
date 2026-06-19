"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { ContactTrack, TacticalState } from "@/types";
import { MAP_SIZE } from "@/core/simulation";
import { ContactIcon } from "./ContactIcon";
import {
  AFFILIATION_STROKE,
  CATEGORY_FILL,
  CATEGORY_LABEL,
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

type House = { x: number; y: number; roof: string };
type Landmass = {
  d: string;
  lighthouse?: { x: number; y: number };
  houses?: House[];
};

/** Côtes stylisées (coordonnées monde 0..MAP_SIZE, Y vers le bas). */
const LANDMASSES: Landmass[] = [
  {
    // Côte nord-est (zone côtière des scénarios)
    d: "M1000,0 L1000,300 C 915,300 875,225 900,165 C 918,118 868,70 760,62 C 700,57 662,22 652,0 Z",
    lighthouse: { x: 705, y: 60 },
    houses: [
      { x: 845, y: 150, roof: "#dc2626" },
      { x: 885, y: 185, roof: "#2563eb" },
      { x: 925, y: 230, roof: "#ea580c" },
    ],
  },
  {
    // Côte sud-ouest
    d: "M0,1000 L0,715 C 95,705 152,758 172,832 C 188,892 128,952 0,1000 Z",
    houses: [
      { x: 70, y: 875, roof: "#ea580c" },
      { x: 110, y: 825, roof: "#dc2626" },
    ],
  },
  {
    // Îlot sud-est
    d: "M1000,1000 L1000,818 C 928,840 898,902 920,958 C 936,986 970,996 1000,1000 Z",
    houses: [{ x: 958, y: 932, roof: "#2563eb" }],
  },
];

/** Bouées de navigation (couleur babord/tribord), repères en mer. */
const BUOYS = [
  { x: 430, y: 470, color: "#ef4444" },
  { x: 560, y: 540, color: "#22c55e" },
  { x: 360, y: 640, color: "#22c55e" },
];

function cameraTransform(
  center: { x: number; y: number },
  zoom: number,
): string {
  // Borne basse de translation pour que la vue reste DANS le monde :
  // on ne panne jamais au-delà des bords → les îles de coin restent visibles.
  const min = MAP_SIZE * (1 - zoom);
  const clamp = (v: number) => Math.min(0, Math.max(min, v));
  const tx = clamp(MAP_CENTER - zoom * center.x);
  const ty = clamp(MAP_CENTER - zoom * center.y);
  return `translate(${tx} ${ty}) scale(${zoom})`;
}

function gridLines(): number[] {
  const lines: number[] = [];
  for (let v = GRID_STEP; v < MAP_SIZE; v += GRID_STEP) lines.push(v);
  return lines;
}

const RANGE_RINGS = [150, 300, 450];

/** Moutons d'écume disséminés (positions déterministes). */
const WHITECAPS = Array.from({ length: 22 }, (_, i) => ({
  x: ((i * 149 + 60) % 940) + 30,
  y: ((i * 223 + 90) % 900) + 50,
  s: 0.7 + ((i * 7) % 5) / 8,
}));

/** Lignes de houle (y) traversant la mer. */
const SWELLS = [170, 360, 560, 770];

function swellPath(y: number): string {
  let d = `M0 ${y}`;
  for (let k = 0; k < 5; k++) d += " q 50 -9 100 0 q 50 9 100 0";
  return d;
}

/**
 * TacticalMap — carte tactique maritime stylisée : océan (dégradé de
 * profondeur), côtes et eaux peu profondes, anneaux radar, puis la couche
 * tactique (contacts, trajectoires, liens, halos de suspicion) avec zoom de
 * mise en évidence piloté par TacticalState.
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
  const [hoveredId, setHoveredId] = useState<string | undefined>(undefined);
  const hovered = hoveredId ? byId.get(hoveredId) : undefined;

  const showTrajectory = (c: ContactTrack) =>
    c.id === selectedContactId ||
    c.isUnderWatch ||
    (!!focus?.showTrajectories && focusIds.has(c.id));

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-slate-700 shadow-inner shadow-black/40">
      <svg
        viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}
        className="h-full w-full"
        role="img"
        aria-label="Carte tactique maritime"
      >
        <defs>
          <linearGradient id="ocean" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0a2a44" />
            <stop offset="55%" stopColor="#082338" />
            <stop offset="100%" stopColor="#05172a" />
          </linearGradient>
          <radialGradient id="oceanGlow" cx="50%" cy="48%" r="60%">
            <stop offset="0%" stopColor="#155e85" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#0c3a59" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#05172a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="land" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4f9258" />
            <stop offset="55%" stopColor="#357045" />
            <stop offset="100%" stopColor="#1f4a2c" />
          </linearGradient>
          <filter id="contactShadow" x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" floodColor="#000814" floodOpacity="0.6" />
          </filter>
          {/* Texture de l'eau (bruit fractal teinté en clair) */}
          <filter id="water" x="0" y="0" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.02"
              numOctaves={3}
              seed={11}
              result="noise"
            />
            <feColorMatrix
              in="noise"
              type="matrix"
              values="0 0 0 0 0.35
                      0 0 0 0 0.58
                      0 0 0 0 0.78
                      0.6 0 0 0 -0.2"
            />
          </filter>
          {/* Faisceau de balayage sonar (clair près du capteur, fondu au bord) */}
          <radialGradient
            id="sweep"
            gradientUnits="userSpaceOnUse"
            cx={MAP_CENTER}
            cy={MAP_CENTER}
            r="460"
          >
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Océan (couvre tout le viewport, hors caméra) */}
        <rect width={MAP_SIZE} height={MAP_SIZE} fill="url(#ocean)" />
        <rect
          width={MAP_SIZE}
          height={MAP_SIZE}
          filter="url(#water)"
          opacity={0.12}
        />
        <rect width={MAP_SIZE} height={MAP_SIZE} fill="url(#oceanGlow)" />

        <g
          transform={camera}
          style={{ transition: "transform 0.6s ease", transformOrigin: "0 0" }}
        >
          {/* Houle + moutons d'écume (sous les côtes : la terre les masque) */}
          <g pointerEvents="none">
            {SWELLS.map((y) => (
              <path
                key={`swell-${y}`}
                d={swellPath(y)}
                fill="none"
                stroke="#5b9bd5"
                strokeWidth={2}
                opacity={0.08}
              />
            ))}
            <motion.g
              animate={{ opacity: [0.18, 0.34, 0.18] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              {WHITECAPS.map((w, i) => (
                <path
                  key={`cap-${i}`}
                  d={`M${w.x - 7 * w.s},${w.y} q${7 * w.s},${-5 * w.s} ${14 * w.s},0`}
                  fill="none"
                  stroke="#cfe8ff"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              ))}
            </motion.g>
          </g>

          {/* Eaux peu profondes (anneaux turquoise translucides, sans filtre :
              aucun artefact de découpe au zoom) */}
          {LANDMASSES.map((land, i) => (
            <g key={`shallow-${i}`} fill="none">
              <path d={land.d} stroke="#2dd4bf" strokeWidth={30} opacity={0.1} />
              <path d={land.d} stroke="#5eead4" strokeWidth={16} opacity={0.16} />
            </g>
          ))}

          {/* Écume du littoral */}
          {LANDMASSES.map((land, i) => (
            <path
              key={`foam-${i}`}
              d={land.d}
              fill="none"
              stroke="#eef6ff"
              strokeWidth={5}
              opacity={0.4}
            />
          ))}

          {/* Terres : intérieur vert + plage (contour sable) + phare.
              Tout est dans le groupe caméra → bouge avec le zoom de focus. */}
          {LANDMASSES.map((land, i) => (
            <g key={`land-${i}`}>
              <path
                d={land.d}
                fill="url(#land)"
                stroke="#c2a36a"
                strokeWidth={6}
                strokeLinejoin="round"
              />
              {land.houses?.map((h, j) => (
                <House key={j} x={h.x} y={h.y} roof={h.roof} />
              ))}
              {land.lighthouse && (
                <Lighthouse x={land.lighthouse.x} y={land.lighthouse.y} />
              )}
            </g>
          ))}

          {/* Bouées de navigation (en mer) */}
          {BUOYS.map((b, i) => (
            <Buoy key={`buoy-${i}`} x={b.x} y={b.y} color={b.color} />
          ))}

          {/* Grille */}
          <g stroke="#9fc4e0" strokeWidth={1} opacity={0.06}>
            {gridLines().map((v) => (
              <line key={`v-${v}`} x1={v} y1={0} x2={v} y2={MAP_SIZE} />
            ))}
            {gridLines().map((v) => (
              <line key={`h-${v}`} x1={0} y1={v} x2={MAP_SIZE} y2={v} />
            ))}
          </g>

          {/* Anneaux radar + capteur central */}
          <g
            fill="none"
            stroke="#38bdf8"
            strokeWidth={1}
            opacity={0.12}
            pointerEvents="none"
          >
            {RANGE_RINGS.map((r) => (
              <circle key={`ring-${r}`} cx={MAP_CENTER} cy={MAP_CENTER} r={r} />
            ))}
            <line x1={MAP_CENTER} y1={40} x2={MAP_CENTER} y2={MAP_SIZE - 40} />
            <line x1={40} y1={MAP_CENTER} x2={MAP_SIZE - 40} y2={MAP_CENTER} />
          </g>
          <motion.circle
            cx={MAP_CENTER}
            cy={MAP_CENTER}
            r={6}
            fill="#38bdf8"
            animate={{ opacity: [0.9, 0.3, 0.9] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Balayage sonar rotatif (apex au centre, pivot sur le centre) */}
          <motion.g
            pointerEvents="none"
            style={{
              transformBox: "view-box",
              transformOrigin: `${MAP_CENTER}px ${MAP_CENTER}px`,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          >
            <polygon
              points={`${MAP_CENTER},${MAP_CENTER} ${MAP_CENTER},${MAP_CENTER - 460} ${MAP_CENTER - 296},${MAP_CENTER - 352}`}
              fill="url(#sweep)"
            />
            <line
              x1={MAP_CENTER}
              y1={MAP_CENTER}
              x2={MAP_CENTER}
              y2={MAP_CENTER - 460}
              stroke="#7dd3fc"
              strokeWidth={1.5}
              opacity={0.4}
            />
          </motion.g>

          {/* Onde de ping périodique */}
          <motion.circle
            cx={MAP_CENTER}
            cy={MAP_CENTER}
            fill="none"
            stroke="#38bdf8"
            strokeWidth={2}
            pointerEvents="none"
            animate={{ r: [10, 460], opacity: [0.45, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeOut" }}
          />

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
                opacity={0.75}
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
                stroke="#93c5fd"
                strokeWidth={2}
                strokeDasharray="4 5"
                opacity={0.6}
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
                whileHover={{ scale: 1.18 }}
                onHoverStart={() => setHoveredId(c.id)}
                onHoverEnd={() => setHoveredId(undefined)}
                onClick={() => onSelectContact?.(c.id)}
                className="cursor-pointer"
              >
                {/* Blip de détection (onde unique au montage) */}
                <motion.circle
                  cx={0}
                  cy={0}
                  fill="none"
                  stroke="#7dd3fc"
                  strokeWidth={2}
                  initial={{ r: 6, opacity: 0.7 }}
                  animate={{ r: 46, opacity: 0 }}
                  transition={{ duration: 1.1, ease: "easeOut" }}
                />

                {tier !== "none" && (
                  <motion.circle
                    cx={0}
                    cy={0}
                    r={34}
                    fill={haloColor}
                    initial={{ opacity: 0.25, scale: 0.9 }}
                    animate={
                      tier === "high"
                        ? { opacity: [0.4, 0.12, 0.4], scale: [0.95, 1.3, 0.95] }
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

                <g filter="url(#contactShadow)">
                  <ContactIcon
                    category={c.category}
                    fill={CATEGORY_FILL[c.category]}
                    stroke={AFFILIATION_STROKE[c.affiliation]}
                    headingDeg={c.headingDeg}
                  />
                </g>

                <text
                  x={0}
                  y={36}
                  textAnchor="middle"
                  fontSize={15}
                  fontWeight={600}
                  fill="#e2e8f0"
                  stroke="#04121f"
                  strokeWidth={0.6}
                  paintOrder="stroke"
                >
                  {c.id}
                </text>
              </motion.g>
            );
          })}

          {/* Infobulle au survol */}
          {hovered && (
            <g
              transform={`translate(${hovered.position.x} ${hovered.position.y})`}
              pointerEvents="none"
            >
              <rect
                x={16}
                y={-50}
                width={210}
                height={56}
                rx={8}
                fill="#0b1626"
                stroke="#334155"
                opacity={0.96}
              />
              <text x={26} y={-30} fontSize={15} fontWeight={700} fill="#e2e8f0">
                {hovered.id} · {CATEGORY_LABEL[hovered.category]}
              </text>
              <text x={26} y={-11} fontSize={13} fill="#94a3b8">
                Suspicion {Math.round(hovered.suspicionScore * 100)} % ·{" "}
                {hovered.affiliation}
              </text>
            </g>
          )}
        </g>
      </svg>

      {/* HUD : focus, boussole, légende */}
      {focus?.reason && (
        <div className="pointer-events-none absolute left-3 top-3 rounded-md border border-amber-500/30 bg-slate-950/75 px-3 py-1 text-xs font-medium text-amber-300 backdrop-blur">
          🔍 {focus.reason}
        </div>
      )}

      <div className="pointer-events-none absolute right-3 top-3 flex flex-col items-center text-slate-300">
        <span className="text-[10px] font-semibold tracking-widest">N</span>
        <span className="-mt-1 text-lg leading-none">↑</span>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 flex gap-3 rounded-md border border-slate-700/60 bg-slate-950/70 px-2.5 py-1 text-[10px] text-slate-300 backdrop-blur">
        <Legend color="#4ade80" label="Allié" />
        <Legend color="#cbd5e1" label="Neutre" />
        <Legend color="#fbbf24" label="Inconnu" />
      </div>
    </div>
  );
}

/** Petite maison (toit coloré) — touche de couleur sur les îles. */
function House({ x, y, roof }: { x: number; y: number; roof: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-6} y={-3} width={12} height={9} rx={1} fill="#e7d8b8" stroke="#7c6f57" strokeWidth={0.6} />
      <polygon points="-8,-3 0,-12 8,-3" fill={roof} stroke="#1f2937" strokeWidth={0.6} />
    </g>
  );
}

/** Bouée de navigation (repère coloré flottant). */
function Buoy({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx={0} cy={8} rx={9} ry={3} fill="#0b1626" opacity={0.3} />
      <rect x={-1.5} y={-12} width={3} height={10} fill={color} />
      <circle cx={0} cy={0} r={6} fill={color} stroke="#0b1626" strokeWidth={1} />
      <circle cx={-1.8} cy={-1.8} r={1.8} fill="#ffffff" opacity={0.6} />
    </g>
  );
}

/** Phare côtier à lumière pulsée. */
function Lighthouse({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <motion.circle
        cx={0}
        cy={-30}
        r={15}
        fill="#fde68a"
        animate={{ opacity: [0.15, 0.5, 0.15] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <polygon
        points="-5,0 5,0 4,-26 -4,-26"
        fill="#e5e7eb"
        stroke="#475569"
        strokeWidth={1}
      />
      <rect x={-4} y={-20} width={8} height={4} fill="#dc2626" />
      <rect x={-4} y={-11} width={8} height={4} fill="#dc2626" />
      <rect
        x={-4}
        y={-32}
        width={8}
        height={6}
        rx={1}
        fill="#fbbf24"
        stroke="#475569"
        strokeWidth={0.6}
      />
    </g>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
