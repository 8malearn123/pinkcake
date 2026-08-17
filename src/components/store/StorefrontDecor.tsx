import { MessageCircle } from "lucide-react";
import { CmsText } from "@/components/store/CmsText";
import { visibleItems } from "@/hooks/useHomepageContent";
import { SECTION_DEFAULTS, type SectionContent } from "@/lib/homepage/schema";

/* ── شريط إعلانات متحرك ── */
export function Marquee({ content = SECTION_DEFAULTS.marquee }: { content?: SectionContent["marquee"] }) {
  const items = visibleItems(content.items);
  if (items.length === 0) return null;
  // مكرَّرة مرّتين كي يبدو الشريط بلا نهاية أثناء دورة الحركة.
  const row = [...items, ...items];
  return (
    <div className="overflow-hidden bg-primary py-2.5">
      <div className="marquee flex w-max gap-10 whitespace-nowrap text-[11px] font-medium text-white sm:text-xs">
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-10">
            <CmsText value={t.text} />
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
