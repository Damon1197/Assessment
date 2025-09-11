import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Assessment, Question, AiGenerationLog } from "@shared/schema";

export default function SuperAdminDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
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

  const { data: analytics, isLoading: analyticsLoading } = useQuery<{
    assessments: { totalAssessments: number; activeAssessments: number; completedAssessments: number };
    questions: { totalQuestions: number; approvedQuestions: number; pendingQuestions: number; aiGeneratedQuestions: number };
    users: { totalUsers: number; candidates: number; smes: number; managers: number };
  }>({
    queryKey: ["/api/analytics/stats"],
    retry: false,
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<AiGenerationLog[]>({
    queryKey: ["/api/analytics/ai-logs"],
    retry: false,
  });

  const { data: assessments, isLoading: assessmentsLoading } = useQuery<Assessment[]>({
    queryKey: ["/api/assessments"],
    retry: false,
  });

  const { data: questions, isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ["/api/questions"],
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

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Super Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Platform overview and system management</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card data-testid="card-stats-assessments">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Assessments</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-active-assessments">
                    {analyticsLoading ? "..." : analytics?.assessments?.activeAssessments || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-chart-1/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-clipboard-check text-chart-1 text-lg"></i>
                </div>
              </div>
              <p className="text-xs text-chart-2 mt-2">+12% from last month</p>
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
                {analyticsLoading ? "..." : `+${analytics?.questions?.aiGeneratedQuestions || 0} AI generated`}
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
              <p className="text-xs text-chart-2 mt-2">
                {analyticsLoading ? "..." : `${analytics?.users?.candidates || 0} candidates`}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-stats-health">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">System Health</p>
                  <p className="text-2xl font-bold text-foreground">99.7%</p>
                </div>
                <div className="w-12 h-12 bg-chart-4/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-heartbeat text-chart-4 text-lg"></i>
                </div>
              </div>
              <p className="text-xs text-chart-2 mt-2">Excellent uptime</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card data-testid="card-recent-activity">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-foreground">Recent Platform Activity</h3>
                  <Button variant="ghost" size="sm" data-testid="button-view-all-activity">
                    View All
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {activitiesLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-start space-x-4 p-4 bg-muted/30 rounded-lg animate-pulse">
                          <div className="w-8 h-8 bg-muted rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded w-3/4"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : activities && activities.length > 0 ? (
                    activities.slice(0, 3).map((activity: any, index: number) => (
                      <div key={activity.id || index} className="flex items-start space-x-4 p-4 bg-muted/30 rounded-lg" data-testid={`activity-${index}`}>
                        <div className="w-8 h-8 bg-chart-1/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-robot text-chart-1 text-xs"></i>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-foreground">
                            AI Question Generator processed questions from uploaded documents
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-xs bg-chart-5/10 text-chart-5 px-2 py-1 rounded-full">System</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No recent activity</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Stats */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card data-testid="card-quick-actions">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    data-testid="button-add-sme"
                  >
                    <div className="flex items-center space-x-3">
                      <i className="fas fa-user-plus text-primary"></i>
                      <span className="text-sm font-medium">Add New SME</span>
                    </div>
                    <i className="fas fa-arrow-right text-primary text-xs"></i>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    data-testid="button-system-settings"
                  >
                    <div className="flex items-center space-x-3">
                      <i className="fas fa-cogs text-muted-foreground"></i>
                      <span className="text-sm font-medium">System Settings</span>
                    </div>
                    <i className="fas fa-arrow-right text-muted-foreground text-xs"></i>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    data-testid="button-export-reports"
                  >
                    <div className="flex items-center space-x-3">
                      <i className="fas fa-download text-muted-foreground"></i>
                      <span className="text-sm font-medium">Export Reports</span>
                    </div>
                    <i className="fas fa-arrow-right text-muted-foreground text-xs"></i>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* SME Performance */}
            <Card data-testid="card-sme-performance">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Top SME Contributors</h3>
                <div className="space-y-4">
                  {/* Static placeholder for SME contributors */}
                  <div className="flex items-center justify-between" data-testid="sme-contributor-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary-foreground">EC</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Dr. Emily Chen</p>
                        <p className="text-xs text-muted-foreground">Python/ML Expert</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">156</p>
                      <p className="text-xs text-muted-foreground">questions</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between" data-testid="sme-contributor-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-chart-2 to-chart-4 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary-foreground">RK</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Raj Kumar</p>
                        <p className="text-xs text-muted-foreground">C/Embedded Systems</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">142</p>
                      <p className="text-xs text-muted-foreground">questions</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between" data-testid="sme-contributor-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-chart-3 to-chart-5 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary-foreground">AS</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Anna Schmidt</p>
                        <p className="text-xs text-muted-foreground">AUTOSAR/QNX</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">98</p>
                      <p className="text-xs text-muted-foreground">questions</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Assessment Management Section */}
        <Card data-testid="card-assessment-management">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Assessment Management</h3>
              <div className="flex items-center space-x-3">
                <select className="bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground" data-testid="select-assessment-status">
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Completed</option>
                  <option>Pending</option>
                </select>
                <Button data-testid="button-create-assessment">
                  <i className="fas fa-plus mr-2"></i>Create Assessment
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Assessment Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Created By</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Candidates</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Skills</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assessmentsLoading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                      </td>
                    </tr>
                  ) : assessments && assessments.length > 0 ? (
                    assessments.slice(0, 5).map((assessment: any, index: number) => (
                      <tr key={assessment.id} className="border-b border-border/50 hover:bg-muted/20" data-testid={`assessment-row-${index}`}>
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-sm font-medium text-foreground">{assessment.title}</p>
                            <p className="text-xs text-muted-foreground">
                              Created {new Date(assessment.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center">
                              <span className="text-xs font-semibold text-primary-foreground">
                                {assessment.createdBy?.firstName?.[0] || 'U'}
                              </span>
                            </div>
                            <span className="text-sm text-foreground">
                              {assessment.createdBy?.firstName || 'Unknown'} {assessment.createdBy?.lastName || ''}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-1">
                            <span className="text-sm font-medium text-foreground">0</span>
                            <span className="text-muted-foreground">/</span>
                            <span className="text-sm text-muted-foreground">0</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs bg-chart-1/10 text-chart-1 px-2 py-1 rounded-full">General</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            assessment.status === 'active' 
                              ? 'bg-chart-2/10 text-chart-2' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {assessment.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <button className="text-primary hover:text-primary/80 text-sm" data-testid={`button-view-assessment-${index}`}>
                              <i className="fas fa-eye"></i>
                            </button>
                            <button className="text-muted-foreground hover:text-foreground text-sm" data-testid={`button-edit-assessment-${index}`}>
                              <i className="fas fa-edit"></i>
                            </button>
                            <button className="text-destructive hover:text-destructive/80 text-sm" data-testid={`button-delete-assessment-${index}`}>
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        No assessments found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Question Bank Preview */}
        <Card data-testid="card-question-bank">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Latest Question Bank Additions</h3>
              <Button variant="ghost" size="sm" data-testid="button-view-question-bank">
                View Full Question Bank
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {questionsLoading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="bg-muted/30 rounded-lg p-4 border border-border animate-pulse">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex space-x-2">
                        <div className="h-5 bg-muted rounded w-16"></div>
                        <div className="h-5 bg-muted rounded w-12"></div>
                      </div>
                    </div>
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-full mb-3"></div>
                    <div className="flex items-center justify-between">
                      <div className="h-3 bg-muted rounded w-20"></div>
                      <div className="h-3 bg-muted rounded w-16"></div>
                    </div>
                  </div>
                ))
              ) : questions && questions.length > 0 ? (
                questions.slice(0, 3).map((question: any, index: number) => (
                  <div key={question.id} className="bg-muted/30 rounded-lg p-4 border border-border" data-testid={`question-card-${index}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          question.type === 'coding' 
                            ? 'bg-chart-1/10 text-chart-1'
                            : question.type === 'multiple_choice'
                            ? 'bg-chart-2/10 text-chart-2'
                            : 'bg-chart-3/10 text-chart-3'
                        }`}>
                          {question.type ? question.type.replace('_', ' ') : 'Unknown'}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          question.difficulty === 'easy'
                            ? 'bg-chart-4/10 text-chart-4'
                            : question.difficulty === 'medium'
                            ? 'bg-chart-3/10 text-chart-3'
                            : 'bg-chart-5/10 text-chart-5'
                        }`}>
                          {question.difficulty}
                        </span>
                      </div>
                      <button className="text-muted-foreground hover:text-foreground">
                        <i className="fas fa-ellipsis-h text-sm"></i>
                      </button>
                    </div>
                    <h4 className="text-sm font-medium text-foreground mb-2">{question.title}</h4>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {question.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                          {question.isAiGenerated ? (
                            <i className="fas fa-robot text-xs text-primary-foreground"></i>
                          ) : (
                            <span className="text-xs font-semibold text-primary-foreground">
                              {question.createdBy?.firstName?.[0] || 'U'}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {question.isAiGenerated ? 'AI Assistant' : question.createdBy?.firstName || 'Unknown'}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(question.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">No questions found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
