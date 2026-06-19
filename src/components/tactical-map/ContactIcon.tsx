import type { ContactCategory } from "@/types";

type ContactIconProps = {
  category: ContactCategory;
  fill: string;
  stroke: string;
  headingDeg: number;
};

/** Teinte sombre commune pour les détails de pont (ponts, passerelles…). */
const DECK = "#0b1626";
/** Couleurs de conteneurs sur le pont du cargo. */
const CONTAINERS = ["#d97706", "#15803d", "#b91c1c", "#0369a1"];

/** Sillage discret derrière la poupe (vers +Y, l'arrière du navire). */
function Wake() {
  return (
    <path d="M-6,22 L0,48 L6,22 Z" fill="#e0f2fe" opacity={0.07} />
  );
}

function Cargo({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <g>
      <Wake />
      <path
        d="M0,-32 C6,-25 9,-16 9,-8 L9,24 C9,28 5,30 0,30 C-5,30 -9,28 -9,24 L-9,-8 C-9,-16 -6,-25 0,-32 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth={2}
      />
      {/* Conteneurs sur le pont */}
      {[-6, 1, 8, 15].map((y, row) =>
        [-5.5, 0.5].map((x, col) => (
          <rect
            key={`${row}-${col}`}
            x={x}
            y={y}
            width={5}
            height={5}
            rx={0.8}
            fill={CONTAINERS[(row + col) % CONTAINERS.length]}
            opacity={0.9}
          />
        )),
      )}
      {/* Passerelle à la poupe */}
      <rect x={-6} y={21} width={12} height={6} rx={1} fill={DECK} />
    </g>
  );
}

function Warship({
  fill,
  stroke,
  length = 26,
  beam = 6,
}: {
  fill: string;
  stroke: string;
  length?: number;
  beam?: number;
}) {
  const stern = length * 0.85;
  return (
    <g>
      <Wake />
      <path
        d={`M0,${-length} C${beam * 0.7},${-length * 0.75} ${beam},${-length * 0.4} ${beam},${-length * 0.15} L${beam},${stern - 4} C${beam},${stern} ${beam * 0.5},${stern} 0,${stern} C${-beam * 0.5},${stern} ${-beam},${stern} ${-beam},${stern - 4} L${-beam},${-length * 0.15} C${-beam},${-length * 0.4} ${-beam * 0.7},${-length * 0.75} 0,${-length} Z`}
        fill={fill}
        stroke={stroke}
        strokeWidth={2}
      />
      {/* Superstructure */}
      <rect x={-3} y={-2} width={6} height={11} rx={1.2} fill={DECK} />
      <rect x={-1.5} y={2} width={3} height={4} fill="#1f2937" />
    </g>
  );
}

function FishingBoat({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <g>
      <Wake />
      <path
        d="M0,-14 C3,-10 4,-5 4,-1 L4,11 C4,14 2,15 0,15 C-2,15 -4,14 -4,11 L-4,-1 C-4,-5 -3,-10 0,-14 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth={1.8}
      />
      <rect x={-2.5} y={1} width={5} height={6} rx={1} fill={DECK} />
    </g>
  );
}

function UsvDrone({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <g>
      <Wake />
      <path
        d="M0,-17 L4.5,-4 L3.5,13 L-3.5,13 L-4.5,-4 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth={1.6}
      />
      <circle cx={0} cy={2} r={1.8} fill={DECK} />
    </g>
  );
}

function Submarine({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <g opacity={0.7}>
      <ellipse cx={0} cy={0} rx={6} ry={26} fill={fill} stroke={stroke} strokeWidth={1.6} />
      {/* Kiosque */}
      <rect x={-2.5} y={-7} width={5} height={11} rx={2} fill={DECK} />
    </g>
  );
}

function UavDrone({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <g>
      {/* Cercle "aéroporté" */}
      <circle cx={0} cy={0} r={18} fill="none" stroke={stroke} strokeWidth={1} strokeDasharray="2 4" opacity={0.5} />
      {/* Fuselage + ailes en flèche */}
      <path d="M0,-14 L2.5,6 L0,12 L-2.5,6 Z" fill={fill} stroke={stroke} strokeWidth={1.2} />
      <path d="M0,-2 L16,6 L16,8 L0,4 Z" fill={fill} opacity={0.9} />
      <path d="M0,-2 L-16,6 L-16,8 L0,4 Z" fill={fill} opacity={0.9} />
      <path d="M0,8 L6,12 L6,13 L0,11 Z" fill={fill} opacity={0.9} />
      <path d="M0,8 L-6,12 L-6,13 L0,11 Z" fill={fill} opacity={0.9} />
    </g>
  );
}

function UnknownContact({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <g>
      <circle cx={0} cy={0} r={13} fill={fill} stroke={stroke} strokeWidth={2} />
      <text x={0} y={6} textAnchor="middle" fontSize={17} fontWeight={700} fill={DECK}>
        ?
      </text>
    </g>
  );
}

/**
 * Icône de contact = silhouette de navire vue de dessus, orientée selon le cap
 * (proue vers le cap). Le texte (id) reste géré par le parent et ne tourne pas.
 */
export function ContactIcon({ category, fill, stroke, headingDeg }: ContactIconProps) {
  const body = (() => {
    switch (category) {
      case "cargo":
        return <Cargo fill={fill} stroke={stroke} />;
      case "patrol_boat":
        return <Warship fill={fill} stroke={stroke} length={24} beam={5.5} />;
      case "surface_vessel":
        return <Warship fill={fill} stroke={stroke} length={28} beam={7} />;
      case "fishing_vessel":
        return <FishingBoat fill={fill} stroke={stroke} />;
      case "usv_drone":
        return <UsvDrone fill={fill} stroke={stroke} />;
      case "submarine":
        return <Submarine fill={fill} stroke={stroke} />;
      case "uav_drone":
        return <UavDrone fill={fill} stroke={stroke} />;
      default:
        return <UnknownContact fill={fill} stroke={stroke} />;
    }
  })();

  // L'aérien et le contact inconnu (non directionnel) ne pivotent pas.
  const rotates = category !== "uav_drone" && category !== "unknown";
  return rotates ? <g transform={`rotate(${headingDeg})`}>{body}</g> : body;
}
