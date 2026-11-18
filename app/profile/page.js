import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { ProfileSettings } from "@/components/settings/ProfileSettings";

export default function ProfilePage() {
  return <DashboardLayout title="Profile"><div className="mx-auto max-w-4xl space-y-7"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-violet-400">Account</p><h1 className="display-font mt-2 text-3xl font-semibold">Your profile</h1><p className="mt-2 text-sm text-zinc-500">Manage your personal information and password.</p></div><Card className="p-6"><ProfileSettings /></Card></div></DashboardLayout>;
}
