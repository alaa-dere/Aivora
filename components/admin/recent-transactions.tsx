import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const transactions = [
  { id: "TRX-1001", student: "Ahmad", amount: "$25", status: "Success" },
  { id: "TRX-1002", student: "Sara", amount: "$30", status: "Pending" },
  { id: "TRX-1003", student: "Lina", amount: "$18", status: "Failed" },
];

export function RecentTransactions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((t) => (
            <div key={t.id} className="flex justify-between items-center">
              <div>
                <div className="font-medium">{t.student}</div>
                <div className="text-xs text-muted-foreground">{t.id}</div>
              </div>
              <div className="flex items-center gap-3">
                <span>{t.amount}</span>
                <Badge
                  variant={
                    t.status === "Success"
                      ? "default"
                      : t.status === "Pending"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {t.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}