import type { ReactNode } from "react";
import { MessageCircle } from "lucide-react";
import { RiyalSymbol } from "@/components/ui/riyal";

/* ── شريط إعلانات متحرك ── */
const tickerItems: ReactNode[] = [
  <>توصيل مجاني داخل جازان للطلبات فوق ٢٠٠ <RiyalSymbol className="text-[0.9em]" /></>,
  "🥭 موسم المنجا الجازانية متوفر الآن",
  "اطلب قبل ٣ مساءً لتوصيل الغد",
  "خصم ١٥٪ على أول طلب مع كود CAKE15",
  "تورتات طازجة تُخبز يومياً في جازان",
];
export function Marquee() {
  const row = [...tickerItems, ...tickerItems];
  return (
    <div className="overflow-hidden bg-[#9e3a5c] py-2.5">
      <div className="marquee flex w-max gap-10 whitespace-nowrap text-[11px] font-medium text-white sm:text-xs">
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-10">
            {t}
            <span className="text-[#ddbd75]">✦</span>
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
      <span className="h-px w-16 bg-gradient-to-l from-[#ddbd75] to-transparent" />
      <span className="text-[#ddbd75]">✦</span>
      <span className="h-px w-16 bg-gradient-to-r from-[#ddbd75] to-transparent" />
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
      className="fixed bottom-24 start-5 z-40 flex items-center gap-2 rounded-full bg-[#25d366] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#25d366]/30 md:bottom-5"
    >
      <MessageCircle size={22} fill="white" strokeWidth={0} />
      <span className="hidden sm:inline">اطلب عبر واتساب</span>
    </a>
  );
}
