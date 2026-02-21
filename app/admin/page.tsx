import { StatsCards } from "@/components/admin/stats-cards";
import { RecentTransactions } from "@/components/admin/recent-transactions";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { AIInsights } from "@/components/admin/ai-insights";
import { ActivityFeed } from "@/components/admin/activity-feed";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Aivora overview: performance, finance, and AI-powered insights.
          </p>
        </div>
      </div>

      <StatsCards />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <AIInsights />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentTransactions />
        </div>
        <ActivityFeed />
      </div>
    </div>
  );
}