import type { ContactCategory } from "@/types";

type ContactIconProps = {
  category: ContactCategory;
  fill: string;
  stroke: string;
};

/**
 * Icône vectorielle stylisée d'un contact, centrée sur l'origine (0,0) du
 * groupe parent. Formes ludiques, jamais des symboles militaires réalistes.
 */
export function ContactIcon({ category, fill, stroke }: ContactIconProps) {
  const common = { fill, stroke, strokeWidth: 2 };

  switch (category) {
    case "cargo":
      return <rect x={-26} y={-12} width={52} height={24} rx={5} {...common} />;
    case "surface_vessel":
    case "patrol_boat":
      return <rect x={-20} y={-10} width={40} height={20} rx={8} {...common} />;
    case "fishing_vessel":
      return <rect x={-12} y={-8} width={24} height={16} rx={6} {...common} />;
    case "usv_drone":
      return <polygon points="0,-16 14,12 -14,12" {...common} />;
    case "uav_drone":
      return <polygon points="0,-14 14,0 0,14 -14,0" {...common} />;
    case "submarine":
      return <ellipse cx={0} cy={0} rx={24} ry={9} {...common} opacity={0.6} />;
    case "unknown":
    default:
      return (
        <g>
          <circle cx={0} cy={0} r={14} {...common} />
          <text
            x={0}
            y={6}
            textAnchor="middle"
            fontSize={18}
            fontWeight={700}
            fill="#1e293b"
          >
            ?
          </text>
        </g>
      );
  }
}
