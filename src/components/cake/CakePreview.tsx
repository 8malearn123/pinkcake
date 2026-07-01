import { useMemo, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import './cakeStudio.css';
import { buildCake, type CakeConfig } from '@/lib/cakeBuilder';

const STAGE_BG =
  'radial-gradient(70% 56% at 50% 30%, hsl(28 44% 97.5%), transparent 72%), linear-gradient(180deg, hsl(28 30% 97%), hsl(20 18% 93.5%))';

/**
 * Renders the same live CSS cake the customer designed on /customize, embedded
 * (namespaced .cake-studio.cz-embed) so staff can see exactly what to make.
 */
export function CakePreview({ config, height = 300, className }: { config: CakeConfig; height?: number; className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const art = useMemo(() => buildCake(config), [config]);

  useEffect(() => {
    const w = wrapRef.current;
    if (!w) return;
    w.classList.remove('settle');
    void w.offsetWidth;
    w.classList.add('settle');
  }, [art]);

  return (
    <div
      className={cn('relative rounded-2xl overflow-hidden flex items-center justify-center border border-border/50', className)}
      style={{ background: STAGE_BG, height }}
    >
      <div className="absolute inset-0 noise-overlay opacity-30" />
      <div className="cake-studio cz-embed relative z-[2]">
        <div className="cz-scene">
          <div className="cake-wrap" ref={wrapRef}>
            <div className="cake" dangerouslySetInnerHTML={{ __html: art.cake }} />
            <div className="stand" dangerouslySetInnerHTML={{ __html: art.stand }} />
          </div>
        </div>
      </div>
    </div>
  );
}
