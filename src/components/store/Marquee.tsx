import { RiyalSymbol } from '@/components/ui/riyal';

// Scrolling announcement ticker (cocoa strip, rose ✦ separators). Reuses the
// `.marquee` utility in index.css; the row is duplicated for a seamless loop.
const ITEMS: React.ReactNode[] = [
  <>توصيل مجاني داخل الرياض للطلبات فوق 200 <RiyalSymbol /></>,
  'تُخبز طازجة كل صباح في الرياض',
  'اطلبي قبل 3 عصراً لتوصيل الغد',
  'خصم 10٪ على أول طلب — نادي بينك كيك',
  'تصاميم زفافٍ حصرية بلمسة يدوية',
];

export function Marquee() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div className="gradient-cocoa text-white overflow-hidden py-2.5 relative">
      <div className="absolute inset-0 noise-overlay opacity-30 pointer-events-none" />
      <div className="marquee relative flex w-max gap-10 whitespace-nowrap text-[11px] sm:text-xs font-medium">
        {row.map((item, i) => (
          <span key={i} className="flex items-center gap-10">
            <span className="inline-flex items-center gap-1.5">{item}</span>
            <span className="text-gold" aria-hidden>✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
