"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, LogOut, Menu } from "lucide-react";
import { Spinner } from "./Spinner";
import { BrandLogo } from "@/components/shared/BrandLogo";

interface TopbarProps {
  adminName: string;
  onMenuClick: () => void;
}

export function Topbar({ adminName, onMenuClick }: TopbarProps) {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // proceed to login regardless
    } finally {
      window.location.href = "/login";
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-espresso/10 bg-ivory/95 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="flex h-9 w-9 items-center justify-center rounded-md text-espresso transition hover:bg-espresso/5 lg:hidden"
        >
          <Menu size={20} />
        </button>
        <Link href="/admin" className="flex items-center gap-2">
          <BrandLogo
            href={null}
            markClassName="h-8 w-auto"
            wordmarkClassName="text-base"
          />
          <span className="hidden rounded-full bg-espresso/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest2 text-espresso-muted sm:inline">
            Admin
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <Link
          href="/"
          className="hidden items-center gap-1.5 text-sm font-medium text-espresso-muted transition hover:text-espresso sm:inline-flex"
        >
          <ExternalLink size={15} />
          View store
        </Link>
        <span className="hidden h-5 w-px bg-espresso/15 sm:block" aria-hidden />
        <span className="max-w-32 truncate text-sm font-medium text-espresso sm:max-w-none">
          {adminName}
        </span>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="inline-flex items-center gap-1.5 rounded-md border border-espresso/15 px-3 py-1.5 text-sm font-semibold text-espresso transition hover:border-espresso/40 disabled:opacity-60"
        >
          {loggingOut ? <Spinner size={14} /> : <LogOut size={15} />}
          <span className="hidden sm:inline">Log out</span>
        </button>
      </div>
    </header>
  );
}
