import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const stats = [
  { title: "Total Students", value: "1,240", change: "+6.2%", hint: "vs last month" },
  { title: "Total Teachers", value: "38", change: "+1.4%", hint: "vs last month" },
  { title: "Active Courses", value: "112", change: "+3.1%", hint: "vs last month" },
  { title: "Monthly Revenue", value: "$12,450", change: "+9.8%", hint: "vs last month" },
];

const recentTransactions = [
  { id: "TRX-10021", student: "Ahmad Ali", course: "React Basics", amount: "$25", status: "Success" },
  { id: "TRX-10020", student: "Sara Omar", course: "HTML & CSS", amount: "$15", status: "Success" },
  { id: "TRX-10019", student: "Mohammad Y.", course: "Backend Basics", amount: "$30", status: "Pending" },
  { id: "TRX-10018", student: "Lina K.", course: "JavaScript", amount: "$20", status: "Failed" },
];

const recentEnrollments = [
  { student: "Ahmad Ali", course: "React Basics", date: "Today" },
  { student: "Sara Omar", course: "HTML & CSS", date: "Yesterday" },
  { student: "Mohammad Y.", course: "Backend Basics", date: "2 days ago" },
  { student: "Lina K.", course: "JavaScript", date: "3 days ago" },
];

// Chart placeholder (بدون مكتبات) — بنضيف chart لاحقاً
function RevenueMiniChart() {
  const bars = [30, 50, 35, 70, 55, 90, 65, 80, 60, 95, 75, 100];
  return (
    <div className="flex items-end gap-1 h-20">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-2 rounded-sm bg-foreground/70"
          style={{ height: `${h}%` }}
          title={`Week ${i + 1}`}
        />
      ))}
    </div>
  );
}

export default function AdminPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Platform overview, finance, enrollments, and performance snapshots.
          </p>
        </div>

        <div className="text-sm text-muted-foreground">
          <div className="font-medium text-foreground">Today</div>
          <div>{new Date().toLocaleDateString()}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.title} className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{s.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="mt-2 flex items-center gap-2 text-sm">
                <Badge variant="secondary">{s.change}</Badge>
                <span className="text-muted-foreground">{s.hint}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Middle row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Revenue card */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Revenue (Last 12 Weeks)</CardTitle>
              <p className="text-sm text-muted-foreground">Simple trend preview (placeholder)</p>
            </div>
            <Badge variant="outline">Forecast ready</Badge>
          </CardHeader>
          <CardContent>
            <RevenueMiniChart />
            <Separator className="my-4" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Gross</div>
                <div className="font-semibold">$18,900</div>
              </div>
              <div>
                <div className="text-muted-foreground">Net Profit</div>
                <div className="font-semibold">$12,450</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Enrollments */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Recent Enrollments</CardTitle>
            <p className="text-sm text-muted-foreground">Latest students joined courses</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentEnrollments.map((e, idx) => (
              <div key={idx} className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{e.student}</div>
                  <div className="text-sm text-muted-foreground">{e.course}</div>
                </div>
                <Badge variant="secondary">{e.date}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Transactions table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <p className="text-sm text-muted-foreground">Payments and wallet operations</p>
        </CardHeader>

        <CardContent className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b">
                <th className="text-left py-2 pr-4">Transaction</th>
                <th className="text-left py-2 pr-4">Student</th>
                <th className="text-left py-2 pr-4">Course</th>
                <th className="text-left py-2 pr-4">Amount</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-medium">{t.id}</td>
                  <td className="py-3 pr-4">{t.student}</td>
                  <td className="py-3 pr-4">{t.course}</td>
                  <td className="py-3 pr-4">{t.amount}</td>
                  <td className="py-3">
                    <Badge
                      variant={
                        t.status === "Success" ? "default" : t.status === "Pending" ? "secondary" : "destructive"
                      }
                    >
                      {t.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}