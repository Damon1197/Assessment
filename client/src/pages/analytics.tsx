import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Analytics() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/analytics/stats"],
    retry: false,
  });

  const { data: aiLogs, isLoading: aiLogsLoading } = useQuery({
    queryKey: ["/api/analytics/ai-logs"],
    retry: false,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const canViewAnalytics = user?.role === 'super_admin';

  if (!canViewAnalytics) {
    return (
      <MainLayout>
        <div className="min-h-[50vh] flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <i className="fas fa-lock text-4xl text-muted-foreground mb-4"></i>
              <h2 className="text-lg font-semibold mb-2">Access Restricted</h2>
              <p className="text-muted-foreground">
                You don't have permission to view analytics.
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics & Reports</h1>
          <p className="text-sm text-muted-foreground">Platform performance and usage insights</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card data-testid="card-stats-assessments">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Assessments</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-total-assessments">
                    {analyticsLoading ? "..." : analytics?.assessments?.totalAssessments || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-chart-1/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-clipboard-list text-chart-1 text-lg"></i>
                </div>
              </div>
              <p className="text-xs text-chart-1 mt-2">
                {analyticsLoading ? "..." : analytics?.assessments?.activeAssessments || 0} active
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-stats-questions">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Questions</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-total-questions">
                    {analyticsLoading ? "..." : analytics?.questions?.totalQuestions || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-question-circle text-chart-2 text-lg"></i>
                </div>
              </div>
              <p className="text-xs text-chart-2 mt-2">
                {analyticsLoading ? "..." : analytics?.questions?.approvedQuestions || 0} approved
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-stats-users">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Platform Users</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-platform-users">
                    {analyticsLoading ? "..." : analytics?.users?.totalUsers || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-users text-chart-3 text-lg"></i>
                </div>
              </div>
              <p className="text-xs text-chart-3 mt-2">
                {analyticsLoading ? "..." : analytics?.users?.candidates || 0} candidates
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-stats-ai-generated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">AI Generated</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-ai-questions">
                    {analyticsLoading ? "..." : analytics?.questions?.aiGeneratedQuestions || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-chart-4/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-robot text-chart-4 text-lg"></i>
                </div>
              </div>
              <p className="text-xs text-chart-4 mt-2">Questions by AI</p>
            </CardContent>
          </Card>
        </div>

        {/* Assessment Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="card-assessment-breakdown">
            <CardHeader>
              <CardTitle>Assessment Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-chart-1 rounded-full"></div>
                    <span className="text-sm text-foreground">Active</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {analyticsLoading ? "..." : analytics?.assessments?.activeAssessments || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-chart-2 rounded-full"></div>
                    <span className="text-sm text-foreground">Completed</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {analyticsLoading ? "..." : analytics?.assessments?.completedAssessments || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-chart-3 rounded-full"></div>
                    <span className="text-sm text-foreground">Draft</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {analyticsLoading ? "..." : 
                      ((analytics?.assessments?.totalAssessments || 0) - 
                       (analytics?.assessments?.activeAssessments || 0) - 
                       (analytics?.assessments?.completedAssessments || 0))
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-question-breakdown">
            <CardHeader>
              <CardTitle>Question Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-chart-2 rounded-full"></div>
                    <span className="text-sm text-foreground">Approved</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {analyticsLoading ? "..." : analytics?.questions?.approvedQuestions || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-chart-3 rounded-full"></div>
                    <span className="text-sm text-foreground">Pending Review</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {analyticsLoading ? "..." : analytics?.questions?.pendingQuestions || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-chart-4 rounded-full"></div>
                    <span className="text-sm text-foreground">AI Generated</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {analyticsLoading ? "..." : analytics?.questions?.aiGeneratedQuestions || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Analytics */}
        <Card data-testid="card-user-analytics">
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-2xl font-bold text-foreground">
                  {analyticsLoading ? "..." : analytics?.users?.candidates || 0}
                </p>
                <p className="text-sm text-muted-foreground">Candidates</p>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-2xl font-bold text-foreground">
                  {analyticsLoading ? "..." : analytics?.users?.smes || 0}
                </p>
                <p className="text-sm text-muted-foreground">SMEs</p>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-2xl font-bold text-foreground">
                  {analyticsLoading ? "..." : analytics?.users?.managers || 0}
                </p>
                <p className="text-sm text-muted-foreground">Managers</p>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-2xl font-bold text-foreground">1</p>
                <p className="text-sm text-muted-foreground">Super Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Generation Activity */}
        <Card data-testid="card-ai-activity">
          <CardHeader>
            <CardTitle>AI Generation Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {aiLogsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4 p-3 bg-muted/30 rounded-lg animate-pulse">
                      <div className="w-8 h-8 bg-muted rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : aiLogs && aiLogs.length > 0 ? (
                aiLogs.slice(0, 5).map((log: any, index: number) => (
                  <div key={log.id} className="flex items-center space-x-4 p-3 bg-muted/30 rounded-lg" data-testid={`ai-log-${index}`}>
                    <div className="w-8 h-8 bg-chart-4/10 rounded flex items-center justify-center">
                      <i className="fas fa-robot text-chart-4 text-sm"></i>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        Generated {log.generatedQuestions?.length || 0} questions
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {log.prompt} • {new Date(log.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      log.status === 'completed'
                        ? 'bg-chart-2/10 text-chart-2'
                        : log.status === 'processing'
                        ? 'bg-chart-3/10 text-chart-3'
                        : 'bg-destructive/10 text-destructive'
                    }`}>
                      {log.status}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <i className="fas fa-robot text-4xl text-muted-foreground mb-4"></i>
                  <p className="text-muted-foreground">No AI generation activity yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card data-testid="card-system-health">
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <i className="fas fa-heartbeat text-chart-2 text-lg"></i>
                </div>
                <p className="text-2xl font-bold text-foreground">99.7%</p>
                <p className="text-sm text-muted-foreground">Uptime</p>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="w-12 h-12 bg-chart-1/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <i className="fas fa-tachometer-alt text-chart-1 text-lg"></i>
                </div>
                <p className="text-2xl font-bold text-foreground">145ms</p>
                <p className="text-sm text-muted-foreground">Avg Response</p>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <i className="fas fa-database text-chart-3 text-lg"></i>
                </div>
                <p className="text-2xl font-bold text-foreground">2.1GB</p>
                <p className="text-sm text-muted-foreground">Database Size</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
