import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useStoreWishlist } from '@/contexts/StoreWishlistContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Package, Heart, Truck, LogOut, LogIn } from 'lucide-react';

/**
 * Storefront account control — shared by the store and catalog headers.
 * Signed-in: an avatar dropdown (profile / orders / wishlist / track / logout).
 * Signed-out: a login button.
 */
export function AccountMenu() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const wishlist = useStoreWishlist();

  if (!user) {
    return (
      <Button variant="ghost" size="sm" onClick={() => navigate('/login')} className="gap-2 rounded-full press">
        <LogIn className="w-4 h-4" />
        <span className="hidden sm:inline">دخول</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="حسابي" className="rounded-full border-border h-10 w-10 press hover:border-primary/50 hover:bg-primary/5">
          <User className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="font-semibold">حسابي</span>
          <span className="text-xs text-muted-foreground font-normal truncate" dir="ltr">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/my-profile')} className="gap-2 cursor-pointer">
          <User className="w-4 h-4 text-muted-foreground" /> ملفي الشخصي
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/my-orders')} className="gap-2 cursor-pointer">
          <Package className="w-4 h-4 text-muted-foreground" /> طلباتي
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/wishlist')} className="gap-2 cursor-pointer">
          <Heart className="w-4 h-4 text-muted-foreground" /> المفضلة
          {wishlist.count > 0 && <span className="ms-auto text-xs font-semibold text-primary">{wishlist.count}</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/track')} className="gap-2 cursor-pointer">
          <Truck className="w-4 h-4 text-muted-foreground" /> تتبّع الطلب
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="w-4 h-4" /> تسجيل الخروج
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
