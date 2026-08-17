import { MessageCircle } from "lucide-react";
import { RiyalSymbol, RiyalText } from "@/components/ui/riyal";
import { useStorefrontPromos } from "@/hooks/useStorefrontPromos";

/* ── شريط إعلانات متحرك ── */

/**
 * النصّ يأتي من «التسويق» ← «العروض والإعلانات» (خانة الشريط المتحرّك).
 *
 * الشريط يستدعي الخطّاف بنفسه بدل أن يستقبل عناصره كخاصية، لأنه مركّب في عشرة
 * مواضع بلا خصائص — تمريرها يعني تعديل عشرة ملفات لتغيير كلمة.
 */
export function Marquee() {
  const { ticker } = useStorefrontPromos();
  if (ticker.length === 0) return null;

  const row = [...ticker, ...ticker];
  return (
    <div className="overflow-hidden bg-primary py-2.5">
      <div className="marquee flex w-max gap-10 whitespace-nowrap text-[11px] font-medium text-white sm:text-xs">
        {row.map((item, i) => (
          <span key={`${item.id}-${i}`} className="flex items-center gap-10">
            <RiyalText text={item.title} className="text-[0.9em]" />
            <span className="text-gold">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── فاصل ذهبي زخرفي ── */
export function GoldDivider() {
  return (
    <div className="mx-auto flex max-w-[1500px] items-center justify-center gap-3 px-5 py-2" aria-hidden>
      <span className="h-px w-16 bg-gradient-to-l from-gold to-transparent" />
      <span className="text-gold">✦</span>
      <span className="h-px w-16 bg-gradient-to-r from-gold to-transparent" />
    </div>
  );
}

/* ── زر واتساب عائم ── */
export function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/966500000000"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="تواصل عبر واتساب"
      /* #25d366 is WhatsApp's own brand green and stays hardcoded on purpose —
         recognising the button matters more than matching our palette. */
      className="fixed bottom-24 start-5 z-40 flex items-center gap-2 rounded-full bg-[#25d366] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#25d366]/30 md:bottom-5"
    >
      <MessageCircle size={22} fill="white" strokeWidth={0} />
      <span className="hidden sm:inline">اطلب عبر واتساب</span>
    </a>
  );
}
