import { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Receipt, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LozaCartProvider, useLozaCart } from '@/contexts/LozaCartContext';

const TABS = [
  { to: '/loza', label: 'الرئيسية', icon: Home, end: true, key: 'home' },
  { to: '/loza/cart', label: 'السلة', icon: ShoppingBag, end: false, key: 'cart' },
  { to: '/loza/orders', label: 'طلباتي', icon: Receipt, end: false, key: 'orders' },
  { to: '/loza/profile', label: 'حسابي', icon: User, end: false, key: 'profile' },
];

export default function LozaShell({ children }: { children: ReactNode }) {
  return (
    <LozaCartProvider>
      <LozaShellInner>{children}</LozaShellInner>
    </LozaCartProvider>
  );
}

function LozaShellInner({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const { count } = useLozaCart();
  const hideNav = loc.pathname.startsWith('/loza/customize');

  return (
    <div className="loza-theme min-h-screen bg-background text-foreground" dir="rtl">
      <div className={cn('min-h-screen', !hideNav && 'pb-24')}>{children}</div>
      {!hideNav && (
        <nav className="fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-border">
          <div className="container mx-auto px-2 max-w-2xl">
            <ul className="grid grid-cols-4">
              {TABS.map((t) => {
                const Icon = t.icon;
                return (
                  <li key={t.to}>
                    <NavLink
                      to={t.to}
                      end={t.end}
                      className={({ isActive }) =>
                        cn(
                          'flex flex-col items-center gap-1 py-3 text-[11px] transition-colors',
                          isActive
                            ? 'text-primary font-bold'
                            : 'text-muted-foreground/70 hover:text-foreground'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div
                            className={cn(
                              'p-2 rounded-2xl transition-all relative',
                              isActive && 'gradient-loza-gold shadow-loza-lift'
                            )}
                          >
                            <Icon
                              className={cn(
                                'w-5 h-5',
                                isActive ? 'text-[hsl(var(--loza-brown))]' : ''
                              )}
                            />
                            {t.key === 'cart' && count > 0 && (
                              <span className="absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center">
                                {count}
                              </span>
                            )}
                          </div>
                          <span>{t.label}</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      )}
    </div>
  );
}
