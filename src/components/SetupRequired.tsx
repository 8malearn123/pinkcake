import { DatabaseZap } from 'lucide-react';

/**
 * Shown at startup when the Supabase connection env vars are missing. Self-
 * contained on purpose — it must NOT import the Supabase client (that import is
 * exactly what throws), so it uses only plain markup + lucide icons.
 */
export function SetupRequired({ missing }: { missing: string[] }) {
  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-muted px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
            <DatabaseZap className="w-6 h-6 text-warning" />
          </div>
          <div>
            <h1 className="text-xl font-bold">النظام غير متّصل بقاعدة البيانات</h1>
            <p className="text-sm text-muted-foreground">Supabase connection settings are missing.</p>
          </div>
        </div>

        <p className="mt-5 text-sm text-muted-foreground leading-relaxed">
          لم يعثر التطبيق على إعدادات الاتصال بـ Supabase، لذلك لم يتمكن من الإقلاع. هذه القيم تُحفظ
          محلياً في ملف <code className="text-foreground">.env</code> ولا تُرفع إلى المستودع.
        </p>

        <div className="mt-5 rounded-lg bg-muted/50 p-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">المتغيّرات الناقصة</p>
          <ul className="space-y-1" dir="ltr">
            {missing.map((key) => (
              <li key={key} className="font-mono text-sm text-destructive">{key}</li>
            ))}
          </ul>
        </div>

        <ol className="mt-6 space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="font-bold text-primary">1</span>
            <span>
              انسخ ملف القالب:
              <code dir="ltr" className="block mt-1 rounded bg-foreground/5 px-3 py-1.5 font-mono text-xs text-foreground">
                cp .env.example .env
              </code>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-primary">2</span>
            <span>
              املأ قيم المشروع من Supabase (لوحة التحكم → Project Settings → API):
              <code dir="ltr" className="block mt-1 rounded bg-foreground/5 px-3 py-1.5 font-mono text-xs text-foreground whitespace-pre-line">
                {'VITE_SUPABASE_URL="https://<ref>.supabase.co"\nVITE_SUPABASE_PUBLISHABLE_KEY="<anon-key>"'}
              </code>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-primary">3</span>
            <span>
              أعد تشغيل خادم التطوير:
              <code dir="ltr" className="block mt-1 rounded bg-foreground/5 px-3 py-1.5 font-mono text-xs text-foreground">
                npm run dev
              </code>
            </span>
          </li>
        </ol>

        <p className="mt-6 text-xs text-muted-foreground">
          راجع <code className="text-foreground">README.md</code> (قسم Environment variables) و{' '}
          <code className="text-foreground">.env.example</code> لمزيد من التفاصيل.
        </p>
      </div>
    </div>
  );
}
