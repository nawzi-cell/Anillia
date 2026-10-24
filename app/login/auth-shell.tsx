"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
    <div className="min-h-screen bg-ivory lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <aside className="relative hidden min-h-screen overflow-hidden bg-espresso lg:block">
        <Image
          src="/images/hero-editorial.webp"
          alt="Sage, taupe and ivory silk drapery in soft window light"
          fill
          sizes="52vw"
          className="object-cover"
          priority
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-espresso/90 via-espresso/25 to-espresso/10"
          aria-hidden
        />
        <div className="absolute inset-x-0 top-0 p-10 xl:p-14">
          <BrandLogo href="/" tone="dark" markClassName="h-11 w-11" wordmarkClassName="text-2xl" />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-10 xl:p-14">
          <span className="mb-6 block h-px w-14 bg-gold/60" aria-hidden />
          <p className="eyebrow !text-ivory/70">The ANILLIÉA atelier</p>
          <p className="mt-3 max-w-md font-serif text-4xl italic leading-[1.1] text-ivory xl:text-5xl">
            Elegance in every detail.
          </p>
        </div>
      </aside>

      <main className="flex min-h-screen flex-col">
        <header className="flex justify-center py-7 lg:hidden">
          <BrandLogo markClassName="h-10 w-10" wordmarkClassName="text-xl" />
        </header>

        <div className="flex flex-1 items-center justify-center px-4 pb-16 pt-2 sm:px-6 lg:px-12">
          <div className="w-full max-w-md">
            <p className="eyebrow mb-6 hidden items-center gap-3 lg:flex">
              <span className="h-px w-8 bg-taupe/80" aria-hidden />
              Your account
            </p>
            <div className="rounded-[2rem] border border-espresso/10 bg-ivory-light p-8 shadow-soft sm:p-10">
              <h1 className="font-serif text-4xl leading-tight text-espresso">{title}</h1>
              {subtitle && (
                <p className="mt-2.5 font-sans text-sm leading-relaxed text-espresso-muted">
                  {subtitle}
                </p>
              )}
              <div className="mt-7">{children}</div>
            </div>
            <Link
              href="/shop"
              className="group mt-6 inline-flex items-center gap-2 font-sans text-[10px] font-semibold uppercase tracking-widest2 text-espresso-muted transition-colors hover:text-espresso"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-1" aria-hidden />
              Continue shopping
            </Link>
          </div>
        </div>

        <footer className="pb-7 text-center">
          <p className="font-sans text-xs text-espresso-muted">
            © {new Date().getFullYear()} ANILLIÉA. All rights reserved.
          </p>
        </footer>
      </main>
    </div>
  );
}
