"use client";

import type { ReactNode } from "react";
import { BrandLogo } from "@/components/shared/BrandLogo";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-ivory">
      <header className="flex justify-center py-6">
        <BrandLogo markClassName="h-10 w-auto" wordmarkClassName="text-2xl" />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md rounded-3xl border border-espresso/10 bg-ivory-light p-8 shadow-[0_2px_24px_rgba(42,37,33,0.06)]">
          <h1 className="font-serif text-3xl text-espresso">{title}</h1>
          {subtitle && (
            <p className="mt-2 font-sans text-sm text-espresso-muted">{subtitle}</p>
          )}
          <div className="mt-6">{children}</div>
        </div>
      </main>
      <footer className="pb-6 text-center">
        <p className="font-sans text-xs text-espresso-muted">
          © {new Date().getFullYear()} ANILLIÉA. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
