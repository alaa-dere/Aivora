import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const payments = [
  { id: "#1001", customer: "Ahmad K.", amount: "$25", status: "Success" },
  { id: "#1002", customer: "Sara M.", amount: "$30", status: "Failed" },
  { id: "#1003", customer: "Lina T.", amount: "$18", status: "Success" },
  { id: "#1004", customer: "Omar R.", amount: "$42", status: "Pending" },
];

export function RecentTransactions() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Payments</CardTitle>
        <p className="text-sm text-muted-foreground">Manage your payments.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">Status</Button>
          <Button variant="outline" size="sm">Amount</Button>
          <Badge variant="default" className="cursor-pointer">Success</Badge>
          <Badge variant="destructive" className="cursor-pointer">Failed</Badge>
        </div>

        {/* Payments list */}
        <div className="space-y-3">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between border-b pb-2 last:border-0">
              <div>
                <div className="font-medium">{p.customer}</div>
                <div className="text-xs text-muted-foreground">{p.id}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">{p.amount}</span>
                <Badge
                  variant={
                    p.status === "Success"
                      ? "default"
                      : p.status === "Failed"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {p.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}