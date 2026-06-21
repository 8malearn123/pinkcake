import {
  MessageCircle,
  MapPin,
  Phone,
  Clock,
  Mail,
  Camera,
  Music,
  type LucideIcon,
} from 'lucide-react';
import { InfoPageLayout } from '@/components/store/InfoPageLayout';
import { ContactForm } from '@/components/store/ContactForm';

interface ContactDetail {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
}

const DETAILS: ContactDetail[] = [
  {
    icon: MapPin,
    label: 'العنوان',
    value: 'حي الورود، شارع الأمير سلطان، الرياض، المملكة العربية السعودية',
  },
  {
    icon: Phone,
    label: 'الهاتف',
    value: <span dir="ltr">+966 11 234 5678</span>,
  },
  {
    icon: Clock,
    label: 'أوقات العمل',
    value: 'يومياً من 9 صباحاً حتى 11 مساءً',
  },
  {
    icon: Mail,
    label: 'البريد الإلكتروني',
    value: 'hello@pinkcake.sa',
  },
];

const SOCIALS: { icon: LucideIcon; label: string; href: string }[] = [
  { icon: Camera, label: 'إنستغرام', href: 'https://instagram.com' },
  { icon: Music, label: 'تيك توك', href: 'https://tiktok.com' },
  { icon: MessageCircle, label: 'واتساب', href: 'https://wa.me/966112345678' },
];

export default function Contact() {
  return (
    <InfoPageLayout
      eyebrow="نحن هنا لمساعدتك"
      title="تواصل معنا"
      subtitle="هل لديك سؤال أو طلب خاص أو ترغب بمعرفة المزيد؟ يسعدنا أن نسمع منك، اختر الطريقة الأنسب لك للتواصل."
      icon={MessageCircle}
    >
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Contact details */}
        <div className="space-y-4">
          {DETAILS.map((detail) => {
            const Icon = detail.icon;
            return (
              <div
                key={detail.label}
                className="flex items-start gap-4 rounded-3xl border border-border/60 bg-card p-5"
              >
                <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-start">
                  <div className="text-xs text-muted-foreground tracking-widest uppercase font-medium">
                    {detail.label}
                  </div>
                  <div className="text-foreground leading-relaxed mt-1">{detail.value}</div>
                </div>
              </div>
            );
          })}

          {/* Social buttons */}
          <div className="rounded-3xl border border-border/60 bg-card p-5">
            <div className="text-xs text-muted-foreground tracking-widest uppercase font-medium mb-3">
              تابعنا
            </div>
            <div className="flex items-center gap-3">
              {SOCIALS.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Contact form */}
        <div className="rounded-3xl border border-border/60 bg-card p-6">
          <h2 className="font-display text-2xl">أرسل لنا رسالة</h2>
          <p className="text-muted-foreground leading-relaxed mt-1">
            املأ النموذج التالي وسنعاود التواصل معك في أقرب وقت ممكن.
          </p>
          <ContactForm submissionType="contact" />
        </div>
      </div>
    </InfoPageLayout>
  );
}
