import { Link } from 'react-router-dom';
import { Construction } from 'lucide-react';
import LozaShell from './LozaShell';

export default function LozaPlaceholder({ title }: { title: string }) {
  return (
    <LozaShell>
      <div className="container mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="w-20 h-20 mx-auto rounded-3xl gradient-loza-gold flex items-center justify-center shadow-loza-lift mb-6">
          <Construction className="w-10 h-10 text-[hsl(var(--loza-brown))]" />
        </div>
        <h1 className="text-2xl font-bold font-loza-display">{title}</h1>
        <p className="text-muted-foreground text-sm mt-2">
          هذه الشاشة قيد التطوير ضمن مراحل بناء تطبيق لوزا
        </p>
        <Link
          to="/loza"
          className="inline-block mt-6 px-6 py-2.5 rounded-full gradient-loza-gold text-[hsl(var(--loza-brown))] font-bold text-sm"
        >
          العودة للرئيسية
        </Link>
      </div>
    </LozaShell>
  );
}
