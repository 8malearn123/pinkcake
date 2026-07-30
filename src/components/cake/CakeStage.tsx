import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CakeStageProps {
  url: string | null;
  alt: string;
  /** «الصورة تعرض: …» line when the photo covers fewer picks than were made. */
  caption: string | null;
  serves: string;
  leadTime: string;
  empty: boolean;
}

/**
 * The photo preview that replaced the procedural CSS art. Renders inside the
 * studio's .stage; always shows the deepest photographed match the page hands it.
 */
export function CakeStage({ url, alt, caption, serves, leadTime, empty }: CakeStageProps) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setLoaded(false); }, [url]);

  return (
    <>
      {url && <div className="cz-photo-skel" />}
      {url && (
        <img
          src={url}
          alt={alt}
          className={cn('cz-photo', loaded && 'in')}
          onLoad={() => setLoaded(true)}
        />
      )}
      <div className="live-pill"><span className="ld" /> معاينة حيّة</div>
      {empty && (
        <div className="ph-hint">
          <div>
            <div className="serif" style={{ fontSize: 34, color: 'hsl(var(--primary)/.5)', marginBottom: 6 }}>✲</div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>لا تتوفر صورة لهذه التركيبة بعد</div>
          </div>
        </div>
      )}
      {caption != null && (
        <div className="cz-caption"><span>الصورة تعرض: {caption}</span></div>
      )}
      {!empty && (
        <div className="stage-cap">
          <div className="pill">
            <Users size={14} /><span>تكفي <b><bdi dir="ltr">{serves}</bdi></b></span>
            <span className="dot" /><span>جاهزة خلال <b>{leadTime}</b></span>
          </div>
        </div>
      )}
    </>
  );
}
