import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type TeacherProfile = {
  role: "teacher";
  id: string;
  name: string;
  email: string;
  status: "active" | "blocked";
  coursesCreated: { title: string; students: number; completion: number; avgScore: number }[];
  earnings: { month: number; total: number };
  ai: { recommendations: string[] };
};

export function TeacherProfileView({ user }: { user: TeacherProfile }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Teacher Profile</h1>
          <p className="text-muted-foreground">Courses, earnings, performance and AI recommendations.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{user.id}</Badge>
          <Badge>{user.status}</Badge>
        </div>
      </div>

      {/* Overview */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-muted-foreground">Name</div>
            <div className="font-semibold">{user.name}</div>

            <div className="text-sm text-muted-foreground mt-3">Email</div>
            <div className="font-semibold">{user.email}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Earnings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">This month</div>
              <div className="text-2xl font-bold">${user.earnings.month}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total</div>
              <div className="text-xl font-semibold">${user.earnings.total}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="courses">
        <TabsList>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="ai">AI Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle>Courses Created</CardTitle>
              <p className="text-sm text-muted-foreground">Students, completion rate, and average score</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {user.coursesCreated.map((c, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{c.title}</div>
                    <div className="text-xs text-muted-foreground">
                      Students: {c.students} • Completion: {c.completion}% • Avg score: {c.avgScore}%
                    </div>
                  </div>
                  <Badge variant="secondary">{c.completion}%</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <p className="text-sm text-muted-foreground">Based on student performance (mock)</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {user.ai.recommendations.map((r, idx) => (
                <div key={idx} className="text-sm">
                  • {r}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}