import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const activity = [
  { type: "ENROLL", text: "Batool enrolled in React Basics", time: "2 min ago" },
  { type: "PAYMENT", text: "Payment received ($25) - TRX-10021", time: "15 min ago" },
  { type: "CERT", text: "Sara completed HTML & CSS and got certificate", time: "1 hour ago" },
  { type: "QUIZ", text: "New quiz submitted in JavaScript course", time: "3 hours ago" },
];

export function ActivityFeed() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <p className="text-sm text-muted-foreground">Live platform events</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {activity.map((a, idx) => (
          <div key={idx} className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{a.type}</Badge>
                <span className="text-sm">{a.text}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">{a.time}</div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}