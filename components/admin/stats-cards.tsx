import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const stats = [
  { title: "Total Students", value: "1,240", change: "+6.2%" },
  { title: "Total Teachers", value: "38", change: "+1.4%" },
  { title: "Active Courses", value: "112", change: "+3.1%" },
  { title: "Monthly Revenue", value: "$12,450", change: "+9.8%" },
];

export function StatsCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <Card key={s.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              {s.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{s.value}</div>
            <Badge className="mt-2" variant="secondary">
              {s.change}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}