import { redirect } from "next/navigation";

export default function ResetPasswordRedirect({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;
  if (token) {
    redirect(`/forgot-password?token=${encodeURIComponent(token)}`);
  }
  redirect("/forgot-password");
}
