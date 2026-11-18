"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Activity, Bot, Clapperboard, CreditCard, Grid2X2, History, ImagePlus, LayoutDashboard, Settings, Sparkles, X, Zap } from "lucide-react";

const workspace = [["Dashboard", "/dashboard", LayoutDashboard], ["AI Chat", "/chat", Bot], ["Image Generator", "/generate", ImagePlus], ["Video Generator", "/video", Clapperboard], ["My Creations", "/creations", Grid2X2]];
const account = [["Credits & Plans", "/plans", CreditCard], ["Generation History", "/history", History], ["Settings", "/settings", Settings]];

function NavGroup({ title, items, pathname, onClose }) {
  return <div className="mt-8 first:mt-10"><p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-zinc-600">{title}</p><div className="space-y-1">{items.map(([label, href, Icon]) => { const active = pathname === href || pathname.startsWith(`${href}/`); return <Link key={href} href={href} onClick={onClose} className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${active ? "bg-violet-500/15 font-semibold text-violet-300 shadow-[inset_2px_0_0_#a78bfa]" : "text-zinc-400 hover:bg-white/[.04] hover:text-zinc-100"}`}><Icon size={18} strokeWidth={active ? 2.2 : 1.8} />{label}</Link>; })}</div></div>;
}

export function Sidebar({ open, onClose }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  return <aside className={`${open ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/[.07] bg-[#101014] p-5 transition-transform lg:static lg:translate-x-0`}>
    <div className="flex items-center justify-between"><Link href="/dashboard" className="display-font flex items-center gap-3 font-bold tracking-tight"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500 text-white shadow-lg shadow-violet-500/20"><Sparkles size={17} /></span>PixelForge <span className="text-violet-400">AI</span></Link><button onClick={onClose} className="text-zinc-500 lg:hidden" aria-label="Close navigation"><X size={20} /></button></div>
    <nav className="flex-1" aria-label="Primary navigation"><NavGroup title="Workspace" items={workspace} pathname={pathname} onClose={onClose} /><NavGroup title="Account" items={account} pathname={pathname} onClose={onClose} />{isAdmin && <NavGroup title="Admin" items={[["Admin Panel", "/admin", Activity]]} pathname={pathname} onClose={onClose} />}</nav>
    <div className="rounded-2xl border border-violet-400/20 bg-violet-500/[.08] p-4"><div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/20 text-violet-300"><Zap size={16} /></div><p className="text-sm font-semibold">Creative workspace</p><p className="mt-1 text-xs leading-5 text-zinc-500">Connect Google Cloud to unlock live AI generation.</p><Link href="/plans" className="mt-4 block w-full rounded-lg border border-violet-400/20 py-2 text-center text-xs font-semibold text-violet-300 transition hover:bg-violet-500/10">View plans</Link></div>
  </aside>;
}
