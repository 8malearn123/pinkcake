import { useState, type CSSProperties } from 'react';
import { Reveal } from '@/components/Reveal';

// Faithful clone of the final design's "لديك هديّة بانتظارك" gift-box section —
// an animated berry gift box that reveals a first-order discount on click.
export function GiftBox({ storeName }: { storeName: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard?.writeText('CAKE15').then(() => setCopied(true)).catch(() => setCopied(true));
  };

  const S: Record<string, CSSProperties> = {
    circle: { position: 'absolute', width: 130, height: 130, borderRadius: 9999, background: 'rgba(221,189,117,.4)', pointerEvents: 'none' },
    wrap: { position: 'relative', width: 124, height: 120, display: 'block', animation: 'ck-bob 3s ease-in-out infinite', filter: 'drop-shadow(0 14px 18px rgba(158,58,92,.35))' },
    bow: { position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)', zIndex: 3, width: 64, height: 28 },
    bowL: { position: 'absolute', left: 2, top: 2, width: 28, height: 24, background: '#ddbd75', borderRadius: '70% 70% 45% 45%', transform: 'rotate(-26deg)' },
    bowR: { position: 'absolute', right: 2, top: 2, width: 28, height: 24, background: '#ddbd75', borderRadius: '70% 70% 45% 45%', transform: 'rotate(26deg)' },
    knot: { position: 'absolute', left: '50%', top: 4, transform: 'translateX(-50%)', width: 14, height: 16, background: '#c9a85f', borderRadius: 4, zIndex: 2 },
    lid: { position: 'absolute', top: 28, left: '50%', transform: 'translateX(-50%)', width: 130, height: 30, borderRadius: 7, background: 'linear-gradient(#b0506e,#9e3a5c)', boxShadow: '0 6px 12px -6px rgba(0,0,0,.35)', zIndex: 2 },
    body: { position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 112, height: 78, borderRadius: '0 0 8px 8px', background: 'linear-gradient(#9e3a5c,#7d2f49)' },
    ribbon: { position: 'absolute', top: 28, left: '50%', transform: 'translateX(-50%)', width: 24, height: 90, background: '#ddbd75', zIndex: 2 },
  };

  return (
    <section style={{ padding: '56px 48px' }}>
      <Reveal
        className="mx-auto max-w-[1500px] overflow-hidden rounded-3xl border border-[#9e3a5c]/[.12] text-center"
        style={{ background: 'linear-gradient(160deg,#ffffff 0%,#fdf3f6 100%)', padding: '56px 48px', boxShadow: '0 24px 80px -50px rgba(158,58,92,.5)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <p className="inline-flex items-center gap-2 rounded-full bg-[#fbeef2] px-4 py-1.5 text-xs font-bold tracking-[.05em] text-[#b0506e]">
            🎁 هدية ترحيبية · لزوّار {storeName} لأول مرة
          </p>
          <h2 className="mt-2 max-w-[36rem] text-[32px] font-black leading-[1.35] text-[#2c2226]">لديك هديّة بانتظارك!</h2>
          <p className="max-w-[30rem] text-[15px] leading-[1.9] text-[#6f5b62]">
            اضغط على الصندوق لتكشف مفاجأتك 🎉
          </p>

          {open ? (
            <div className="ck-couponpop mt-3 w-full max-w-[26rem] rounded-2xl border-2 border-dashed border-[#ddbd75] bg-[#fffdfa] p-6" style={{ animation: 'ck-couponpop .5s ease-out both' }}>
              <p className="text-lg font-black text-[#9e3a5c]">🎉 مبروك! هديتك جاهزة</p>
              <p className="mt-1 text-sm text-[#6f5b62]">خصم ١٥٪ على أوّل طلب</p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <span className="rounded-md bg-[#fbeef2] px-5 py-2.5 text-lg font-black tracking-[.15em] text-[#9e3a5c]">CAKE15</span>
                <button onClick={copy} className="rounded-md bg-[#9e3a5c] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#b0506e]">
                  {copied ? 'تم النسخ ✓' : 'انسخ الكود'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <button aria-label="افتح هديتك" onClick={() => setOpen(true)} className="relative mt-2.5 grid place-items-center" style={{ width: 190, height: 160, background: 'none', border: 'none', cursor: 'pointer' }}>
                <span className="ck-pulse" style={{ ...S.circle, animation: 'ck-pulse 2.4s ease-out infinite' }} />
                <span className="ck-pulse" style={{ ...S.circle, animation: 'ck-pulse 2.4s ease-out 1.2s infinite' }} />
                <span className="ck-bob" style={S.wrap}>
                  <span style={S.bow}>
                    <span style={S.bowL} />
                    <span style={S.bowR} />
                    <span style={S.knot} />
                  </span>
                  <span style={S.lid} />
                  <span style={S.body} />
                  <span style={S.ribbon} />
                </span>
              </button>
              <button onClick={() => setOpen(true)} className="rounded-full bg-[#9e3a5c] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#b0506e]">
                👆 اضغط لفتح الهدية
              </button>
            </>
          )}
        </div>
      </Reveal>
    </section>
  );
}
