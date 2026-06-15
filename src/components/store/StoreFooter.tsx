import {
  Cake, Camera, Music, MessageCircle, Send, MapPin, Phone, Clock,
  CreditCard, Smartphone, Coins,
} from 'lucide-react';

interface StoreFooterProps {
  storeName: string;
  onNavigate: (path: string) => void;
  onShop: () => void;
}

// Social profiles — placeholder hrefs; the owner swaps these for real handles.
const SOCIAL = [
  { icon: Camera, label: 'إنستغرام', href: 'https://instagram.com' },
  { icon: Music, label: 'تيك توك', href: 'https://tiktok.com' },
  { icon: MessageCircle, label: 'واتساب', href: 'https://wa.me/966112345678' },
  { icon: Send, label: 'بريد', href: 'mailto:hello@pinkcake.sa' },
];

export function StoreFooter({ storeName, onNavigate, onShop }: StoreFooterProps) {
  const shopLinks = [
    { label: 'كيكات المناسبات', action: onShop },
    { label: 'تشيز كيك', action: onShop },
    { label: 'كب كيك', action: onShop },
    { label: 'حلويات فرنسية', action: onShop },
    { label: 'صمّمي كيكتك', action: () => onNavigate('/customize') },
  ];
  const helpLinks = [
    { label: 'تتبّعي طلبك', action: () => onNavigate('/track') },
    { label: 'سياسة التوصيل', action: () => onNavigate('/faq') },
    { label: 'الأسئلة الشائعة', action: () => onNavigate('/faq') },
    { label: 'تواصلي معنا', action: () => onNavigate('/contact') },
    { label: 'من نحن', action: () => onNavigate('/about') },
  ];

  return (
    <footer className="mt-12 lg:mt-16 bg-card border-t border-border/60">
      <div className="container mx-auto px-4 lg:px-6 py-12 lg:py-16">
        <div className="grid gap-10 md:gap-8 md:grid-cols-12">
          {/* Brand */}
          <div className="md:col-span-4">
            <button onClick={() => onNavigate('/')} className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl gradient-pink flex items-center justify-center shadow-rose-glow text-white">
                <Cake className="w-5 h-5" />
              </div>
              <div className="leading-tight text-start">
                <div className="font-display text-xl">{storeName}</div>
                <div className="text-[10px] text-muted-foreground tracking-widest uppercase">Patisserie</div>
              </div>
            </button>
            <p className="text-sm text-muted-foreground leading-relaxed mt-4 max-w-xs">
              كيكات وحلويات مصممة يدوياً بأجود المكونات، نصنعها بحب لنُحضر لكِ لحظات لا تُنسى.
            </p>
            <div className="flex items-center gap-2 mt-5">
              {SOCIAL.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-full border border-border flex items-center justify-center press hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <nav className="md:col-span-2">
            <div className="text-xs tracking-widest uppercase text-muted-foreground font-medium mb-4">تسوّقي</div>
            <ul className="space-y-2.5 text-sm">
              {shopLinks.map((l) => (
                <li key={l.label}>
                  <button onClick={l.action} className="text-foreground/80 hover:text-primary transition-colors">
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Help */}
          <nav className="md:col-span-2">
            <div className="text-xs tracking-widest uppercase text-muted-foreground font-medium mb-4">المساعدة</div>
            <ul className="space-y-2.5 text-sm">
              {helpLinks.map((l) => (
                <li key={l.label}>
                  <button onClick={l.action} className="text-foreground/80 hover:text-primary transition-colors">
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div className="md:col-span-4">
            <div className="text-xs tracking-widest uppercase text-muted-foreground font-medium mb-4">زورينا</div>
            <ul className="space-y-3 text-sm text-foreground/80">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>حي الورود، شارع الأمير سلطان<br />الرياض، المملكة العربية السعودية</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <span dir="ltr">+966 11 234 5678</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-primary shrink-0" />
                <span>يومياً من 9 صباحاً حتى 11 مساءً</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© 2026 {storeName} Patisserie. جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('/terms')} className="text-xs text-muted-foreground hover:text-primary transition-colors">الشروط والأحكام</button>
            <button onClick={() => onNavigate('/privacy')} className="text-xs text-muted-foreground hover:text-primary transition-colors">الخصوصية</button>
            <div className="flex items-center gap-1.5 ms-2 text-muted-foreground">
              <CreditCard className="w-5 h-5" />
              <Smartphone className="w-5 h-5" />
              <Coins className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
