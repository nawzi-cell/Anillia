"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiFetch, emptyCart, type CartData } from "@/lib/api/client";

interface CartContextValue {
  cart: CartData;
  loading: boolean;
  count: number;
  refresh: () => Promise<void>;
  addItem: (productId: string, variantId?: string, quantity?: number) => Promise<void>;
  updateQty: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  clear: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartData>(emptyCart);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await apiFetch<CartData>("/api/cart");
      setCart(data ?? emptyCart);
    } catch {
      setCart(emptyCart);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const addItem = useCallback(
    async (productId: string, variantId?: string, quantity = 1) => {
      await apiFetch("/api/cart/items", {
        method: "POST",
        body: { productId, variantId, quantity },
      });
      await refresh();
    },
    [refresh]
  );

  const updateQty = useCallback(
    async (itemId: string, quantity: number) => {
      if (quantity <= 0) {
        await apiFetch(`/api/cart/items/${itemId}`, { method: "DELETE" });
      } else {
        await apiFetch(`/api/cart/items/${itemId}`, {
          method: "PUT",
          body: { quantity },
        });
      }
      await refresh();
    },
    [refresh]
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      await apiFetch(`/api/cart/items/${itemId}`, { method: "DELETE" });
      await refresh();
    },
    [refresh]
  );

  const applyCoupon = useCallback(
    async (code: string) => {
      await apiFetch("/api/cart/coupon", { method: "POST", body: { code } });
      await refresh();
    },
    [refresh]
  );

  const removeCoupon = useCallback(async () => {
    await apiFetch("/api/cart/coupon", { method: "DELETE" });
    await refresh();
  }, [refresh]);

  const clear = useCallback(async () => {
    setCart(emptyCart);
    await refresh();
  }, [refresh]);

  const count = useMemo(
    () => cart.items.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const value = useMemo(
    () => ({
      cart,
      loading,
      count,
      refresh,
      addItem,
      updateQty,
      removeItem,
      applyCoupon,
      removeCoupon,
      clear,
    }),
    [cart, loading, count, refresh, addItem, updateQty, removeItem, applyCoupon, removeCoupon, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
