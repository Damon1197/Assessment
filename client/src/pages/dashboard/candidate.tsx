import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { AssessmentAssignment } from "@shared/schema";

export default function CandidateDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();

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

  const { data: assignments, isLoading: assignmentsLoading } = useQuery<AssessmentAssignment[]>({
    queryKey: ["/api/assignments", user?.id],
    retry: false,
    enabled: !!user?.id,
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

  const pendingAssignments = assignments?.filter((a: any) => a.status === 'not_started').length || 0;
  const inProgressAssignments = assignments?.filter((a: any) => a.status === 'in_progress').length || 0;
  const completedAssignments = assignments?.filter((a: any) => a.status === 'submitted').length || 0;
  const averageScore = assignments?.filter((a: any) => a.score)
    .reduce((sum: number, a: any, _, arr: any[]) => sum + a.score / arr.length, 0) || 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Candidate Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your assessments and progress</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card data-testid="card-stats-pending">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-pending-assessments">
                    {assignmentsLoading ? "..." : pendingAssignments}
                  </p>
                </div>
                <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-clock text-chart-3 text-lg"></i>
                </div>
              </div>
              <p className="text-xs text-chart-3 mt-2">Awaiting start</p>
            </CardContent>
          </Card>

          <Card data-testid="card-stats-in-progress">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-in-progress-assessments">
                    {assignmentsLoading ? "..." : inProgressAssignments}
                  </p>
                </div>
                <div className="w-12 h-12 bg-chart-1/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-play-circle text-chart-1 text-lg"></i>
                </div>
              </div>
              <p className="text-xs text-chart-1 mt-2">Currently taking</p>
            </CardContent>
          </Card>

          <Card data-testid="card-stats-completed">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-completed-assessments">
                    {assignmentsLoading ? "..." : completedAssignments}
                  </p>
                </div>
                <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-check-circle text-chart-2 text-lg"></i>
                </div>
              </div>
              <p className="text-xs text-chart-2 mt-2">Finished</p>
            </CardContent>
          </Card>

          <Card data-testid="card-stats-average">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-average-score">
                    {assignmentsLoading ? "..." : averageScore ? `${Math.round(averageScore)}%` : "N/A"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-chart-4/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-chart-bar text-chart-4 text-lg"></i>
                </div>
              </div>
              <p className="text-xs text-chart-4 mt-2">Overall performance</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Assessments */}
        <Card data-testid="card-active-assessments">
          <CardHeader>
            <CardTitle>Your Assessments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assignmentsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg animate-pulse">
                      <div className="w-12 h-12 bg-muted rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : assignments && assignments.length > 0 ? (
                assignments.map((assignment: any, index: number) => (
                  <div key={assignment.id} className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg" data-testid={`assignment-${index}`}>
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      assignment.status === 'not_started' 
                        ? 'bg-chart-3/10'
                        : assignment.status === 'in_progress'
                        ? 'bg-chart-1/10'
                        : 'bg-chart-2/10'
                    }`}>
                      <i className={`${
                        assignment.status === 'not_started'
                          ? 'fas fa-clock text-chart-3'
                          : assignment.status === 'in_progress'
                          ? 'fas fa-play text-chart-1'
                          : 'fas fa-check text-chart-2'
                      }`}></i>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{assignment.assessment?.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {assignment.assessment?.description || 'No description available'}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant={
                              assignment.status === 'not_started' ? 'secondary' :
                              assignment.status === 'in_progress' ? 'default' : 'outline'
                            }>
                              {assignment.status.replace('_', ' ')}
                            </Badge>
                            {assignment.assessment?.duration && (
                              <Badge variant="outline">
                                <i className="fas fa-clock mr-1"></i>
                                {assignment.assessment.duration}min
                              </Badge>
                            )}
                            {assignment.assessment?.isProctored && (
                              <Badge variant="outline">
                                <i className="fas fa-eye mr-1"></i>
                                Proctored
                              </Badge>
                            )}
                          </div>
                          {assignment.score && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                <span>Score: {assignment.score}%</span>
                              </div>
                              <Progress value={assignment.score} className="h-2" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          {assignment.status === 'not_started' && (
                            <Button 
                              size="sm"
                              onClick={() => setLocation(`/assessment/${assignment.assessmentId}`)}
                              data-testid={`button-start-assessment-${index}`}
                            >
                              <i className="fas fa-play mr-2"></i>
                              Start
                            </Button>
                          )}
                          {assignment.status === 'in_progress' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setLocation(`/assessment/${assignment.assessmentId}`)}
                              data-testid={`button-continue-assessment-${index}`}
                            >
                              <i className="fas fa-arrow-right mr-2"></i>
                              Continue
                            </Button>
                          )}
                          {assignment.status === 'submitted' && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              data-testid={`button-view-results-${index}`}
                            >
                              <i className="fas fa-eye mr-2"></i>
                              View Results
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {assignment.status === 'not_started' && 'Ready to start'}
                        {assignment.status === 'in_progress' && assignment.startedAt && 
                          `Started ${new Date(assignment.startedAt).toLocaleDateString()}`}
                        {assignment.status === 'submitted' && assignment.submittedAt && 
                          `Completed ${new Date(assignment.submittedAt).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <i className="fas fa-clipboard-list text-4xl text-muted-foreground mb-4"></i>
                  <p className="text-muted-foreground mb-2">No assessments assigned yet</p>
                  <p className="text-xs text-muted-foreground">Check back later for new assignments</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Summary */}
        {completedAssignments > 0 && (
          <Card data-testid="card-performance-summary">
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{completedAssignments}</p>
                  <p className="text-sm text-muted-foreground">Assessments Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{Math.round(averageScore)}%</p>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {assignments?.filter((a: any) => a.score >= 70).length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Passed Assessments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
