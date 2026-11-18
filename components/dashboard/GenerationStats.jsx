import { CheckCircle2, Images, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";

export async function GenerationStats({ userId }) {
  const [total, completed, failed, recent] = await Promise.all([
    prisma.generation.count({ where: { userId } }),
    prisma.generation.count({ where: { userId, status: "COMPLETED" } }),
    prisma.generation.count({ where: { userId, status: "FAILED" } }),
    prisma.generation.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 3, select: { id: true, prompt: true, status: true, createdAt: true, outputUrl: true } }),
  ]);
  const stats = [{ label: "Total generations", value: total, icon: Images }, { label: "Completed", value: completed, icon: CheckCircle2 }, { label: "Failed", value: failed, icon: XCircle }];
  return <section className="space-y-4"><div className="grid gap-4 sm:grid-cols-3">{stats.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-2xl border border-zinc-800 bg-[#18181f] p-5"><div className="flex items-center justify-between"><p className="text-sm text-zinc-400">{label}</p><Icon size={18} className={label === "Failed" ? "text-red-300" : "text-violet-300"} /></div><p className="display-font mt-4 text-3xl font-semibold">{value}</p><p className="mt-2 text-xs text-zinc-500">Database-backed activity</p></div>)}</div>{recent.length > 0 && <div className="rounded-2xl border border-zinc-800 bg-[#18181f] p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">Recent generations</h2><a href="/history" className="text-xs font-semibold text-violet-300">View history</a></div><div className="mt-4 space-y-3">{recent.map((item) => <div key={item.id} className="flex items-center gap-3"><div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500">{item.outputUrl && <img src={item.outputUrl} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.prompt}</p><p className="text-xs text-zinc-500">{item.status} · {new Date(item.createdAt).toLocaleDateString()}</p></div></div>)}</div></div>}</section>;
}
