"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { CartItemRow } from "@/components/cart/CartDrawer";
import { CartSummary } from "@/components/cart/CartSummary";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

export default function CartPage() {
  const { cart, loading } = useCart();

  return (
    <div className="container-x pb-16 md:pb-20">
      <Breadcrumbs trail={[{ label: "Shopping Bag" }]} />
      <h1 className="mb-8 mt-2 font-serif text-4xl text-espresso md:text-5xl">
        Shopping Bag
      </h1>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : cart.items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Your bag is empty"
          description="Beautiful modest essentials are waiting. Start with our best sellers."
          action={
            <Link href="/shop">
              <Button>Start shopping</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          <div>
            <ul className="divide-y divide-espresso/10 rounded-2xl border border-espresso/10 bg-ivory-light px-6">
              {cart.items.map((item) => (
                <CartItemRow key={item.id} itemId={item.id} />
              ))}
            </ul>
            <Link
              href="/shop"
              className="mt-6 inline-block font-sans text-xs font-semibold uppercase tracking-widest2 text-espresso underline underline-offset-4 hover:text-taupe-dark"
            >
              Continue shopping
            </Link>
          </div>
          <CartSummary />
        </div>
      )}
    </div>
  );
}
