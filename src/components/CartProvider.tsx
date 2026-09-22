"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type CartLine = {
  id: number;
  productId: number;
  slug: string;
  name: string;
  brand: string;
  image: string;
  size: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  stock: number;
  comboPercentOff: number | null;
  comboPartnerName: string | null;
  poolName: string | null;
};

export type CartSummary = {
  lines: CartLine[];
  itemCount: number;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
};

type CartContextValue = {
  cart: CartSummary;
  loading: boolean;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (productId: number, size: string, quantity?: number) => Promise<void>;
  setQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  refresh: () => Promise<void>;
};

const EMPTY: CartSummary = {
  lines: [],
  itemCount: 0,
  subtotalCents: 0,
  shippingCents: 0,
  totalCents: 0,
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartSummary>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (res.ok) setCart((await res.json()) as CartSummary);
    } catch {
      /* offline — keep last known cart */
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const mutate = useCallback(
    async (method: "POST" | "PATCH" | "DELETE", body: Record<string, unknown>) => {
      setLoading(true);
      try {
        const res = await fetch("/api/cart", {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          setCart((await res.json()) as CartSummary);
          router.refresh();
        }
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      loading,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      addItem: async (productId, size, quantity = 1) => {
        await mutate("POST", { productId, size, quantity });
        setDrawerOpen(true);
      },
      setQuantity: async (itemId, quantity) => {
        await mutate("PATCH", { itemId, quantity });
      },
      removeItem: async (itemId) => {
        await mutate("DELETE", { itemId });
      },
      refresh,
    }),
    [cart, loading, drawerOpen, mutate, refresh],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
