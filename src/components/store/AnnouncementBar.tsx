import { Truck, Gift } from 'lucide-react';
import { RiyalSymbol } from '@/components/ui/riyal';

export function AnnouncementBar() {
  return (
    <div className="gradient-cocoa text-white text-[11px] sm:text-sm py-2 px-4 relative overflow-hidden">
      <div className="absolute inset-0 noise-overlay opacity-30" />
      <div className="relative z-10 flex items-center justify-center gap-3 sm:gap-6">
        <span className="inline-flex items-center gap-2">
          <Truck className="w-3.5 h-3.5 text-primary shrink-0" />
          توصيل مجاني فوق 200 <RiyalSymbol />
        </span>
        <span className="h-3.5 w-px bg-white/25 shrink-0" />
        <span className="inline-flex items-center gap-2">
          <Gift className="w-3.5 h-3.5 text-primary shrink-0" />
          خصم 10٪ على أوّل طلب
        </span>
      </div>
    </div>
  );
}
