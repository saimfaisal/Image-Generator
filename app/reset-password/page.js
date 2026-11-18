"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  useEffect(() => setToken(new URLSearchParams(window.location.search).get("token") || ""), []);
  async function submit(event) {
    event.preventDefault(); setLoading(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, ...form }) });
      const data = await response.json();
      if (!response.ok) setError(data.error || "Unable to reset password."); else setMessage(data.message);
    } catch { setError("Unable to reset password right now."); }
    setLoading(false);
  }
  return <AuthShell title="Set a new password" subtitle="Choose a new secure password for your PixelForge account." footer={<>Back to <Link href="/login" className="text-violet-300">sign in</Link></>}><form onSubmit={submit} className="mt-8 space-y-5"><label className="block text-xs font-semibold text-zinc-300">New password<input required minLength={8} type="password" value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} className="mt-2 w-full rounded-xl border border-zinc-700 bg-[#101014] px-3 py-3 text-sm outline-none focus:border-violet-400" autoComplete="new-password" /></label><label className="block text-xs font-semibold text-zinc-300">Confirm new password<input required minLength={8} type="password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} className="mt-2 w-full rounded-xl border border-zinc-700 bg-[#101014] px-3 py-3 text-sm outline-none focus:border-violet-400" autoComplete="new-password" /></label>{message && <p role="status" className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs text-emerald-300">{message} <Link href="/login" className="underline">Sign in</Link></p>}{error && <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-xs text-red-300">{error}</p>}<button disabled={loading || !token} className="flex w-full items-center justify-center rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold hover:bg-violet-400 disabled:opacity-60">{loading && <LoaderCircle className="mr-2 animate-spin" size={16} />}Reset password</button>{!token && <p className="text-center text-xs text-red-300">This reset link is missing or invalid.</p>}</form></AuthShell>;
}
