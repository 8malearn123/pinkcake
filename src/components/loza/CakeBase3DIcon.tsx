// Minimalist matte 3D-style cake icons — premium bakery aesthetic
// Soft shadows, flat fondant finish, no cartoon gradients

type Props = { id: string; className?: string };

const Defs = () => (
  <defs>
    {/* Matte fondant — soft cream with elegant vertical depth */}
    <linearGradient id="fondantSide" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#D9C9B0" />
      <stop offset="18%" stopColor="#F4EBDA" />
      <stop offset="55%" stopColor="#FBF6EE" />
      <stop offset="85%" stopColor="#E8DCC4" />
      <stop offset="100%" stopColor="#C9B89A" />
    </linearGradient>
    <radialGradient id="fondantTop" cx="32%" cy="22%" r="85%">
      <stop offset="0%" stopColor="#FFFFFF" />
      <stop offset="40%" stopColor="#FBF4E4" />
      <stop offset="100%" stopColor="#D9C8AC" />
    </radialGradient>
    {/* Subtle warm rim shadow under each tier */}
    <linearGradient id="rimShadow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#000" stopOpacity="0.18" />
      <stop offset="100%" stopColor="#000" stopOpacity="0" />
    </linearGradient>
    {/* Plate — deep matte */}
    <linearGradient id="plateSide" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#4A1F3D" />
      <stop offset="100%" stopColor="#2D0F22" />
    </linearGradient>
    {/* Subtle soft shadow */}
    <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
      <feOffset dx="0" dy="3" result="off" />
      <feComponentTransfer><feFuncA type="linear" slope="0.22" /></feComponentTransfer>
      <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
  </defs>
);

// Square plate viewed in perspective
const Plate = ({ cy = 100 }: { cy?: number }) => (
  <g>
    <ellipse cx={60} cy={cy + 4} rx={48} ry={6} fill="#000" opacity="0.12" />
    <path
      d={`M14,${cy - 2} L106,${cy - 2} L100,${cy + 6} L20,${cy + 6} Z`}
      fill="url(#plateSide)"
    />
    <path
      d={`M14,${cy - 2} L106,${cy - 2} L100,${cy + 6} L20,${cy + 6} Z`}
      fill="none" stroke="#000" strokeOpacity="0.2" strokeWidth="0.4"
    />
  </g>
);

// One matte cake tier — flat sides, soft top
const Tier = ({
  cx, cy, rx, ry, h,
}: { cx: number; cy: number; rx: number; ry: number; h: number }) => (
  <g>
    {/* Side wall */}
    <path
      d={`M${cx - rx},${cy}
          L${cx - rx},${cy + h}
          A${rx},${ry} 0 0 0 ${cx + rx},${cy + h}
          L${cx + rx},${cy}
          A${rx},${ry} 0 0 1 ${cx - rx},${cy} Z`}
      fill="url(#fondantSide)"
    />
    {/* Soft rim shadow just under the top ellipse */}
    <path
      d={`M${cx - rx},${cy}
          L${cx - rx},${cy + h * 0.32}
          A${rx},${ry * 1.05} 0 0 0 ${cx + rx},${cy + h * 0.32}
          L${cx + rx},${cy}
          A${rx},${ry} 0 0 1 ${cx - rx},${cy} Z`}
      fill="url(#rimShadow)"
    />
    {/* Top surface */}
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#fondantTop)" />
    {/* Glossy highlight crescent on top */}
    <path
      d={`M${cx - rx * 0.75},${cy - ry * 0.15}
          A${rx * 0.75},${ry * 0.55} 0 0 1 ${cx + rx * 0.35},${cy - ry * 0.55}`}
      stroke="#FFFFFF" strokeOpacity="0.55" strokeWidth="1.2" fill="none" strokeLinecap="round"
    />
    {/* Vertical glossy reflection on side */}
    <path
      d={`M${cx + rx * 0.35},${cy + ry * 0.3} L${cx + rx * 0.35},${cy + h - 2}`}
      stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round"
    />
    {/* Soft shadow on opposite side */}
    <path
      d={`M${cx - rx * 0.85},${cy + ry * 0.4} L${cx - rx * 0.85},${cy + h - 2}`}
      stroke="#000" strokeOpacity="0.1" strokeWidth="2" strokeLinecap="round"
    />
  </g>
);

export default function CakeBase3DIcon({ id, className }: Props) {
  return (
    <svg viewBox="0 0 120 115" className={className} xmlns="http://www.w3.org/2000/svg">
      <Defs />

      {id === 'classic' && (
        <g filter="url(#softShadow)">
          <Plate cy={98} />
          <Tier cx={60} cy={48} rx={32} ry={9} h={48} />
        </g>
      )}

      {id === 'tier-2' && (
        <g filter="url(#softShadow)">
          <Plate cy={100} />
          <Tier cx={60} cy={62} rx={38} ry={11} h={36} />
          <Tier cx={60} cy={34} rx={24} ry={7} h={26} />
        </g>
      )}

      {id === 'tier-3' && (
        <g filter="url(#softShadow)">
          <Plate cy={102} />
          <Tier cx={60} cy={72} rx={42} ry={11} h={28} />
          <Tier cx={60} cy={50} rx={30} ry={8} h={20} />
          <Tier cx={60} cy={32} rx={20} ry={6} h={16} />
        </g>
      )}

      {id === 'cupcakes' && (
        <g filter="url(#softShadow)">
          <Plate cy={100} />
          {/* Three cupcakes in a row */}
          {[28, 60, 92].map((x, i) => (
            <g key={i}>
              <path d={`M${x - 14},${94} L${x + 14},${94} L${x + 11},${70} L${x - 11},${70} Z`} fill="url(#plateSide)" />
              <ellipse cx={x} cy={68} rx={14} ry={4} fill="#F8C8D8" />
              <ellipse cx={x} cy={62} rx={11} ry={4} fill="#F8C8D8" />
              <ellipse cx={x} cy={56} rx={7} ry={3} fill="#F8C8D8" />
            </g>
          ))}
        </g>
      )}

      {id === 'number' && (
        <g filter="url(#softShadow)">
          <Plate cy={102} />
          {/* Stylized "8" — two stacked rings, matte */}
          <ellipse cx={60} cy={72} rx={26} ry={8} fill="url(#fondantSide)" />
          <path d={`M34,72 L34,80 A26,8 0 0 0 86,80 L86,72 A26,8 0 0 1 34,72 Z`} fill="url(#fondantSide)" />
          <ellipse cx={60} cy={72} rx={26} ry={8} fill="url(#fondantTop)" />
          <ellipse cx={60} cy={72} rx={10} ry={3} fill="#E8DCC8" />
          <ellipse cx={60} cy={42} rx={20} ry={7} fill="url(#fondantSide)" />
          <path d={`M40,42 L40,48 A20,7 0 0 0 80,48 L80,42 A20,7 0 0 1 40,42 Z`} fill="url(#fondantSide)" />
          <ellipse cx={60} cy={42} rx={20} ry={7} fill="url(#fondantTop)" />
          <ellipse cx={60} cy={42} rx={8} ry={2.5} fill="#E8DCC8" />
        </g>
      )}

      {id === 'blank' && (
        <g filter="url(#softShadow)">
          <Plate cy={102} />
          <ellipse cx={60} cy={68} rx={38} ry={10} fill="url(#fondantSide)" />
          <path d={`M22,68 L22,82 A38,10 0 0 0 98,82 L98,68 A38,10 0 0 1 22,68 Z`} fill="url(#fondantSide)" />
          <ellipse cx={60} cy={68} rx={38} ry={10} fill="url(#fondantTop)" stroke="#C9A084" strokeWidth="0.5" strokeDasharray="2 2" />
          <text x={60} y={73} textAnchor="middle" fontSize="14" fill="#C9A084">+</text>
        </g>
      )}
    </svg>
  );
}
