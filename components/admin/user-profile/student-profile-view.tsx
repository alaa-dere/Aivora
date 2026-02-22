import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type StudentProfile = {
  role: "student";
  id: string;
  name: string;
  email: string;
  status: "active" | "blocked";
  walletBalance: number;
  courses: { title: string; progress: number; status: "active" | "completed" | "dropped" }[];
  certificates: { title: string; issuedAt: string; code: string }[];
  ai: { strengths: string[]; weaknesses: string[]; predictedScore: number };
};

export function StudentProfileView({ user }: { user: StudentProfile }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Student Profile</h1>
          <p className="text-muted-foreground">Courses, wallet, certificates and AI insights.</p>
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
            <CardTitle>Wallet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Balance</div>
            <div className="text-2xl font-bold">${user.walletBalance}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="courses">
        <TabsList>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
          <TabsTrigger value="ai">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle>Enrolled Courses</CardTitle>
              <p className="text-sm text-muted-foreground">Progress snapshot</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {user.courses.map((c, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{c.title}</div>
                    <div className="text-xs text-muted-foreground">Status: {c.status}</div>
                  </div>
                  <Badge variant="secondary">{c.progress}%</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificates">
          <Card>
            <CardHeader>
              <CardTitle>Certificates</CardTitle>
              <p className="text-sm text-muted-foreground">Issued achievements</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {user.certificates.length === 0 ? (
                <div className="text-sm text-muted-foreground">No certificates yet.</div>
              ) : (
                user.certificates.map((c, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{c.title}</div>
                      <div className="text-xs text-muted-foreground">
                        Issued: {c.issuedAt} • {c.code}
                      </div>
                    </div>
                    <Badge>PDF</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Strengths & Weaknesses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground">Strengths</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {user.ai.strengths.map((s) => (
                      <Badge key={s} variant="secondary">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground">Weaknesses</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {user.ai.weaknesses.map((w) => (
                      <Badge key={w} variant="destructive">
                        {w}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prediction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">Predicted final score</div>
                <div className="text-3xl font-bold">{user.ai.predictedScore}%</div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Based on quizzes + progress trend (mock).
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}