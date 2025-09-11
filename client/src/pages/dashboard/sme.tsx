import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Question, AiGenerationLog } from "@shared/schema";

export default function SMEDashboard() {
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

  const { data: myQuestions, isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ["/api/questions", { createdBy: user?.id }],
    retry: false,
  });

  const { data: aiLogs, isLoading: aiLogsLoading } = useQuery<AiGenerationLog[]>({
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

  const approvedQuestions = myQuestions?.filter((q: any) => q.status === 'approved').length || 0;
  const pendingQuestions = myQuestions?.filter((q: any) => q.status === 'pending').length || 0;
  const rejectedQuestions = myQuestions?.filter((q: any) => q.status === 'rejected').length || 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">SME Dashboard</h1>
          <p className="text-sm text-muted-foreground">Question creation and content management</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card data-testid="card-stats-my-questions">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">My Questions</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-my-questions">
                    {questionsLoading ? "..." : myQuestions?.length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-chart-1/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-question-circle text-chart-1 text-lg"></i>
                </div>
              </div>
              <p className="text-xs text-chart-2 mt-2">Total created</p>
            </CardContent>
          </Card>

          <Card data-testid="card-stats-approved">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-approved-questions">
                    {questionsLoading ? "..." : approvedQuestions}
                  </p>
                </div>
                <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-check-circle text-chart-2 text-lg"></i>
                </div>
              </div>
              <p className="text-xs text-chart-2 mt-2">Live in system</p>
            </CardContent>
          </Card>

          <Card data-testid="card-stats-pending">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-pending-questions">
                    {questionsLoading ? "..." : pendingQuestions}
                  </p>
                </div>
                <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-clock text-chart-3 text-lg"></i>
                </div>
              </div>
              <p className="text-xs text-chart-3 mt-2">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card data-testid="card-stats-ai-generated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">AI Generated</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-ai-generated">
                    {aiLogsLoading ? "..." : aiLogs?.length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-chart-4/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-robot text-chart-4 text-lg"></i>
                </div>
              </div>
              <p className="text-xs text-chart-4 mt-2">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card data-testid="card-quick-actions">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" data-testid="button-create-question">
                <i className="fas fa-plus mr-3"></i>
                Create New Question
              </Button>
              <Button variant="outline" className="w-full justify-start" data-testid="button-ai-generator">
                <i className="fas fa-robot mr-3"></i>
                AI Question Generator
              </Button>
              <Button variant="outline" className="w-full justify-start" data-testid="button-import-questions">
                <i className="fas fa-upload mr-3"></i>
                Import from Document
              </Button>
              <Button variant="outline" className="w-full justify-start" data-testid="button-question-bank">
                <i className="fas fa-database mr-3"></i>
                Browse Question Bank
              </Button>
            </CardContent>
          </Card>

          {/* Recent Questions */}
          <div className="lg:col-span-2">
            <Card data-testid="card-recent-questions">
              <CardHeader>
                <CardTitle>Recent Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {questionsLoading ? (
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
                  ) : myQuestions && myQuestions.length > 0 ? (
                    myQuestions.slice(0, 5).map((question: any, index: number) => (
                      <div key={question.id} className="flex items-start space-x-4 p-4 bg-muted/30 rounded-lg" data-testid={`question-${index}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          question.status === 'approved' 
                            ? 'bg-chart-2/10' 
                            : question.status === 'pending'
                            ? 'bg-chart-3/10'
                            : 'bg-destructive/10'
                        }`}>
                          <i className={`text-xs ${
                            question.status === 'approved'
                              ? 'fas fa-check text-chart-2'
                              : question.status === 'pending'
                              ? 'fas fa-clock text-chart-3'
                              : 'fas fa-times text-destructive'
                          }`}></i>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium text-foreground">{question.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {question.description}
                              </p>
                              <div className="flex items-center space-x-2 mt-2">
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
                            </div>
                            <div className="flex items-center space-x-2">
                              <button className="text-primary hover:text-primary/80 text-sm" data-testid={`button-edit-question-${index}`}>
                                <i className="fas fa-edit"></i>
                              </button>
                              <button className="text-muted-foreground hover:text-foreground text-sm" data-testid={`button-duplicate-question-${index}`}>
                                <i className="fas fa-copy"></i>
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Created {new Date(question.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <i className="fas fa-question-circle text-4xl text-muted-foreground mb-4"></i>
                      <p className="text-muted-foreground mb-2">No questions created yet</p>
                      <Button data-testid="button-create-first-question">
                        <i className="fas fa-plus mr-2"></i>
                        Create Your First Question
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* AI Generation History */}
        <Card data-testid="card-ai-history">
          <CardHeader>
            <CardTitle>AI Generation History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiLogsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4 p-3 bg-muted/30 rounded-lg animate-pulse">
                      <div className="w-6 h-6 bg-muted rounded"></div>
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
                    <div className="w-6 h-6 bg-chart-4/10 rounded flex items-center justify-center">
                      <i className="fas fa-robot text-chart-4 text-xs"></i>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground font-medium">
                        Generated {log.generatedQuestions?.length || 0} questions
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {log.prompt} • {new Date(log.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      log.status === 'completed'
                        ? 'bg-chart-2/10 text-chart-2'
                        : log.status === 'processing'
                        ? 'bg-chart-3/10 text-chart-3'
                        : 'bg-destructive/10 text-destructive'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <i className="fas fa-robot text-4xl text-muted-foreground mb-4"></i>
                  <p className="text-muted-foreground mb-2">No AI generation history</p>
                  <Button variant="outline" data-testid="button-try-ai-generator">
                    <i className="fas fa-robot mr-2"></i>
                    Try AI Generator
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
