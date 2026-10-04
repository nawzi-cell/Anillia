import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Verify the session directly from the request cookie — no HTTP
  // self-fetch. The previous implementation called /api/auth/me over HTTP
  // using NEXT_PUBLIC_APP_URL, which silently failed (and bounced the user
  // back to /login) whenever that URL didn't point at this exact server
  // instance, e.g. a dev-tunnel URL or a different local port.
  const user = await getCurrentUser();
  // TEMP-DIAG (2026-10-03): trace sign-in bounce. Remove after diagnosis.
  console.log(
    `[auth-diag] admin guard: ${user ? `session ok (${user.email}, ${user.role})` : "NO usable session"}`
  );
  if (!user || user.role !== "ADMIN") {
    redirect("/login?next=/admin");
  }
  return <AdminShell user={user}>{children}</AdminShell>;
}
