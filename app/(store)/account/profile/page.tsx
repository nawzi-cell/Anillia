"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export default function ProfilePage() {
  const { user, refresh } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    if (name.trim().length < 3) {
      setProfileMsg({ tone: "error", text: "Please enter your full name." });
      return;
    }
    if (phone && !/^(\+92|0)?3\d{9}$/.test(phone.replace(/[\s-]/g, ""))) {
      setProfileMsg({ tone: "error", text: "Enter a valid Pakistani mobile number, or leave it blank." });
      return;
    }
    setProfileBusy(true);
    try {
      await apiFetch("/api/auth/me", {
        method: "PUT",
        body: { name: name.trim(), phone: phone.trim() || undefined },
      });
      await refresh();
      setProfileMsg({ tone: "success", text: "Your profile has been updated." });
    } catch (err) {
      setProfileMsg({ tone: "error", text: err instanceof Error ? err.message : "Could not update your profile." });
    } finally {
      setProfileBusy(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPassword.length < 8) {
      setPwMsg({ tone: "error", text: "Your new password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ tone: "error", text: "The new passwords do not match." });
      return;
    }
    setPwBusy(true);
    try {
      await apiFetch("/api/auth/change-password", {
        method: "POST",
        body: { currentPassword, newPassword },
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwMsg({ tone: "success", text: "Your password has been changed." });
    } catch (err) {
      setPwMsg({ tone: "error", text: err instanceof Error ? err.message : "Could not change your password." });
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <div>
      <h1 className="font-serif text-4xl text-espresso">Profile</h1>
      <p className="mt-2 font-sans text-sm text-espresso-muted">
        Keep your details up to date.
      </p>

      <Card className="mt-6">
        <h2 className="mb-5 font-serif text-xl text-espresso">Personal details</h2>
        <form onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2">
          <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ayesha Khan" autoComplete="name" />
          <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03001234567" autoComplete="tel" inputMode="tel" />
          <div>
            <Input label="Email" value={user?.email ?? ""} disabled />
            <p className="mt-1 font-sans text-xs text-espresso-muted">Email cannot be changed.</p>
          </div>
          <div className="sm:col-span-2">
            {profileMsg && <Alert tone={profileMsg.tone}>{profileMsg.text}</Alert>}
            <Button type="submit" disabled={profileBusy} className="mt-2">
              {profileBusy ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="mt-6">
        <h2 className="mb-5 font-serif text-xl text-espresso">Change password</h2>
        <form onSubmit={changePassword} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input label="Current password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" required />
          </div>
          <Input label="New password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" required minLength={8} />
          <Input label="Confirm new password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" required minLength={8} />
          <div className="sm:col-span-2">
            {pwMsg && <Alert tone={pwMsg.tone}>{pwMsg.text}</Alert>}
            <Button type="submit" variant="secondary" disabled={pwBusy} className="mt-2">
              {pwBusy ? "Changing…" : "Change password"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
