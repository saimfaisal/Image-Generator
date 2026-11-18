"use client";

import { useEffect } from "react";

export default function ApplicationError({ reset }) {
  useEffect(() => { console.error("PixelForge application route error"); }, []);
  return <main className="flex min-h-screen items-center justify-center bg-[#f5f5f5] p-6 text-zinc-900"><section className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-xl"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-xl text-violet-600">!</div><h1 className="mt-5 text-xl font-semibold">This workspace could not load</h1><p className="mt-2 text-sm leading-6 text-zinc-500">The deployment is missing a server configuration or the database is temporarily unavailable. Refresh once, then check the Vercel deployment logs if it continues.</p><div className="mt-6 flex justify-center gap-3"><button onClick={() => reset()} className="rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-400">Try again</button><a href="/dashboard" className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">Dashboard</a></div></section></main>;
}
