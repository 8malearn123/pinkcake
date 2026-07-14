import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { StoreCartProvider, useStoreCart } from './StoreCartContext';
import type { CartItem, StoreProduct } from '@/hooks/useCustomerStore';

const STORAGE_KEY = 'pinkcake:cart:v1';

const product: StoreProduct = {
  id: 'p1',
  name: 'كيكة الشوكولاتة',
  description: null,
  price: 120,
  category: 'cakes',
  image_url: null,
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <StoreCartProvider>{children}</StoreCartProvider>
);

function readStored(): CartItem[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as CartItem[]) : [];
}

describe('StoreCartContext persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists the cart to localStorage under pinkcake:cart:v1 on change', () => {
    const { result } = renderHook(() => useStoreCart(), { wrapper });
    act(() => result.current.addToCart(product, 2));

    const saved = readStored();
    expect(saved).toHaveLength(1);
    expect(saved[0].product.id).toBe('p1');
    expect(saved[0].quantity).toBe(2);
  });

  it('rehydrates a freshly-mounted provider from localStorage', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ product, quantity: 3 }]));

    const { result } = renderHook(() => useStoreCart(), { wrapper });
    expect(result.current.cart).toHaveLength(1);
    expect(result.current.count).toBe(3);
    expect(result.current.total).toBe(360);
  });

  it('reflects clear() in the persisted store', () => {
    const { result } = renderHook(() => useStoreCart(), { wrapper });
    act(() => result.current.addToCart(product));
    act(() => result.current.clear());

    expect(result.current.cart).toHaveLength(0);
    expect(readStored()).toEqual([]);
  });

  it('falls back to an empty cart when stored JSON is corrupt', () => {
    localStorage.setItem(STORAGE_KEY, '{ not valid json');

    const { result } = renderHook(() => useStoreCart(), { wrapper });
    expect(result.current.cart).toEqual([]);
  });
});
