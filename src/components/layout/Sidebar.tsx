import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  ClipboardList,
  PlusCircle,
  ChefHat,
  Store,
  Users,
  Settings,
  Menu,
  X,
  Package,
  BarChart3,
  Activity,
  MessageCircle,
  QrCode,
  Truck,
  Cake,
  CakeSlice,
  Palette,
  PartyPopper,
  Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarLogo } from './SidebarLogo';
import { UserMenu } from '@/components/auth/UserMenu';
import { useMyRoles, AppRole } from '@/hooks/useMyRoles';

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  allowedRoles: AppRole[];
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

/* Grouped navigation — items are role-filtered per group; empty groups drop out.
   Section headings only appear when more than one group is visible, so a role
   with a single relevant section still gets a clean, flat list. */
const menuGroups: MenuGroup[] = [
  {
    label: 'الرئيسية',
    items: [
      { icon: Activity, label: 'المتابعة المباشرة', path: '/live', allowedRoles: ['admin', 'call_center', 'kitchen'] },
    ],
  },
  {
    label: 'الطلبات',
    items: [
      { icon: MessageCircle, label: 'الرسائل والطلبات', path: '/submissions', allowedRoles: ['admin', 'call_center'] },
      { icon: ClipboardList, label: 'جميع الطلبات', path: '/orders', allowedRoles: ['admin', 'call_center'] },
      { icon: PlusCircle, label: 'طلب جديد', path: '/orders/new', allowedRoles: ['admin', 'call_center', 'branch'] },
      { icon: Cake, label: 'طلب مخصص', path: '/custom-orders', allowedRoles: ['admin', 'call_center', 'branch'] },
      { icon: PartyPopper, label: 'ضيافة مناسبة', path: '/orders/new-event', allowedRoles: ['admin', 'call_center', 'branch'] },
    ],
  },
  {
    label: 'العمليات',
    items: [
      { icon: ChefHat, label: 'المطبخ المركزي', path: '/kitchen', allowedRoles: ['admin', 'kitchen'] },
      { icon: Store, label: 'طلبات الفرع', path: '/branch-orders', allowedRoles: ['admin', 'branch'] },
      { icon: QrCode, label: 'ماسح الاستلام', path: '/branch-pickup', allowedRoles: ['branch'] },
      { icon: Activity, label: 'العمليات المباشرة', path: '/branch-live', allowedRoles: ['admin', 'branch'] },
      { icon: Truck, label: 'لوحة السائق', path: '/driver', allowedRoles: ['admin', 'driver'] },
    ],
  },
  {
    label: 'الإدارة',
    items: [
      { icon: Package, label: 'المنتجات', path: '/products', allowedRoles: ['admin'] },
      { icon: CakeSlice, label: 'تصميم الكيك', path: '/cake-design', allowedRoles: ['admin'] },
      { icon: Store, label: 'إدارة الفروع', path: '/branches', allowedRoles: ['admin'] },
      { icon: Users, label: 'المستخدمين', path: '/users', allowedRoles: ['admin'] },
      { icon: Heart, label: 'دائرة المناسبات', path: '/loyalty', allowedRoles: ['admin'] },
      { icon: BarChart3, label: 'التقارير', path: '/reports', allowedRoles: ['admin'] },
    ],
  },
  {
    label: 'النظام',
    items: [
      { icon: Settings, label: 'الإعدادات', path: '/settings', allowedRoles: ['admin'] },
      { icon: Palette, label: 'دليل التصميم', path: '/design-system', allowedRoles: ['admin'] },
    ],
  },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { data: roles = [] } = useMyRoles();

  const visibleGroups = menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.allowedRoles.some((role) => roles.includes(role))),
    }))
    .filter((group) => group.items.length > 0);

  const showHeadings = visibleGroups.length > 1;

  return (
    <>
      {/* Mobile Toggle */}
      <Button
        variant="ghost"
        size="icon" aria-label="القائمة"
        className="fixed top-4 start-4 z-50 lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-foreground/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 start-0 h-screen w-72 bg-sidebar text-sidebar-foreground z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo - Fixed at top */}
        <div className="flex-shrink-0">
          <SidebarLogo />
        </div>

        {/* Navigation - Scrollable, grouped */}
        <nav className="flex-1 overflow-y-auto p-4">
          {visibleGroups.map((group, gi) => (
            <div key={group.label} className={cn(gi > 0 && 'mt-5')}>
              {showHeadings && (
                <div className="px-4 pb-2 pt-1 text-[11px] font-semibold text-sidebar-foreground/40">
                  {group.label}
                </div>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                        isActive
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground font-bold'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Info - Fixed at bottom */}
        <div className="flex-shrink-0 p-4 border-t border-sidebar-border">
          <UserMenu />
        </div>
      </aside>
    </>
  );
}
