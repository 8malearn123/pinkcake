import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';

export type LozaCartItem = {
  id: string; // unique cart line id
  productId: string;
  name: string;
  vendor: string;
  emoji?: string;
  imageUrl?: string;
  unitPrice: number;
  quantity: number;
  notes?: string;
  // For custom cake
  isCustom?: boolean;
  customSpec?: {
    base: string;
    flavors: string[];
    colors: string[];
    designId?: string;
    text?: string;
    hasPrint?: boolean;
    chefNote?: string;
  };
};

export type LozaOrder = {
  id: string;
  number: string;
  createdAt: string;
  items: LozaCartItem[];
  subtotal: number;
  delivery: number;
  total: number;
  recipientName: string;
  recipientPhone: string;
  address: string;
  city: string;
  deliveryDate: string;
  deliveryTime: string;
  deliveryType: 'self' | 'gift';
  giftMessage?: string;
  paymentMethod: 'card' | 'apple-pay' | 'cod' | 'stc-pay';
  status: 'placed' | 'confirmed' | 'preparing' | 'on-the-way' | 'delivered' | 'cancelled';
  vendor: string;
};

type Ctx = {
  items: LozaCartItem[];
  add: (item: Omit<LozaCartItem, 'id'>) => void;
  remove: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  // orders
  orders: LozaOrder[];
  placeOrder: (data: Omit<LozaOrder, 'id' | 'number' | 'createdAt' | 'items' | 'subtotal' | 'total' | 'status' | 'vendor'>) => LozaOrder;
  getOrder: (id: string) => LozaOrder | undefined;
  // wishlist
  wishlist: string[];
  toggleWish: (productId: string) => void;
  // address book
  defaultCity: string;
  setDefaultCity: (c: string) => void;
};

const LozaCartContext = createContext<Ctx | null>(null);

const STORAGE_CART = 'loza:cart:v1';
const STORAGE_ORDERS = 'loza:orders:v1';
const STORAGE_WISH = 'loza:wishlist:v1';
const STORAGE_CITY = 'loza:city:v1';

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function LozaCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<LozaCartItem[]>(() => loadJSON(STORAGE_CART, []));
  const [orders, setOrders] = useState<LozaOrder[]>(() => loadJSON(STORAGE_ORDERS, []));
  const [wishlist, setWishlist] = useState<string[]>(() => loadJSON(STORAGE_WISH, []));
  const [defaultCity, setDefaultCityState] = useState<string>(() => loadJSON(STORAGE_CITY, 'جازان'));

  useEffect(() => { localStorage.setItem(STORAGE_CART, JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem(STORAGE_ORDERS, JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem(STORAGE_WISH, JSON.stringify(wishlist)); }, [wishlist]);
  useEffect(() => { localStorage.setItem(STORAGE_CITY, JSON.stringify(defaultCity)); }, [defaultCity]);

  const add: Ctx['add'] = (item) => {
    setItems((prev) => {
      // merge if same product non-custom
      if (!item.isCustom) {
        const idx = prev.findIndex((p) => p.productId === item.productId && !p.isCustom);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], quantity: next[idx].quantity + item.quantity };
          return next;
        }
      }
      return [...prev, { ...item, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }];
    });
    toast({ title: 'تمت الإضافة للسلة 🛒', description: item.name });
  };

  const remove: Ctx['remove'] = (id) => setItems((prev) => prev.filter((p) => p.id !== id));
  const updateQty: Ctx['updateQty'] = (id, qty) => {
    if (qty <= 0) return remove(id);
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, quantity: qty } : p)));
  };
  const clear = () => setItems([]);

  const count = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((s, i) => s + i.unitPrice * i.quantity, 0), [items]);

  const placeOrder: Ctx['placeOrder'] = (data) => {
    const number = `LZ-${Date.now().toString().slice(-6)}`;
    const order: LozaOrder = {
      id: `order-${Date.now()}`,
      number,
      createdAt: new Date().toISOString(),
      items: [...items],
      subtotal,
      delivery: data.delivery,
      total: subtotal + data.delivery,
      vendor: items[0]?.vendor || 'لوزا',
      status: 'placed',
      ...data,
    };
    setOrders((prev) => [order, ...prev]);
    setItems([]);
    return order;
  };

  const getOrder = (id: string) => orders.find((o) => o.id === id);

  const toggleWish = (productId: string) =>
    setWishlist((prev) => (prev.includes(productId) ? prev.filter((p) => p !== productId) : [...prev, productId]));

  const setDefaultCity = (c: string) => setDefaultCityState(c);

  return (
    <LozaCartContext.Provider
      value={{ items, add, remove, updateQty, clear, count, subtotal, orders, placeOrder, getOrder, wishlist, toggleWish, defaultCity, setDefaultCity }}
    >
      {children}
    </LozaCartContext.Provider>
  );
}

export function useLozaCart() {
  const ctx = useContext(LozaCartContext);
  if (!ctx) throw new Error('useLozaCart must be inside LozaCartProvider');
  return ctx;
}
