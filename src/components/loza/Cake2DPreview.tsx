import { useMemo, useId } from 'react';
import { cn } from '@/lib/utils';

interface Cake2DPreviewProps {
  baseId: string | null;
  colors: string[];
  flavorTones?: string[];
  designId: string | null;
  text?: string;
  hasPrint?: boolean;
  className?: string;
}

/* ── helpers ── */
function shade(hex: string, percent: number): string {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const num = parseInt(h, 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + Math.round(255 * (percent / 100))));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * (percent / 100))));
  const b = Math.max(0, Math.min(255, (num & 0xff) + Math.round(255 * (percent / 100))));
  return `rgb(${r}, ${g}, ${b})`;
}

interface TierSpec { w: number; h: number; }
const BASE_TIERS: Record<string, TierSpec[]> = {
  classic:  [{ w: 230, h: 110 }],
  'tier-2': [{ w: 250, h: 80 }, { w: 175, h: 72 }],
  'tier-3': [{ w: 265, h: 65 }, { w: 200, h: 60 }, { w: 135, h: 55 }],
  cupcakes: [{ w: 130, h: 90 }],
  number:   [{ w: 220, h: 80 }],
  blank:    [{ w: 230, h: 100 }],
};

export default function Cake2DPreview({
  baseId, colors, flavorTones = [], designId, text, hasPrint, className,
}: Cake2DPreviewProps) {
  const tiers = BASE_TIERS[baseId || 'classic'];
  const c1 = colors[0] || '#F5E6C4';
  const c2 = colors[1] || c1;
  const c3 = colors[2] || c2;
  const tierColors = [c1, c2, c3];

  const filling = flavorTones[0] || '#E8C9A0';
  const filling2 = flavorTones[1] || filling;

  const VB_W = 360;
  const VB_H = 340;

  // Layout: stack tiers, each tier rendered as a cylinder. Top ellipse ry = w * 0.13.
  const layout = useMemo(() => {
    const plateY = 295; // bottom of bottom tier (front edge)
    let bottomY = plateY;
    const stacked = tiers.map((t, i) => {
      const ry = t.w * 0.13;
      const topY = bottomY - t.h; // y of top ellipse center
      const next = topY - ry * 0.85; // sit next tier slightly inside top ellipse
      const item = {
        ...t,
        rx: t.w / 2,
        ry,
        cx: VB_W / 2,
        topY,
        bottomY,
        color: tierColors[i] || tierColors[0],
        fill: i % 2 === 0 ? filling : filling2,
        index: i,
      };
      bottomY = next;
      return item;
    });
    return { plateY, stacked };
  }, [tiers, c1, c2, c3, filling, filling2]);

  const { plateY, stacked } = layout;
  const topTier = stacked[stacked.length - 1];

  // Special renders
  if (baseId === 'cupcakes') {
    return (
      <Scene className={className}>
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full h-full">
          <Defs />
          <ellipse cx={VB_W / 2} cy={plateY + 18} rx="140" ry="14" fill="rgba(61,43,26,0.22)" />
          <g transform={`translate(${VB_W / 2} 195) scale(4.6) translate(-180 -170)`}>
            <Cupcake cx={180} cy={170} frosting={c1} liner={c2} sprinkle={c3} designId={designId} />
          </g>
          <g>
            <circle cx={VB_W - 50} cy={55} r="28" fill="#fff" stroke={shade(c1, -20)} strokeWidth="2" />
            <text x={VB_W - 50} y={63} textAnchor="middle" fontSize="22" fontWeight="800" fill={shade(c1, -30)} fontFamily="Cairo, sans-serif">×12</text>
          </g>
        </svg>
      </Scene>
    );
  }

  if (baseId === 'number') {
    return (
      <Scene className={className}>
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full h-full">
          <Defs />
          <ellipse cx={VB_W / 2} cy={310} rx="155" ry="12" fill="rgba(61,43,26,0.22)" />
          <NumberCake colorA={c1} colorB={c2} accent={c3} designId={designId} />
          {text && <CakeText text={text} cx={VB_W / 2} cy={315} />}
        </svg>
      </Scene>
    );
  }

  return (
    <Scene className={className}>
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <Defs />

        {/* Floor cast shadow */}
        <ellipse cx={VB_W / 2} cy={plateY + 22} rx={(stacked[0].w / 2) + 28} ry={14} fill="rgba(61,43,26,0.28)" filter="url(#shadowBlur)" />

        {/* Ceramic plate */}
        <Plate cx={VB_W / 2} cy={plateY + 8} rx={(stacked[0].w / 2) + 30} />

        {/* Tiers bottom → top */}
        {stacked.map((t) => (
          <CakeTier key={t.index} tier={t} designId={designId} />
        ))}

        {/* Top decorations on highest tier */}
        {topTier && designId === 'roses' && <TopRoses cx={topTier.cx} y={topTier.topY} w={topTier.w} />}
        {topTier && designId === 'cartoon' && <CartoonTop cx={topTier.cx} y={topTier.topY} />}
        {topTier && designId === 'floral' && <FloralTop cx={topTier.cx} y={topTier.topY} />}
        {topTier && designId === 'geometric' && <GeometricTop cx={topTier.cx} y={topTier.topY} w={topTier.w} />}
        {topTier && designId === 'minimal' && <MinimalTop cx={topTier.cx} y={topTier.topY} />}

        {/* Candle */}
        {topTier && <Candle cx={topTier.cx} y={topTier.topY - topTier.ry * 0.3} />}

        {/* Photo print on the front of bottom tier */}
        {hasPrint && stacked[0] && <PrintFrame tier={stacked[0]} />}

        {/* Writing — on the front face of bottom tier */}
        {text && stacked[0] && (
          <CakeText
            text={text}
            cx={stacked[0].cx}
            cy={stacked[0].bottomY - stacked[0].h * 0.32}
          />
        )}
      </svg>
    </Scene>
  );
}

/* ─────────── Scene wrapper (no CSS tilt; SVG is already isometric) ─────────── */
function Scene({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn('relative w-full h-full flex items-center justify-center', className)}
      style={{
        background:
          'radial-gradient(120% 80% at 50% 12%, rgba(255,255,255,0.85), rgba(255,236,238,0.4) 55%, rgba(212,165,165,0.18) 100%)',
      }}
    >
      <div className="w-full h-full">{children}</div>
    </div>
  );
}

/* ─────────── SVG Defs ─────────── */
function Defs() {
  return (
    <defs>
      <radialGradient id="plateGrad" cx="50%" cy="38%" r="55%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="55%" stopColor="#f4ede0" />
        <stop offset="100%" stopColor="#cdbf9e" />
      </radialGradient>
      <linearGradient id="plateRim" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fffaf0" />
        <stop offset="1" stopColor="#a7967a" />
      </linearGradient>
      <radialGradient id="goldShine" cx="0.5" cy="0.4" r="0.55">
        <stop offset="0%" stopColor="#fff6b8" />
        <stop offset="55%" stopColor="#e9c25c" />
        <stop offset="100%" stopColor="#8a6418" />
      </radialGradient>
      <filter id="shadowBlur" x="-20%" y="-50%" width="140%" height="200%">
        <feGaussianBlur stdDeviation="4" />
      </filter>
      <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" />
      </filter>
    </defs>
  );
}

/* ─────────── Plate ─────────── */
function Plate({ cx, cy, rx }: { cx: number; cy: number; rx: number }) {
  const ry = rx * 0.18;
  return (
    <g>
      {/* base */}
      <ellipse cx={cx} cy={cy + 4} rx={rx + 4} ry={ry + 3} fill="url(#plateRim)" />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#plateGrad)" />
      {/* inner ring */}
      <ellipse cx={cx} cy={cy - 1} rx={rx - 10} ry={ry - 4} fill="none" stroke="#c9b48c" strokeWidth="0.6" opacity="0.55" />
      {/* shine */}
      <ellipse cx={cx - rx * 0.32} cy={cy - ry * 0.55} rx={rx * 0.35} ry={ry * 0.3} fill="#ffffff" opacity="0.55" />
    </g>
  );
}

/* ─────────── Realistic cake tier as a 3D cylinder ─────────── */
function CakeTier({ tier, designId }: { tier: any; designId: string | null }) {
  const uid = useId().replace(/:/g, '');
  const { cx, topY, bottomY, rx, ry, w, h, color, fill } = tier;

  // Bands: frosting on top portion, sponge on bottom; filling stripe in middle of sponge
  const frostingH = Math.max(18, h * 0.32);
  const spongeH = h - frostingH;
  const frostingBottomY = topY + frostingH;
  const fillingH = Math.max(5, spongeH * 0.16);
  const fillingTopY = frostingBottomY + spongeH * 0.45;

  const dark = shade(color, -28);
  const mid = shade(color, -10);
  const light = shade(color, 14);
  const sponge = shade(fill, 6);
  const spongeDark = shade(fill, -22);
  const fillingMid = shade(fill, -8);
  const fillingDark = shade(fill, -28);

  // Helper to build a "band" path between two y values, wrapping around the cylinder.
  // The band's front face is bounded by two arcs (ellipses).
  const band = (y1: number, y2: number) => `
    M ${cx - rx} ${y1}
    A ${rx} ${ry} 0 0 0 ${cx + rx} ${y1}
    L ${cx + rx} ${y2}
    A ${rx} ${ry} 0 0 1 ${cx - rx} ${y2}
    Z
  `;

  // Drips around the top rim: distribute along front arc
  const dripCount = Math.max(7, Math.round(w / 22));
  const drips = Array.from({ length: dripCount }).map((_, i) => {
    const t = i / (dripCount - 1); // 0..1 across front
    const angle = Math.PI * (1 - t); // π..0 across the front arc (from left to right, below center)
    const px = cx + Math.cos(angle) * rx;
    const py = topY + Math.sin(angle) * ry;
    const len = 10 + ((i * 7) % 18);
    return { px, py, len };
  });

  return (
    <g>
      {/* === Side: sponge band (bottom portion) === */}
      <defs>
        <linearGradient id={`spongeWall-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(fill, -2)} />
          <stop offset="0.45" stopColor={sponge} />
          <stop offset="1" stopColor={spongeDark} />
        </linearGradient>
        <linearGradient id={`spongeShadeL-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.32" />
          <stop offset="0.35" stopColor="#000" stopOpacity="0" />
          <stop offset="0.7" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.22" />
        </linearGradient>
        <linearGradient id={`frostWall-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="0.55" stopColor={color} />
          <stop offset="1" stopColor={mid} />
        </linearGradient>
        <linearGradient id={`frostShade-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.28" />
          <stop offset="0.3" stopColor="#000" stopOpacity="0" />
          <stop offset="0.65" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="1" stopColor="#000" stopOpacity="0.22" />
        </linearGradient>
        <radialGradient id={`topGrad-${uid}`} cx="38%" cy="32%" r="70%">
          <stop offset="0" stopColor={shade(color, 28)} />
          <stop offset="0.55" stopColor={color} />
          <stop offset="1" stopColor={shade(color, -14)} />
        </radialGradient>
      </defs>

      {/* Sponge wall */}
      <path d={band(frostingBottomY, bottomY)} fill={`url(#spongeWall-${uid})`} />
      {/* Horizontal sponge crumb lines (curved to follow cylinder bottom) */}
      {Array.from({ length: 4 }).map((_, i) => {
        const yy = frostingBottomY + (spongeH / 5) * (i + 1);
        const lr = ry * (0.55 + i * 0.1);
        return (
          <path
            key={i}
            d={`M ${cx - rx + 2} ${yy} A ${rx - 2} ${lr} 0 0 0 ${cx + rx - 2} ${yy}`}
            fill="none"
            stroke={spongeDark}
            strokeWidth="0.6"
            opacity="0.4"
          />
        );
      })}
      {/* Filling stripe (curved) */}
      <path
        d={band(fillingTopY, fillingTopY + fillingH)}
        fill={fillingMid}
      />
      <path d={`M ${cx - rx} ${fillingTopY} A ${rx} ${ry} 0 0 0 ${cx + rx} ${fillingTopY}`} fill="none" stroke={fillingDark} strokeWidth="0.7" />
      <path d={`M ${cx - rx} ${fillingTopY + fillingH} A ${rx} ${ry} 0 0 1 ${cx - rx} ${fillingTopY + fillingH}`} fill="none" />
      <path d={`M ${cx - rx} ${fillingTopY + fillingH} A ${rx} ${ry} 0 0 0 ${cx + rx} ${fillingTopY + fillingH}`} fill="none" stroke={fillingDark} strokeWidth="0.7" />
      {/* Sponge side shading overlay */}
      <path d={band(frostingBottomY, bottomY)} fill={`url(#spongeShadeL-${uid})`} />

      {/* === Frosting band (top portion) === */}
      <path d={band(topY, frostingBottomY)} fill={`url(#frostWall-${uid})`} />
      <path d={band(topY, frostingBottomY)} fill={`url(#frostShade-${uid})`} />

      {/* Drips around the top rim spilling onto sponge */}
      {drips.map((d, i) => (
        <path
          key={i}
          d={`
            M ${d.px - 4} ${d.py - 1}
            Q ${d.px - 4} ${d.py + d.len * 0.6} ${d.px} ${d.py + d.len}
            Q ${d.px + 4} ${d.py + d.len * 0.6} ${d.px + 4} ${d.py - 1}
            Z
          `}
          fill={color}
          opacity={0.95}
        />
      ))}
      {/* Drip highlights */}
      {drips.map((d, i) => (
        <ellipse key={`h-${i}`} cx={d.px - 1} cy={d.py + d.len * 0.35} rx="1" ry={d.len * 0.18} fill={light} opacity="0.6" />
      ))}

      {/* === Top ellipse (frosting surface) === */}
      <ellipse cx={cx} cy={topY} rx={rx} ry={ry} fill={`url(#topGrad-${uid})`} stroke={shade(color, -25)} strokeWidth="0.6" />
      {/* Glossy crescent highlight */}
      <path
        d={`M ${cx - rx * 0.7} ${topY - ry * 0.15}
            Q ${cx} ${topY - ry * 0.95} ${cx + rx * 0.7} ${topY - ry * 0.15}
            Q ${cx} ${topY - ry * 0.55} ${cx - rx * 0.7} ${topY - ry * 0.15} Z`}
        fill="#ffffff"
        opacity="0.45"
      />
      {/* Rim swirl piped pattern */}
      <ellipse cx={cx} cy={topY} rx={rx - 4} ry={ry - 1.5} fill="none" stroke={shade(color, -18)} strokeWidth="0.7" opacity="0.55" strokeDasharray="3 2" />

      {/* Side accents per design (sit on frosting band) */}
      {designId === 'roses' && <SideRoses cx={cx} y={topY + frostingH * 0.55} rx={rx} />}
      {designId === 'geometric' && <SideDots cx={cx} y={topY + frostingH * 0.6} rx={rx} />}
      {designId === 'floral' && <SideFlowers cx={cx} y={topY + frostingH * 0.55} rx={rx} />}
      {designId === 'luxury' && <SideGold cx={cx} y={topY + frostingH * 0.55} rx={rx} ry={ry} />}
    </g>
  );
}

/* ── Decoration helpers (positioned on the visible front arc) ── */
function pointsOnFrontArc(cx: number, rx: number, ry: number, y: number, n: number) {
  const arr: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 1) / (n + 1);
    const angle = Math.PI * (1 - t); // 0 to π across front
    arr.push({ x: cx + Math.cos(angle) * rx, y: y + Math.sin(angle) * (ry * 0.35) });
  }
  return arr;
}

function Rose({ cx, cy, r, hue }: { cx: number; cy: number; r: number; hue: 'pink' | 'red' | 'peach' }) {
  const palettes = {
    pink: { outer: '#EC407A', mid: '#F8BBD0', inner: '#AD1457' },
    red: { outer: '#C62828', mid: '#EF5350', inner: '#7F0000' },
    peach: { outer: '#FF8A65', mid: '#FFCCBC', inner: '#BF360C' },
  };
  const p = palettes[hue];
  const petals = [0, 72, 144, 216, 288];
  return (
    <g>
      {petals.map((a) => (
        <ellipse
          key={a}
          cx={cx + Math.cos((a * Math.PI) / 180) * r * 0.5}
          cy={cy + Math.sin((a * Math.PI) / 180) * r * 0.5}
          rx={r * 0.55}
          ry={r * 0.4}
          fill={p.outer}
          stroke="#fff"
          strokeWidth="0.7"
          transform={`rotate(${a} ${cx + Math.cos((a * Math.PI) / 180) * r * 0.5} ${cy + Math.sin((a * Math.PI) / 180) * r * 0.5})`}
        />
      ))}
      <circle cx={cx} cy={cy} r={r * 0.65} fill={p.mid} stroke="#fff" strokeWidth="0.7" />
      <circle cx={cx} cy={cy} r={r * 0.25} fill={p.inner} />
      <circle cx={cx - r * 0.1} cy={cy - r * 0.1} r={r * 0.08} fill="#fff" opacity="0.7" />
    </g>
  );
}

function SideRoses({ cx, y, rx }: { cx: number; y: number; rx: number }) {
  const count = Math.max(3, Math.round((rx * 2) / 50));
  const pts = pointsOnFrontArc(cx, rx - 8, rx * 0.13, y, count);
  const hues: Array<'pink' | 'red' | 'peach'> = ['pink', 'red', 'peach'];
  return (
    <g>
      {pts.map((p, i) => (
        <g key={i}>
          <ellipse cx={p.x - 9} cy={p.y + 4} rx="5" ry="2.4" fill="#558B2F" stroke="#33691E" strokeWidth="0.4" transform={`rotate(-25 ${p.x - 9} ${p.y + 4})`} />
          <ellipse cx={p.x + 9} cy={p.y + 4} rx="5" ry="2.4" fill="#558B2F" stroke="#33691E" strokeWidth="0.4" transform={`rotate(25 ${p.x + 9} ${p.y + 4})`} />
          <Rose cx={p.x} cy={p.y} r={8} hue={hues[i % hues.length]} />
        </g>
      ))}
    </g>
  );
}

function SideDots({ cx, y, rx }: { cx: number; y: number; rx: number }) {
  const count = Math.max(8, Math.round((rx * 2) / 18));
  const pts = pointsOnFrontArc(cx, rx - 6, rx * 0.13, y, count);
  return (
    <g>
      {pts.map((p, i) => (
        <rect key={i} x={p.x - 4} y={p.y - 4} width="8" height="8" fill="#fff" stroke="#3D2B1A" strokeWidth="0.6" opacity="0.95" transform={`rotate(45 ${p.x} ${p.y})`} />
      ))}
    </g>
  );
}

function SideFlowers({ cx, y, rx }: { cx: number; y: number; rx: number }) {
  const count = Math.max(3, Math.round((rx * 2) / 50));
  const pts = pointsOnFrontArc(cx, rx - 8, rx * 0.13, y, count);
  const palette = ['#F06292', '#FFB74D', '#81C784', '#64B5F6', '#BA68C8'];
  return (
    <g>
      {pts.map((p, i) => {
        const col = palette[i % palette.length];
        return (
          <g key={i}>
            {[0, 72, 144, 216, 288].map((a) => (
              <circle key={a} cx={p.x + Math.cos((a * Math.PI) / 180) * 5} cy={p.y + Math.sin((a * Math.PI) / 180) * 5} r="4" fill={col} stroke="#fff" strokeWidth="0.6" />
            ))}
            <circle cx={p.x} cy={p.y} r="2.6" fill="#FFF176" stroke="#F57F17" strokeWidth="0.5" />
          </g>
        );
      })}
    </g>
  );
}

function SideGold({ cx, y, rx, ry }: { cx: number; y: number; rx: number; ry: number }) {
  return (
    <g>
      <path d={`M ${cx - rx + 4} ${y} A ${rx - 4} ${ry * 0.9} 0 0 0 ${cx + rx - 4} ${y}`} fill="none" stroke="url(#goldShine)" strokeWidth="4" />
      <path d={`M ${cx - rx + 4} ${y + 8} A ${rx - 4} ${ry * 0.9} 0 0 0 ${cx + rx - 4} ${y + 8}`} fill="none" stroke="url(#goldShine)" strokeWidth="2" opacity="0.85" />
      {pointsOnFrontArc(cx, rx - 8, ry * 0.85, y + 4, Math.max(5, Math.round(rx / 12))).map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3.2" fill="#fff3b0" stroke="#a8842c" strokeWidth="0.6" />
          <circle cx={p.x} cy={p.y} r="1.2" fill="#a8842c" />
        </g>
      ))}
    </g>
  );
}

/* ── Top decorations ── */
function TopRoses({ cx, y, w }: { cx: number; y: number; w: number }) {
  const positions: Array<{ dx: number; dy: number; r: number; hue: 'pink' | 'red' | 'peach' }> = [
    { dx: -Math.min(w * 0.3, 36), dy: -2, r: 11, hue: 'pink' },
    { dx: Math.min(w * 0.3, 36), dy: -2, r: 11, hue: 'red' },
    { dx: -Math.min(w * 0.16, 20), dy: -14, r: 9, hue: 'peach' },
    { dx: Math.min(w * 0.16, 20), dy: -14, r: 9, hue: 'pink' },
    { dx: 0, dy: -22, r: 8, hue: 'red' },
  ];
  return (
    <g>
      {positions.map((p, i) => (
        <g key={`leaf-${i}`}>
          <ellipse cx={cx + p.dx - p.r * 0.8} cy={y + p.dy + p.r * 0.5} rx="6" ry="3" fill="#558B2F" stroke="#33691E" strokeWidth="0.5" transform={`rotate(-30 ${cx + p.dx - p.r * 0.8} ${y + p.dy + p.r * 0.5})`} />
          <ellipse cx={cx + p.dx + p.r * 0.8} cy={y + p.dy + p.r * 0.5} rx="6" ry="3" fill="#558B2F" stroke="#33691E" strokeWidth="0.5" transform={`rotate(30 ${cx + p.dx + p.r * 0.8} ${y + p.dy + p.r * 0.5})`} />
        </g>
      ))}
      {positions.map((p, i) => (
        <Rose key={i} cx={cx + p.dx} cy={y + p.dy} r={p.r} hue={p.hue} />
      ))}
    </g>
  );
}

function CartoonTop({ cx, y }: any) {
  return (
    <g>
      <text x={cx - 32} y={y - 4} fontSize="26">🎈</text>
      <text x={cx - 10} y={y - 14} fontSize="30">🎉</text>
      <text x={cx + 16} y={y - 4} fontSize="26">🎈</text>
    </g>
  );
}

function FloralTop({ cx, y }: any) {
  return (
    <g>
      <text x={cx - 34} y={y} fontSize="24">🌸</text>
      <text x={cx - 12} y={y - 12} fontSize="26">🌼</text>
      <text x={cx + 14} y={y} fontSize="24">🌷</text>
    </g>
  );
}

function GeometricTop({ cx, y, w }: any) {
  const count = 5;
  return (
    <g>
      {Array.from({ length: count }).map((_, i) => {
        const x = cx - (w * 0.32) + (w * 0.64 * i) / (count - 1);
        return (
          <polygon
            key={i}
            points={`${x},${y - 22} ${x + 9},${y - 4} ${x - 9},${y - 4}`}
            fill="#fff"
            stroke="#C9A84C"
            strokeWidth="2"
          />
        );
      })}
    </g>
  );
}

function MinimalTop({ cx, y }: any) {
  return (
    <g>
      <line x1={cx - 36} y1={y - 6} x2={cx + 36} y2={y - 6} stroke="#fff" strokeWidth="3" opacity="0.95" />
      <circle cx={cx} cy={y - 6} r="3" fill="#fff" />
    </g>
  );
}

/* Realistic candle with drip wax */
function Candle({ cx, y }: { cx: number; y: number }) {
  return (
    <g>
      {/* wax body with subtle stripes */}
      <defs>
        <linearGradient id={`waxG-${cx}-${y}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.45" stopColor="#fde7ec" />
          <stop offset="1" stopColor="#d39ea4" />
        </linearGradient>
      </defs>
      <rect x={cx - 3} y={y - 32} width="6" height="26" rx="1.2" fill={`url(#waxG-${cx}-${y})`} stroke="#b87f86" strokeWidth="0.5" />
      <line x1={cx - 3} y1={y - 22} x2={cx + 3} y2={y - 22} stroke="#c98d94" strokeWidth="0.5" opacity="0.7" />
      <line x1={cx - 3} y1={y - 14} x2={cx + 3} y2={y - 14} stroke="#c98d94" strokeWidth="0.5" opacity="0.7" />
      {/* wax drip */}
      <path d={`M ${cx + 1} ${y - 8} Q ${cx + 2.5} ${y - 4} ${cx + 1.5} ${y - 2}`} stroke="#e9c1c4" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      {/* wick */}
      <line x1={cx} y1={y - 32} x2={cx} y2={y - 38} stroke="#3D2B1A" strokeWidth="0.9" />
      {/* flame */}
      <ellipse cx={cx} cy={y - 42} rx="3.2" ry="5.5" fill="#ff9c00">
        <animate attributeName="ry" values="5.5;6.2;5.5" dur="1.2s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx={cx} cy={y - 42} rx="1.6" ry="3.2" fill="#fff7c0" />
      {/* flame glow */}
      <circle cx={cx} cy={y - 42} r="12" fill="#ffb84d" opacity="0.18" />
    </g>
  );
}

/* Print frame on the front of the cake */
function PrintFrame({ tier }: any) {
  const { cx, topY, h } = tier;
  const fw = 70;
  const fh = 48;
  const fy = topY + h * 0.42;
  return (
    <g>
      <rect x={cx - fw / 2} y={fy} width={fw} height={fh} rx="3" fill="#fff" stroke="#C9A84C" strokeWidth="1.5" />
      <text x={cx} y={fy + fh / 2 + 4} textAnchor="middle" fontSize="14" fill="#8A6A1E">📷</text>
    </g>
  );
}

/* Cake writing */
function CakeText({ text, cx, cy }: { text: string; cx: number; cy: number }) {
  const display = text.length > 22 ? text.slice(0, 22) + '…' : text;
  return (
    <text
      x={cx}
      y={cy}
      textAnchor="middle"
      fontFamily="'DM Serif Display', 'Tajawal', serif"
      fontSize="15"
      fontWeight="700"
      fill="#fff"
      stroke="rgba(61,43,26,0.45)"
      strokeWidth="0.7"
      paintOrder="stroke"
    >
      {display}
    </text>
  );
}

/* ─── Cupcake (single, large) ─── */
function Cupcake({ cx, cy, frosting, liner, sprinkle, designId }: any) {
  const frostTopY = cy - 18;
  const frostMidY = cy - 6;
  return (
    <g>
      <path
        d={`M ${cx - 22} ${cy + 4} L ${cx - 16} ${cy + 30} L ${cx + 16} ${cy + 30} L ${cx + 22} ${cy + 4} Z`}
        fill={liner}
        stroke={shade(liner, -15)}
        strokeWidth="0.8"
      />
      {[0, 1, 2].map((i) => (
        <line key={i} x1={cx - 18 + i * 14} y1={cy + 6} x2={cx - 14 + i * 14} y2={cy + 28} stroke={shade(liner, -20)} strokeWidth="0.5" />
      ))}
      <path
        d={`M ${cx - 24} ${cy + 4} Q ${cx} ${cy - 26} ${cx + 24} ${cy + 4} Q ${cx + 12} ${cy - 4} ${cx} ${cy - 10} Q ${cx - 12} ${cy - 4} ${cx - 24} ${cy + 4} Z`}
        fill={frosting}
      />
      <ellipse cx={cx - 5} cy={cy - 8} rx="4" ry="2" fill={shade(frosting, 18)} opacity="0.6" />

      {designId === 'roses' && (
        <g>
          <Rose cx={cx} cy={frostMidY - 2} r={8} hue="pink" />
          <Rose cx={cx - 12} cy={cy - 2} r={5} hue="red" />
          <Rose cx={cx + 12} cy={cy - 2} r={5} hue="peach" />
        </g>
      )}
      {designId === 'luxury' && (
        <g>
          <circle cx={cx} cy={frostMidY} r="6" fill="url(#goldShine)" stroke="#a8842c" strokeWidth="0.6" />
        </g>
      )}
      {designId === 'cartoon' && (
        <text x={cx} y={frostMidY + 4} fontSize="18" textAnchor="middle">🎉</text>
      )}
      {designId === 'floral' && (
        <text x={cx} y={frostMidY + 4} fontSize="16" textAnchor="middle">🌸</text>
      )}
      {designId === 'geometric' && (
        <g>
          {[-10, 0, 10].map((dx, i) => (
            <polygon
              key={i}
              points={`${cx + dx},${frostTopY + 2} ${cx + dx + 4},${frostMidY + 2} ${cx + dx - 4},${frostMidY + 2}`}
              fill="#fff"
              stroke="#C9A84C"
              strokeWidth="1.2"
            />
          ))}
        </g>
      )}
      {designId === 'minimal' && (
        <g>
          <line x1={cx - 14} y1={frostMidY} x2={cx + 14} y2={frostMidY} stroke="#fff" strokeWidth="2" />
          <circle cx={cx} cy={frostMidY} r="2.4" fill="#fff" />
        </g>
      )}
      {!designId && (
        <g>
          <circle cx={cx - 6} cy={cy - 4} r="1.6" fill={sprinkle} />
          <circle cx={cx + 5} cy={cy - 2} r="1.6" fill={sprinkle} />
          <circle cx={cx} cy={cy - 12} r="1.6" fill={sprinkle} />
        </g>
      )}
    </g>
  );
}

/* ─── Number cake (stylised "0" shape) ─── */
function NumberCake({ colorA, colorB, accent, designId }: any) {
  const cx = 180;
  const cy = 180;
  return (
    <g>
      {/* base ring shadow */}
      <ellipse cx={cx} cy={cy + 60} rx="90" ry="14" fill="rgba(61,43,26,0.18)" />
      {/* outer ring with gradient */}
      <defs>
        <radialGradient id="numFront" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor={shade(colorA, 22)} />
          <stop offset="0.6" stopColor={colorA} />
          <stop offset="1" stopColor={shade(colorA, -22)} />
        </radialGradient>
      </defs>
      <ellipse cx={cx} cy={cy} rx="95" ry="72" fill="url(#numFront)" />
      <ellipse cx={cx} cy={cy} rx="40" ry="30" fill="#FAF6EE" />
      <ellipse cx={cx} cy={cy - 50} rx="80" ry="14" fill={shade(colorA, 20)} opacity="0.7" />
      <ellipse cx={cx - 30} cy={cy - 45} rx="30" ry="8" fill="#fff" opacity="0.45" />

      {(designId === 'roses' || !designId) && (
        <g>
          {[0, 60, 120, 180, 240, 300].map((a, i) => {
            const rad = (a * Math.PI) / 180;
            const px = cx + Math.cos(rad) * 70;
            const py = cy + Math.sin(rad) * 55;
            const hues: Array<'pink' | 'red' | 'peach'> = ['pink', 'red', 'peach'];
            return <Rose key={i} cx={px} cy={py} r={10} hue={hues[i % hues.length]} />;
          })}
        </g>
      )}
      {designId === 'cartoon' && (
        <g>
          {['🎉', '🎈', '⭐', '🎁', '🎂', '🍭'].map((e, i) => {
            const a = (i * 60 * Math.PI) / 180;
            return <text key={i} x={cx + Math.cos(a) * 75 - 12} y={cy + Math.sin(a) * 58 + 8} fontSize="24">{e}</text>;
          })}
        </g>
      )}
      {designId === 'floral' && (
        <g>
          {['🌸', '🌼', '🌷', '🌺', '🌻', '🌹'].map((e, i) => {
            const a = (i * 60 * Math.PI) / 180;
            return <text key={i} x={cx + Math.cos(a) * 75 - 11} y={cy + Math.sin(a) * 58 + 7} fontSize="22">{e}</text>;
          })}
        </g>
      )}
      {designId === 'geometric' && (
        <g>
          {Array.from({ length: 10 }).map((_, i) => {
            const a = (i * 36 * Math.PI) / 180;
            const px = cx + Math.cos(a) * 75;
            const py = cy + Math.sin(a) * 58;
            return (
              <polygon key={i} points={`${px},${py - 9} ${px + 7},${py + 4} ${px - 7},${py + 4}`} fill="#fff" stroke="#C9A84C" strokeWidth="2" transform={`rotate(${(a * 180) / Math.PI} ${px} ${py})`} />
            );
          })}
        </g>
      )}
      {designId === 'minimal' && (
        <g>
          <ellipse cx={cx} cy={cy} rx="83" ry="65" fill="none" stroke="#fff" strokeWidth="2.5" />
          <ellipse cx={cx} cy={cy} rx="52" ry="40" fill="none" stroke="#fff" strokeWidth="1.6" opacity="0.8" />
        </g>
      )}
      {designId === 'luxury' && (
        <g>
          <ellipse cx={cx} cy={cy} rx="83" ry="65" fill="none" stroke="url(#goldShine)" strokeWidth="3.5" />
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i * 30 * Math.PI) / 180;
            const px = cx + Math.cos(a) * 75;
            const py = cy + Math.sin(a) * 58;
            return (
              <g key={i}>
                <circle cx={px} cy={py} r="3.6" fill="url(#goldShine)" stroke="#a8842c" strokeWidth="0.6" />
                <circle cx={px} cy={py} r="1.4" fill="#a8842c" />
              </g>
            );
          })}
        </g>
      )}
    </g>
  );
}
