import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { WelcomeSection } from "@/components/dashboard/WelcomeSection";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentProjects } from "@/components/dashboard/RecentProjects";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
export default function DashboardPage() { return <DashboardLayout><div className="space-y-8"><WelcomeSection /><StatsCards /><QuickActions /><RecentProjects /><ActivityFeed /></div></DashboardLayout>; }
