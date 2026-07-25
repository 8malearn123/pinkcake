import { ShieldCheck, Truck, RefreshCw, CreditCard } from "lucide-react";

const badges = [
  { icon: Truck, title: "توصيل نفس اليوم", desc: "داخل جازان قبل ٣ مساءً" },
  { icon: ShieldCheck, title: "جودة مضمونة", desc: "طازجة ومخبوزة بعد طلبك" },
  { icon: CreditCard, title: "دفع آمن", desc: "مدى، فيزا، آبل باي وتابي" },
  { icon: RefreshCw, title: "رضاك أولاً", desc: "نعوّضك إذا ما وصل مثاليًا" },
];

export function TrustBadges() {
  return (
    <section className="border-b border-[#9e3a5c]/10 bg-[#fffdfa] px-5 py-6 sm:px-8 lg:px-12">
      <div className="mx-auto grid max-w-[1500px] gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {badges.map((b) => (
          <div key={b.title} className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#fbeef2] text-[#9e3a5c] ring-1 ring-[#9e3a5c]/10">
              <b.icon size={20} />
            </span>
            <div>
              <p className="text-sm font-bold text-[#9e3a5c]">{b.title}</p>
              <p className="mt-0.5 text-xs text-[#857077]">{b.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
