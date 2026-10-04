"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, MapPin, Package, UserRound, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/Spinner";

const NAV = [
  { label: "Overview", href: "/account", icon: LayoutDashboard },
  { label: "Orders", href: "/account/orders", icon: Package },
  { label: "Profile", href: "/account/profile", icon: UserRound },
  { label: "Addresses", href: "/account/addresses", icon: MapPin },
];

export default function AccountLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, router, pathname]);

  if (loading || !user) {
    return (
      <div className="container-x flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  const signOut = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="container-x pb-16 md:pb-20">
      <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
        <aside aria-label="Account navigation" className="lg:sticky lg:top-28 lg:self-start">
          <div className="mb-6 hidden lg:block">
            <p className="eyebrow mb-1">My account</p>
            <h1 className="font-serif text-3xl text-espresso">{user.name}</h1>
          </div>
          <nav className="flex gap-2 overflow-x-auto no-scrollbar lg:flex-col">
            {NAV.map((item) => {
              const active =
                item.href === "/account"
                  ? pathname === "/account"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 font-sans text-sm transition-colors lg:rounded-xl ${
                    active
                      ? "bg-espresso text-ivory"
                      : "text-espresso-muted hover:bg-espresso/5 hover:text-espresso"
                  }`}
                >
                  <item.icon className="h-4 w-4" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={signOut}
              className="flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 font-sans text-sm text-espresso-muted transition-colors hover:bg-espresso/5 hover:text-espresso lg:rounded-xl"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Sign out
            </button>
          </nav>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
