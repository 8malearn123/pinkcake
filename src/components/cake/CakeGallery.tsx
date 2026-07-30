import { Clock, Users, Wand2 } from 'lucide-react';
import { RiyalSymbol } from '@/components/ui/riyal';
import { formatSAR } from '@/lib/currency';
import type { GalleryCake } from '@/lib/cakeSelect';

interface CakeGalleryProps {
  items: GalleryCake[];
  onPick: (cakeId: string) => void;
  onBrowse: () => void;
}

/**
 * The studio's entry screen: every cake here has a resolvable cover photo and
 * at least one photographed first-step option — anything less never appears.
 */
export function CakeGallery({ items, onPick, onBrowse }: CakeGalleryProps) {
  return (
    <div>
      <div className="shead sect">
        <div className="kick"><Wand2 size={13} /> استوديو التصميم</div>
        <h2>اختر كيكتك</h2>
        <p>كل ما تراه متوفر فعلاً — اختر قاعدة ثم خصّصها.</p>
      </div>
      {items.length === 0 ? (
        <div className="gempty sect">
          <p>لا توجد كيكات جاهزة بعد.</p>
          <button onClick={onBrowse}>تصفّح المنتجات</button>
        </div>
      ) : (
        <div className="gallery sect">
          {items.map(({ cake, previewUrl }) => (
            <button key={cake.id} className="gcard" onClick={() => onPick(cake.id)}>
              <div className="ph"><img src={previewUrl} alt={cake.name} loading="lazy" /></div>
              <div className="nm">{cake.name}</div>
              <div className="pr">من <span className="v num">{formatSAR(cake.basePrice)}</span> <RiyalSymbol /></div>
              <div className="meta">
                <Users size={13} /><bdi dir="ltr">{cake.serves}</bdi>
                <span className="d" />
                <Clock size={13} /><span>{cake.leadTime}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
