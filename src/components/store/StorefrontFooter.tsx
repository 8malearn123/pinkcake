import { Clock, Instagram, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useCombos } from '@/hooks/useCombos';

interface StorefrontFooterProps {
  storeName: string;
  /** Route navigation (`/customize`, `/contact`…). */
  onNavigate: (path: string) => void;
  /**
   * Jump to a landing-page section by id. The home page scrolls to it; other
   * storefront routes hand off to the closest equivalent page.
   */
  onJump: (sectionId: string) => void;
}

/**
 * The Jazan storefront footer — lifted out of the landing page so every
 * storefront route (product details included) closes with the same brand
 * signature instead of stopping at the last section.
 */
export function StorefrontFooter({ storeName, onNavigate, onJump }: StorefrontFooterProps) {
  // Staff can hide every combo; the link would then point at a section that no
  // longer renders. Gate on the doc rather than the priced result — the footer
  // has no catalogue to resolve against, and "staff turned them all off" is the
  // case worth reacting to.
  const { activeCombos } = useCombos();

  return (
    <footer className="mt-2 bg-gradient-to-b from-[#7d2f49] to-[#5f2338] text-white">
      <div className="mx-auto max-w-[1500px] px-5 py-14 sm:px-8 lg:px-12 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr] lg:gap-8">
          {/* Brand + social */}
          <div>
            <p className="text-2xl font-black tracking-[-.04em]">{storeName}</p>
            <p className="mt-1 text-[10px] font-bold tracking-[.16em] text-[#ddbd75]">حلويات جازان الفاخرة</p>
            <p className="mt-4 max-w-xs text-sm leading-7 text-white/70">
              تورتات وحلويات طازجة تُخبز يومياً في جازان بأجود المكوّنات — لكل مناسبة كيكتها المميزة.
            </p>
            <div className="mt-5 flex gap-2.5">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="انستغرام" className="grid size-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-[#ddbd75] hover:text-[#9e3a5c]">
                <Instagram size={18} />
              </a>
              <a href="https://wa.me/966500000000" target="_blank" rel="noopener noreferrer" aria-label="واتساب" className="grid size-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-[#ddbd75] hover:text-[#9e3a5c]">
                <MessageCircle size={18} />
              </a>
            </div>
          </div>

          {/* Shop */}
          <nav aria-label="تسوّق">
            <p className="text-sm font-black text-[#ddbd75]">تسوّق</p>
            <ul className="mt-4 space-y-2.5 text-sm text-white/75">
              <li><button onClick={() => onJump('shop')} className="transition-colors hover:text-white">كل المنتجات</button></li>
              <li><button onClick={() => onJump('seasonal')} className="transition-colors hover:text-white">تشكيلة الصيف 🥭</button></li>
              {activeCombos.length > 0 && (
                <li><button onClick={() => onJump('combos')} className="transition-colors hover:text-white">الكومبوهات</button></li>
              )}
              <li><button onClick={() => onNavigate('/custom-cakes')} className="transition-colors hover:text-white">كيكات التصميم الخاص</button></li>
              <li><button onClick={() => onNavigate('/customize')} className="transition-colors hover:text-white">صمّم تورتة خاصة</button></li>
            </ul>
          </nav>

          {/* Help */}
          <nav aria-label="المساعدة">
            <p className="text-sm font-black text-[#ddbd75]">المساعدة</p>
            <ul className="mt-4 space-y-2.5 text-sm text-white/75">
              <li><button onClick={() => onJump('faq')} className="transition-colors hover:text-white">الأسئلة الشائعة</button></li>
              <li><button onClick={() => onNavigate('/events')} className="transition-colors hover:text-white">تجهيز المناسبات</button></li>
              <li><button onClick={() => onJump('branches')} className="transition-colors hover:text-white">فروعنا</button></li>
              <li><button onClick={() => onNavigate('/contact')} className="transition-colors hover:text-white">تواصل معنا</button></li>
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <p className="text-sm font-black text-[#ddbd75]">تواصل معنا</p>
            <ul className="mt-4 space-y-3 text-sm text-white/75">
              <li className="flex items-center gap-2.5">
                <MapPin size={16} className="shrink-0 text-[#ddbd75]" /> صبيا · أبو عريش، جازان
              </li>
              <li>
                <a href="tel:+966173600000" dir="ltr" className="flex items-center gap-2.5 transition-colors hover:text-white">
                  <Phone size={16} className="shrink-0 text-[#ddbd75]" /> ٠١٧ ٣٦٠ ٠٠٠٠
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock size={16} className="shrink-0 text-[#ddbd75]" /> يومياً ٩ص – ١٢م
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar — copyright + payment trust */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/15 pt-6 sm:flex-row">
          <p className="text-xs text-white/60">© ٢٠٢٥ {storeName} · جازان، المملكة العربية السعودية</p>
          <div className="flex flex-wrap items-center gap-2">
            {['مدى', 'فيزا', 'ماستركارد', 'Apple Pay', 'تابي'].map((m) => (
              <span key={m} className="rounded-md bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white/80">{m}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
