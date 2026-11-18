import Link from "next/link";

export function ToolCard({ icon: Icon, eyebrow, title, description, href, tone = "violet", status }) {
  const toneClass = { violet: "bg-violet-500/15 text-violet-300", indigo: "bg-indigo-500/15 text-indigo-300", cyan: "bg-cyan-500/15 text-cyan-300" }[tone] || "bg-violet-500/15 text-violet-300";
  return <Link href={href} className="group rounded-2xl border border-white/[.08] bg-[#18181f] p-5 transition hover:-translate-y-0.5 hover:border-violet-400/40 hover:bg-[#1c1b24]"><div className={`flex h-11 w-11 items-center justify-center rounded-xl ${toneClass}`}><Icon size={20} /></div><div className="mt-6 flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-zinc-600">{eyebrow}</p><h3 className="mt-2 text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p></div>{status && <span className="shrink-0 rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-[10px] text-amber-300">{status}</span>}</div><p className="mt-6 text-xs font-semibold text-violet-300">Open workspace →</p></Link>;
}
