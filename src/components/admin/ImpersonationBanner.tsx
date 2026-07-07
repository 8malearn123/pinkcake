import { useLayoutEffect, useRef } from 'react';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { Button } from '@/components/ui/button';
import { AlertTriangle, LogOut } from 'lucide-react';

// Map role names to Arabic
const roleLabels: Record<string, string> = {
  admin: 'مدير النظام',
  call_center: 'مركز الاتصال',
  kitchen: 'المطبخ',
  branch: 'مدير الفرع',
  customer: 'عميل',
  customer_support: 'خدمة العملاء',
  driver: 'سائق',
};

export function ImpersonationBanner() {
  const { isImpersonating, impersonatedUser, endImpersonation } = useImpersonation();
  const bannerRef = useRef<HTMLDivElement>(null);

  // The banner is fixed to the top, so reserve matching space on the page body
  // while impersonating — otherwise it overlaps the page's own top bar. Measured
  // (not hard-coded) so it stays correct as the banner wraps across breakpoints.
  useLayoutEffect(() => {
    if (!isImpersonating || !impersonatedUser) {
      document.body.style.paddingTop = '';
      return;
    }
    const el = bannerRef.current;
    if (!el) return;
    const apply = () => { document.body.style.paddingTop = `${el.offsetHeight}px`; };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    window.addEventListener('resize', apply);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', apply);
      document.body.style.paddingTop = '';
    };
  }, [isImpersonating, impersonatedUser]);

  if (!isImpersonating || !impersonatedUser) {
    return null;
  }

  const rolesDisplay = impersonatedUser.roles
    .map(role => roleLabels[role] || role)
    .join(', ');

  return (
    <div ref={bannerRef} className="fixed top-0 end-0 start-0 z-[100] bg-destructive text-destructive-foreground px-4 py-2 shadow-lg">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-pulse" />
          <span className="font-medium text-sm md:text-base">
            ⚠️ وضع التحكم الإداري — أنت تعمل كـ{' '}
            <span className="font-bold underline">{impersonatedUser.fullName || 'مستخدم'}</span>
            {rolesDisplay && (
              <span className="opacity-90 text-xs md:text-sm ms-2 bg-destructive-foreground/20 px-2 py-0.5 rounded">
                ({rolesDisplay})
              </span>
            )}
            {impersonatedUser.branchName && (
              <span className="opacity-90 text-xs md:text-sm ms-2">
                — {impersonatedUser.branchName}
              </span>
            )}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={endImpersonation}
          className="bg-destructive-foreground/20 border-destructive-foreground/50 text-destructive-foreground hover:bg-destructive-foreground/30 gap-2 whitespace-nowrap"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">إنهاء التحكم والعودة للإدمن</span>
          <span className="sm:hidden">خروج</span>
        </Button>
      </div>
    </div>
  );
}
