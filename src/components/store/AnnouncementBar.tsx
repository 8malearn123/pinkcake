import { Truck } from 'lucide-react';
import { RiyalSymbol } from '@/components/ui/riyal';

export function AnnouncementBar() {
  return (
    <div className="gradient-cocoa text-white text-center text-xs sm:text-sm py-2 px-4 relative overflow-hidden">
      <div className="absolute inset-0 noise-overlay opacity-30" />
      <div className="relative z-10 flex items-center justify-center gap-2">
        <Truck className="w-3.5 h-3.5 text-primary" />
        <span>توصيل مجاني للطلبات فوق 200 <RiyalSymbol /> — تُحضّر طازجة كل صباح</span>
      </div>
    </div>
  );
}
