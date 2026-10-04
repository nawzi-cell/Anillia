"use client";

import { useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { ToastProvider } from "./Toast";
import { AdminNav } from "./AdminNav";
import { Topbar } from "./Topbar";
import { BrandLogo } from "@/components/shared/BrandLogo";

interface AdminUser {
  name?: string | null;
  email?: string | null;
  role?: string;
}

export function AdminShell({
  user,
  children,
}: {
  user: AdminUser;
  children: ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-ivory font-sans text-espresso">
        {/* Mobile drawer */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-espresso/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
        )}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 -translate-x-full border-r border-espresso/10 bg-ivory-light transition-transform duration-200 lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : ""
          }`}
          aria-label="Admin sidebar"
        >
          <div className="flex h-16 items-center justify-between border-b border-espresso/10 px-4">
            <BrandLogo
              href="/admin"
              markClassName="h-8 w-auto"
              wordmarkClassName="text-base"
            />
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close navigation menu"
              className="flex h-9 w-9 items-center justify-center rounded-md text-espresso-muted transition hover:bg-espresso/5 hover:text-espresso lg:hidden"
            >
              <X size={20} />
            </button>
          </div>
          <div className="h-[calc(100vh-4rem)] overflow-y-auto">
            <AdminNav onNavigate={() => setSidebarOpen(false)} />
          </div>
        </aside>

        <div className="lg:pl-64">
          <Topbar
            adminName={user.name || user.email || "Admin"}
            onMenuClick={() => setSidebarOpen(true)}
          />
          <main className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
