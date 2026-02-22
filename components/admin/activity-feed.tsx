import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const members = [
  { name: "Dale Komen", email: "dale@example.com" },
  { name: "Sofia Davis", email: "mj@example.com" },
  { name: "Jackson Lee", email: "jl@example.com" },
  { name: "Isabelle Nguyen", email: "isabelle@example.com" },
  { name: "Megan Rivera", email: "" },
];

export function ActivityFeed() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
        <p className="text-sm text-muted-foreground">
          Invite your team members to collaborate.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {members.map((m, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-primary/10 text-primary">
                {m.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{m.name}</div>
              {m.email && (
                <div className="text-xs text-muted-foreground">{m.email}</div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}