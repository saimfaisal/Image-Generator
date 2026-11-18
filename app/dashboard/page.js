import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StudioOverview } from "@/components/dashboard/StudioOverview";
import { getAuthenticatedUser } from "@/lib/auth/server";
import { redirect } from "next/navigation";
export default async function DashboardPage() { const user = await getAuthenticatedUser(); if (!user) redirect("/login"); return <DashboardLayout><StudioOverview userId={user.id} /></DashboardLayout>; }
