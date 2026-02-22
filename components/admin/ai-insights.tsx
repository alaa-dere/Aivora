import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, AlertTriangle } from "lucide-react";

const insights = [
  {
    icon: TrendingUp,
    title: "Forecast",
    badge: "Next month",
    text: "React Basics المتوقع يحقق +18% أرباح مقارنة بالشهر الحالي.",
  },
  {
    icon: AlertTriangle,
    title: "Risk",
    badge: "At-risk",
    text: "12 طالب في مسار Web Dev عندهم احتمال رسوب مرتفع حسب أداء الكويزات.",
  },
  {
    icon: Brain,
    title: "Recommendation",
    badge: "Action",
    text: "وحدة JavaScript Async هي الأكثر صعوبة: 68% أخطاء في أسئلة محددة.",
  },
];

export function AIInsights() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>AI Insights</CardTitle>
        <p className="text-sm text-muted-foreground">Smart analytics & suggestions</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((i, idx) => {
          const Icon = i.icon;
          return (
            <div key={idx} className="flex gap-3">
              <div className="mt-0.5">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">{i.title}</div>
                  <Badge variant="secondary">{i.badge}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">{i.text}</div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}