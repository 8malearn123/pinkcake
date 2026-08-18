import { useNavigate } from 'react-router-dom';
import { CalendarHeart, Crown, Gift, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Eyebrow, Lede, Title } from '@/components/ds';
import { toArabicDigits } from '@/lib/arabicNumerals';
import { useMyLoyalty, useMyOccasions } from '@/hooks/useLoyalty';
import {
  HIJRI_MONTHS,
  OCCASION_TYPES,
  daysUntilLabel,
  nextOccasion,
  pluralAr,
} from '@/lib/loyalty/program';

const TYPE_EMOJI = OCCASION_TYPES.reduce<Record<string, string>>(
  (acc, t) => ({ ...acc, [t.value]: t.emoji }),
  {},
);

/**
 * The piped-icing edge that closes the hero band — background-coloured
 * semicircles bitten out of the blush wash. Token-driven (it paints with
 * `--background`), so it follows the theme instead of pinning a cream.
 */
const SCALLOP: React.CSSProperties = {
  background:
    'radial-gradient(circle at 11px 0, hsl(var(--background)) 11px, transparent 11.5px) repeat-x',
  backgroundSize: '22px 22px',
};

interface AccountHeroProps {
  name: string | null;
  email: string;
  phone: string | null;
  isLoading?: boolean;
}

/**
 * The account band.
 *
 * Replaces the old header, which made the login **email** the page's h1 — the
 * one string on the screen that is neither the customer's name nor anything she
 * chose. The greeting leads with her first name, the email demotes to a meta
 * pill, and the space that opens up carries the only thing on this page that is
 * time-sensitive: the next occasion in her registry.
 *
 * That spotlight is deliberate. «سجل المناسبات» below is a *list* — good for
 * managing, useless for reminding. The countdown is the reminder, and it is the
 * one place on the page where an account view can turn into an order.
 */
export function AccountHero({ name, email, phone, isLoading }: AccountHeroProps) {
  const { data: summary } = useMyLoyalty();
  const { data: occasions = [] } = useMyOccasions();

  const firstName = name?.trim().split(/\s+/)[0] ?? '';
  const monogram = (firstName || email).charAt(0).toLocaleUpperCase('ar');
  const isCircle = summary?.tier === 'circle';
  const rewards = summary?.available_rewards ?? 0;
  const next = nextOccasion(occasions);

  return (
    <header className="relative isolate overflow-hidden bg-gradient-to-b from-blush via-blush/50 to-background">
      {/* Two soft blooms and a scatter of gold — the storefront's decorative
          register, kept to the band so the panels below stay quiet. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 start-[-12%] size-72 rounded-full bg-primary/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 end-[-8%] size-80 rounded-full bg-gold/20 blur-3xl"
      />
      <span aria-hidden className="sparkle pointer-events-none absolute end-[14%] top-10 text-gold">
        ✦
      </span>
      <span
        aria-hidden
        className="sparkle pointer-events-none absolute end-[26%] top-24 text-sm text-gold"
        style={{ animationDelay: '0.8s' }}
      >
        ✦
      </span>
      <span
        aria-hidden
        className="sparkle pointer-events-none absolute start-[10%] top-16 text-sm text-gold"
        style={{ animationDelay: '1.6s' }}
      >
        ✦
      </span>

      <div className="relative mx-auto max-w-[820px] px-5 pb-16 pt-12 sm:px-8 lg:pb-20 lg:pt-16">
        <div className="flex items-center gap-4 sm:gap-5">
          {/* Monogram — her initial, not a generic person glyph. */}
          <div className="relative shrink-0">
            <div className="gradient-pink grid size-[72px] place-items-center rounded-[1.75rem] text-[2rem] font-semibold leading-none text-primary-foreground shadow-ink-soft-lg ring-1 ring-inset ring-white/25">
              {monogram}
            </div>
            {/* The tier reads as a crown pinned to her own initial. The worded
                chip lives once, on the stamp card below — three crowns on one
                screen is a sticker, not a status. */}
            {isCircle && (
              <span className="absolute -bottom-1.5 -start-1.5 grid size-8 place-items-center rounded-full border-[3px] border-background bg-gold text-primary">
                <Crown className="size-4" aria-hidden />
                <span className="sr-only">دائرة مميّزة</span>
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <Eyebrow rule caps>
              حسابي
            </Eyebrow>
            {isLoading && !firstName ? (
              <Skeleton className="mt-3 h-9 w-56" />
            ) : (
              <Title variant="h2" as="h1" className="mt-2 truncate">
                {firstName ? `أهلاً، ${firstName}` : 'أهلاً بك'}
              </Title>
            )}
          </div>
        </div>

        <Lede className="mt-5 max-w-xl">
          {isCircle
            ? 'أنتِ في «دائرة مميّزة» — أولوية في مواعيد الخميس والجمعة ومواسم العيد، ومكافآت تُضاف إلى طلبك.'
            : 'مناسباتك محفوظة عندنا، ومكافآتك تكبر مع كل طلب — كل ما تحتاجينه في مكان واحد.'}
        </Lede>

        {/* Identity meta — the email lives here now, at its real weight. */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <MetaPill icon={Mail}>
            <bdi dir="ltr">{email}</bdi>
          </MetaPill>
          {phone && (
            <MetaPill icon={Phone}>
              <bdi dir="ltr">{phone}</bdi>
            </MetaPill>
          )}
          {rewards > 0 && (
            <a
              href="#rewards"
              className="press inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
            >
              <Gift className="size-3.5" />
              {toArabicDigits(rewards)} مكافأة بانتظارك
            </a>
          )}
        </div>

        <NextOccasionTicket next={next} />
      </div>

      <div aria-hidden className="absolute inset-x-0 bottom-0 h-[11px]" style={SCALLOP} />
    </header>
  );
}

/* ── الأجزاء ───────────────────────────────────────────────────────────── */

function MetaPill({
  icon: Icon,
  children,
}: {
  icon: typeof Mail;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-primary/20 bg-card/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground backdrop-blur-sm">
      <Icon className="size-3.5 shrink-0 text-primary" />
      <span className="truncate">{children}</span>
    </span>
  );
}

/**
 * «القادم» — تذكرة بحافة مثقّبة: العدّ التنازلي على يمين الخط المنقّط،
 * والمناسبة ونداء التجهيز على يساره.
 */
function NextOccasionTicket({ next }: { next: ReturnType<typeof nextOccasion> }) {
  const navigate = useNavigate();

  if (!next) {
    return (
      <div className="mt-8 flex flex-wrap items-center gap-4 rounded-3xl border border-dashed border-primary/30 bg-card/70 p-5 backdrop-blur-sm">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-blush text-primary">
          <CalendarHeart className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold">سجلّك فاضي — وأول مناسبة تكفي لنبدأ</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            احفظي اسم المناسبة ويومها، ونذكّرك قبلها بوقت كافٍ للتجهيز.
          </p>
        </div>
        <Button variant="outlineBrand" size="pill" className="shrink-0" asChild>
          <a href="#occasions">أضيفي مناسبة</a>
        </Button>
      </div>
    );
  }

  const emoji = TYPE_EMOJI[next.occasion_type] ?? '✨';
  const soon = next.days_until <= 14;

  return (
    <div className="mt-8 overflow-hidden rounded-3xl border border-gold/40 bg-card/80 shadow-ink-soft backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-4 p-4 sm:gap-5 sm:p-5">
        {/* العدّ التنازلي */}
        <div className="flex size-[68px] shrink-0 flex-col items-center justify-center rounded-2xl border border-gold/40 bg-gold-soft/25 text-gold-deep">
          {next.days_until <= 0 ? (
            <span className="px-1 text-center text-sm font-semibold leading-tight">اليوم</span>
          ) : (
            <>
              <span className="text-[26px] font-semibold leading-none">
                {toArabicDigits(next.days_until)}
              </span>
              <span className="mt-1 text-[10px] font-bold">
                {pluralAr(next.days_until, 'يوم', 'يومان', 'أيام', 'يوماً')}
              </span>
            </>
          )}
        </div>

        {/* الحافة المنقّطة — تفصل العدّ عن التفاصيل كتذكرة */}
        <span
          aria-hidden
          className="hidden h-14 w-px shrink-0 border-e border-dashed border-gold/50 sm:block"
        />

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[.22em] text-rose">أقرب مناسبة</p>
          <p className="mt-1.5 flex items-center gap-2 truncate text-lg font-semibold">
            <span aria-hidden>{emoji}</span>
            {next.label}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {toArabicDigits(next.occasion_day)} {HIJRI_MONTHS[next.occasion_month - 1]} ·{' '}
            {daysUntilLabel(next.days_until)}
          </p>
        </div>

        <Button
          variant={soon ? 'brand' : 'outlineBrand'}
          size="pill"
          className="w-full shrink-0 sm:w-auto"
          onClick={() => navigate('/shop')}
        >
          جهّزي كيكتها
        </Button>
      </div>
    </div>
  );
}
