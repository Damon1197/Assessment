import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import AssessmentForm from "@/components/assessment/assessment-form";
import type { Assessment, User } from "@shared/schema";

export default function ManagerDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

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

  const { data: myAssessments, isLoading: assessmentsLoading } = useQuery<Assessment[]>({
    queryKey: ["/api/assessments"],
    retry: false,
  });

  const { data: candidates, isLoading: candidatesLoading } = useQuery<User[]>({
    queryKey: ["/api/users", { role: "candidate" }],
    retry: false,
  });

  const createAssessmentMutation = useMutation({
    mutationFn: async (assessmentData: any) => {
      await apiRequest("POST", "/api/assessments", assessmentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Assessment created successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to create assessment",
        variant: "destructive",
      });
    },
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

  const activeAssessments = myAssessments?.filter((a: any) => a.status === 'active').length || 0;
  const completedAssessments = myAssessments?.filter((a: any) => a.status === 'completed').length || 0;
  const totalCandidates = candidates?.length || 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Manager Dashboard</h1>
            <p className="text-sm text-muted-foreground">Assessment creation and candidate management</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-assessment">
                <i className="fas fa-plus mr-2"></i>Create Assessment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Assessment</DialogTitle>
              </DialogHeader>
              <AssessmentForm
                onSubmit={(data) => createAssessmentMutation.mutate(data)}
                isLoading={createAssessmentMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card data-testid="card-stats-my-assessments">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">My Assessments</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-my-assessments">
                    {assessmentsLoading ? "..." : myAssessments?.length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-chart-1/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-clipboard-list text-chart-1 text-lg"></i>
                </div>
              </div>
              <p className="text-xs text-chart-2 mt-2">Total created</p>
            </CardContent>
          </Card>

          <Card data-testid="card-stats-active">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-active-assessments">
                    {assessmentsLoading ? "..." : activeAssessments}
                  </p>
                </div>
                <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-play-circle text-chart-2 text-lg"></i>
                </div>
              </div>
              <p className="text-xs text-chart-2 mt-2">Currently running</p>
            </CardContent>
          </Card>

          <Card data-testid="card-stats-completed">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-completed-assessments">
                    {assessmentsLoading ? "..." : completedAssessments}
                  </p>
                </div>
                <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-check-circle text-chart-3 text-lg"></i>
                </div>
              </div>
              <p className="text-xs text-chart-3 mt-2">Finished assessments</p>
            </CardContent>
          </Card>

          <Card data-testid="card-stats-candidates">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Candidates</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-total-candidates">
                    {candidatesLoading ? "..." : totalCandidates}
                  </p>
                </div>
                <div className="w-12 h-12 bg-chart-4/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-users text-chart-4 text-lg"></i>
                </div>
              </div>
              <p className="text-xs text-chart-4 mt-2">Available for assessment</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Recent Assessments */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card data-testid="card-quick-actions">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" onClick={() => setIsCreateDialogOpen(true)} data-testid="button-quick-create">
                <i className="fas fa-plus mr-3"></i>
                Create New Assessment
              </Button>
              <Button variant="outline" className="w-full justify-start" data-testid="button-assign-candidates">
                <i className="fas fa-user-check mr-3"></i>
                Assign Candidates
              </Button>
              <Button variant="outline" className="w-full justify-start" data-testid="button-view-results">
                <i className="fas fa-chart-bar mr-3"></i>
                View Results
              </Button>
              <Button variant="outline" className="w-full justify-start" data-testid="button-export-reports">
                <i className="fas fa-download mr-3"></i>
                Export Reports
              </Button>
            </CardContent>
          </Card>

          {/* Recent Assessments */}
          <div className="lg:col-span-2">
            <Card data-testid="card-recent-assessments">
              <CardHeader>
                <CardTitle>Recent Assessments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assessmentsLoading ? (
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
                  ) : myAssessments && myAssessments.length > 0 ? (
                    myAssessments.slice(0, 5).map((assessment: any, index: number) => (
                      <div key={assessment.id} className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg" data-testid={`assessment-${index}`}>
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <i className="fas fa-clipboard-list text-primary"></i>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium text-foreground">{assessment.title}</p>
                              <p className="text-xs text-muted-foreground">
                                Created {new Date(assessment.createdAt).toLocaleDateString()}
                              </p>
                              <div className="flex items-center space-x-2 mt-2">
                                <Badge variant={assessment.status === 'active' ? 'default' : 'secondary'}>
                                  {assessment.status}
                                </Badge>
                                {assessment.isProctored && (
                                  <Badge variant="outline">
                                    <i className="fas fa-eye mr-1"></i>Proctored
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button size="sm" variant="ghost" data-testid={`button-view-assessment-${index}`}>
                                <i className="fas fa-eye"></i>
                              </Button>
                              <Button size="sm" variant="ghost" data-testid={`button-edit-assessment-${index}`}>
                                <i className="fas fa-edit"></i>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <i className="fas fa-clipboard-list text-4xl text-muted-foreground mb-4"></i>
                      <p className="text-muted-foreground mb-2">No assessments created yet</p>
                      <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-assessment">
                        <i className="fas fa-plus mr-2"></i>
                        Create Your First Assessment
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Candidate Performance Overview */}
        <Card data-testid="card-candidate-performance">
          <CardHeader>
            <CardTitle>Candidate Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <i className="fas fa-chart-line text-4xl text-muted-foreground mb-4"></i>
              <p className="text-muted-foreground mb-2">Performance analytics will appear here</p>
              <p className="text-xs text-muted-foreground">Create and assign assessments to see candidate performance data</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
