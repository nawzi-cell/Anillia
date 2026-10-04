import type { ReactNode } from "react";
import { Suspense } from "react";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import { WishlistProvider } from "@/hooks/useWishlist";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  PageTransition,
  RouteProgress,
} from "@/components/layout/RouteTransition";

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <Suspense fallback={null}>
            <RouteProgress />
          </Suspense>
          <AnnouncementBar />
          <Header />
          <main id="main-content" className="min-h-[60vh]">
            <PageTransition>{children}</PageTransition>
          </main>
          <Footer />
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
