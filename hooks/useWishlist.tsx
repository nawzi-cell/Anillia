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
import { apiFetch, type ProductListItem, type WishlistRow } from "@/lib/api/client";
import { useCart } from "./useCart";
import { useAuth } from "./useAuth";

interface WishlistContextValue {
  items: ProductListItem[];
  loading: boolean;
  count: number;
  isWished: (productId: string) => boolean;
  toggle: (product: ProductListItem) => Promise<void>;
  moveToCart: (product: ProductListItem) => Promise<void>;
  refresh: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { addItem } = useCart();
  const [items, setItems] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      // GET /api/wishlist returns a bare array of rows: [{ id, product, ... }]
      const data = await apiFetch<WishlistRow[]>("/api/wishlist");
      setItems((data ?? []).map((row) => row.product));
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    refresh().finally(() => setLoading(false));
  }, [user, authLoading, refresh]);

  const isWished = useCallback(
    (productId: string) => items.some((p) => p.id === productId),
    [items]
  );

  const toggle = useCallback(
    async (product: ProductListItem) => {
      if (!user) {
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      if (isWished(product.id)) {
        await apiFetch(`/api/wishlist/${product.id}`, { method: "DELETE" });
      } else {
        await apiFetch("/api/wishlist", {
          method: "POST",
          body: { productId: product.id },
        });
      }
      await refresh();
    },
    [user, isWished, refresh]
  );

  const moveToCart = useCallback(
    async (product: ProductListItem) => {
      await addItem(product.id, undefined, 1);
      await apiFetch(`/api/wishlist/${product.id}`, { method: "DELETE" });
      await refresh();
    },
    [addItem, refresh]
  );

  const value = useMemo(
    () => ({
      items,
      loading,
      count: items.length,
      isWished,
      toggle,
      moveToCart,
      refresh,
    }),
    [items, loading, isWished, toggle, moveToCart, refresh]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
