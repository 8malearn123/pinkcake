import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/**
 * يرسم أبناءه بعرض المتجر الحقيقي ثم يُصغّرهم ليتّسعوا في عمود اللوحة.
 *
 * التصغير لا التضييق: أقسام المتجر متجاوبة، فلو تُركت لعرض العمود لأظهرت تخطيط
 * الجوال بينما المدير يظنّ أنه يرى الحاسوب. الوعد هنا «كما يظهر تماماً»، وهو
 * يتطلّب الرسم عند العرض المقصود ثم القياس.
 *
 * `transform` لا يغيّر التخطيط، فارتفاع الغلاف يُضبط يدوياً بالارتفاع الطبيعي
 * مضروباً في معامل التصغير — وإلا لترك المحتوى المُصغَّر فراغاً تحته.
 *
 * ونقطة الأصل `top right` لأن الصفحة RTL: الطفل الأعرض من أبيه يحاذي حافة
 * البداية (اليمنى) ويفيض يساراً، فالتصغير من اليمين يُبقيه في مكانه.
 */
export function ScaledPreview({ width, children }: { width: number; children: ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      // القياس في الإطار التالي: صور الأقسام تُغيّر الارتفاع بعد تحميلها،
      // والقياس داخل نداء المراقب نفسه يُطلق تحذير الحلقة في المتصفّح.
      frame = requestAnimationFrame(() => {
        const next = Math.min(1, outer.clientWidth / width);
        setScale(next);
        setHeight(inner.offsetHeight * next);
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(outer);
    observer.observe(inner);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [width, children]);

  return (
    <div ref={outerRef} className="overflow-hidden" style={{ height }}>
      <div
        ref={innerRef}
        style={{ width, transform: `scale(${scale})`, transformOrigin: 'top right' }}
      >
        {children}
      </div>
    </div>
  );
}
