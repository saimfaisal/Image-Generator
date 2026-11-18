"use client";

import Link from "next/link";
import { useState } from "react";
import { LoaderCircle, Mail } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event) {
    event.preventDefault(); setLoading(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await response.json();
      if (!response.ok) setError(data.error || "Unable to process your request."); else setMessage(data.message);
    } catch { setError("Unable to process your request right now."); }
    setLoading(false);
  }
  return <AuthShell title="Reset your password" subtitle="Enter your email and we will send reset instructions if an account exists." footer={<>Remembered your password? <Link href="/login" className="text-violet-300">Back to sign in</Link></>}><form onSubmit={submit} className="mt-8 space-y-5"><label className="block text-xs font-semibold text-zinc-300">Email address<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-zinc-700 bg-[#101014] px-3 py-3 text-sm outline-none focus:border-violet-400" autoComplete="email" /></label>{message && <p role="status" className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs text-emerald-300"><Mail className="mr-2 inline" size={14} />{message}</p>}{error && <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-xs text-red-300">{error}</p>}<button disabled={loading} className="flex w-full items-center justify-center rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold hover:bg-violet-400 disabled:opacity-60">{loading && <LoaderCircle className="mr-2 animate-spin" size={16} />}Send reset instructions</button></form></AuthShell>;
}
