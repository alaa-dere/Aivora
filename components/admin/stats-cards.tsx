import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const stats = [
  {
    title: "Avg Order Revenue",
    value: "$4,682",
    change: "Sales Last Week",
    changeValue: "",
  },
  {
    title: "New Orders",
    value: "1,226",
    change: "Sales Last Week",
    changeValue: "",
  },
  {
    title: "Total Revenue",
    value: "$15,231.89",
    change: "+20.5% from last month",
    changeValue: "positive",
  },
  {
    title: "Details",
    value: "10.8%",
    change: "",
    changeValue: "",
  },
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
            {s.change && (
              <div className="mt-2 text-sm text-muted-foreground">
                {s.change}
              </div>
            )}
            {s.changeValue === "positive" && (
              <Badge className="mt-2 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                {s.change}
              </Badge>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}