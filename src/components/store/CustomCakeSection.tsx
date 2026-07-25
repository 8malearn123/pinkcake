interface CustomCakeSectionProps {
  /** Opens the design-your-cake studio (/customize). */
  onDesign: () => void;
}

// Faithful clone of the design's #custom section; primary CTA opens /customize.
export function CustomCakeSection({ onDesign }: CustomCakeSectionProps) {
  return (
    <section id="custom" className="bg-[#fffdfa] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
      <div className="mx-auto grid max-w-[1420px] gap-8 rounded-[2rem] border border-[#9e3a5c]/10 bg-white p-8 shadow-[0_30px_90px_-55px_rgba(158,58,92,0.45)] sm:p-12 lg:grid-cols-[1fr_.75fr] lg:items-center">
        <div>
          <p className="text-xs font-bold tracking-[.1em] text-[#b0506e]">للمناسبات الكبيرة</p>
          <h2 className="mt-4 text-3xl font-black leading-[1.4] text-[#2c2226] sm:text-4xl">فكرة خاصة؟ نصنعها لكِ كما تتخيلينها.</h2>
          <p className="mt-4 max-w-xl text-sm leading-8 text-[#7d6870]">أرسلي لنا تفاصيل مناسبتك، الألوان، وعدد الضيوف. فريقنا يتواصل معك لتأكيد التصميم والسعر.</p>
        </div>
        <div className="rounded-2xl border border-[#9e3a5c]/10 bg-[#fffdfa] p-6">
          <p className="text-sm font-bold text-[#9e3a5c]">ابدئي طلبك الخاص</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button onClick={onDesign} className="rounded-md bg-[#9e3a5c] px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-[#b0506e]">اطلبي تورتة مخصصة</button>
            <a href="https://wa.me/966500000000" target="_blank" rel="noopener noreferrer" className="rounded-md border border-[#9e3a5c]/30 px-4 py-3 text-center text-xs font-bold text-[#9e3a5c] transition-colors hover:bg-[#fbeef2]">تواصلي عبر واتساب</a>
          </div>
        </div>
      </div>
    </section>
  );
}
