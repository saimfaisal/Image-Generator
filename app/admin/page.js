import { redirect } from "next/navigation";
import { Activity, Image, MessageSquare, Users, Video } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";

export default async function AdminPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");
  const [users, images, videos, conversations] = await Promise.all([prisma.user.count(), prisma.generation.count(), prisma.videoGeneration.count(), prisma.conversation.count()]);
  const stats = [["Users", users, Users], ["Image generations", images, Image], ["Video jobs", videos, Video], ["Conversations", conversations, MessageSquare]];
  return <DashboardLayout title="Admin Panel"><div className="mx-auto max-w-6xl space-y-8"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-violet-400">Restricted workspace</p><h1 className="display-font mt-2 text-3xl font-semibold">System overview</h1><p className="mt-2 text-sm text-zinc-500">Live counts from the database. Administrative mutations are intentionally not enabled here.</p></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label, value, Icon]) => <Card key={label} className="p-5"><Icon size={18} className="text-violet-300" /><p className="mt-5 text-xs text-zinc-500">{label}</p><p className="display-font mt-1 text-3xl font-semibold">{value}</p></Card>)}</div><Card className="flex items-start gap-3 p-5"><Activity className="mt-0.5 text-amber-300" size={18} /><div><p className="text-sm font-semibold">Admin controls are limited</p><p className="mt-1 text-xs leading-5 text-zinc-500">User management, credit adjustments, and system settings require dedicated server-side admin APIs before they are enabled.</p></div></Card></div></DashboardLayout>;
}
