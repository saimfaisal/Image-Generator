"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";

function Field({ label, ...props }) {
  return <label className="block text-xs font-semibold text-zinc-300">{label}<input {...props} className="mt-2 w-full rounded-xl border border-zinc-700 bg-[#101014] px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-violet-400" /></label>;
}

export function ProfileSettings() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/user/me").then((response) => response.json().then((data) => ({ response, data }))).then(({ response, data }) => {
      if (!response.ok) throw new Error(data.error || "Unable to load profile.");
      setUser(data.user); setName(data.user.name);
    }).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false));
  }, []);

  async function updateProfile(event) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    const response = await fetch("/api/user/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    const data = await response.json();
    if (!response.ok) setError(data.error || "Unable to update profile."); else { setUser(data.user); setMessage("Profile updated successfully."); }
    setSaving(false);
  }

  async function changePassword(event) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    const response = await fetch("/api/user/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(passwords) });
    const data = await response.json();
    if (!response.ok) setError(data.error || "Unable to change password."); else { setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" }); setMessage("Password changed successfully."); }
    setSaving(false);
  }

  if (loading) return <div className="flex items-center gap-2 py-10 text-sm text-zinc-500"><LoaderCircle className="animate-spin" size={16} />Loading profile…</div>;
  if (!user) return <p className="py-10 text-sm text-red-400">Unable to load your profile.</p>;

  return <div className="space-y-8">
    <form onSubmit={updateProfile} className="space-y-5">
      <div><h3 className="font-semibold">Profile information</h3><p className="mt-1 text-xs text-zinc-500">Update the account information shown in your workspace.</p></div>
      <div className="grid gap-5 sm:grid-cols-2"><Field label="Display name" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={80} required /><Field label="Email" value={user.email} readOnly disabled /></div>
      <p className="text-xs text-zinc-500">Role: <span className="font-semibold text-zinc-300">{user.role}</span></p>
      <button disabled={saving} className="rounded-xl bg-violet-500 px-5 py-2.5 text-sm font-semibold hover:bg-violet-400 disabled:opacity-60">{saving ? "Saving…" : "Save profile"}</button>
    </form>
    <form onSubmit={changePassword} className="space-y-5 border-t border-zinc-800 pt-8">
      <div><h3 className="font-semibold">Change password</h3><p className="mt-1 text-xs text-zinc-500">Verify your current password before setting a new one.</p></div>
      <div className="grid gap-5 sm:grid-cols-3"><Field label="Current password" type="password" value={passwords.currentPassword} onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })} required /><Field label="New password" type="password" value={passwords.newPassword} onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })} minLength={8} required /><Field label="Confirm new password" type="password" value={passwords.confirmPassword} onChange={(event) => setPasswords({ ...passwords, confirmPassword: event.target.value })} minLength={8} required /></div>
      <button disabled={saving} className="rounded-xl border border-violet-400/40 px-5 py-2.5 text-sm font-semibold text-violet-300 hover:bg-violet-500/10 disabled:opacity-60">{saving ? "Saving…" : "Change password"}</button>
    </form>
    {(message || error) && <p role="alert" className={`rounded-lg p-3 text-xs ${error ? "border border-red-400/20 bg-red-400/10 text-red-300" : "border border-emerald-400/20 bg-emerald-400/10 text-emerald-300"}`}>{error || message}</p>}
  </div>;
}
