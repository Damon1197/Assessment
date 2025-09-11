import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import QuestionForm from "@/components/question/question-form";
import AIGenerator from "@/components/question/ai-generator";

export default function QuestionBank() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [filters, setFilters] = useState({
    search: "",
    skillId: "",
    topicId: "",
    difficulty: "",
    type: "",
    status: "",
  });
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);

  const { data: questions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ["/api/questions", filters],
    retry: false,
  });

  const { data: skills = [], isLoading: skillsLoading } = useQuery({
    queryKey: ["/api/skills"],
    retry: false,
  });

  const { data: topics = [] } = useQuery({
    queryKey: ["/api/skills", filters.skillId, "topics"],
    enabled: !!filters.skillId,
    retry: false,
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (questionData: any) => {
      await apiRequest("POST", "/api/questions", questionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Question created successfully",
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
        description: "Failed to create question",
        variant: "destructive",
      });
    },
  });

  const approveQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      await apiRequest("POST", `/api/questions/${questionId}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      toast({
        title: "Success",
        description: "Question approved successfully",
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
        description: "Failed to approve question",
        variant: "destructive",
      });
    },
  });

  const rejectQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      await apiRequest("POST", `/api/questions/${questionId}/reject`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      toast({
        title: "Success",
        description: "Question rejected",
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
        description: "Failed to reject question",
        variant: "destructive",
      });
    },
  });

  const filteredQuestions = questions.filter((question: any) => {
    if (filters.search && !question.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !question.description.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    return true;
  });

  const canManageQuestions = ['super_admin', 'sme'].includes(user?.role || '');
  const canApproveQuestions = user?.role === 'super_admin';

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Question Bank</h1>
            <p className="text-sm text-muted-foreground">Manage and organize assessment questions</p>
          </div>
          {canManageQuestions && (
            <div className="flex space-x-2">
              <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-ai-generator">
                    <i className="fas fa-robot mr-2"></i>AI Generator
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>AI Question Generator</DialogTitle>
                  </DialogHeader>
                  <AIGenerator
                    skills={skills}
                    onGenerated={() => {
                      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
                      setIsAIDialogOpen(false);
                    }}
                  />
                </DialogContent>
              </Dialog>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-question">
                    <i className="fas fa-plus mr-2"></i>Create Question
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Question</DialogTitle>
                  </DialogHeader>
                  <QuestionForm
                    skills={skills}
                    onSubmit={(data) => createQuestionMutation.mutate(data)}
                    isLoading={createQuestionMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        {/* Filters */}
        <Card data-testid="card-filters">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Input
                placeholder="Search questions..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                data-testid="input-search"
              />
              
              <Select
                value={filters.skillId}
                onValueChange={(value) => setFilters(prev => ({ ...prev, skillId: value, topicId: "" }))}
              >
                <SelectTrigger data-testid="select-skill">
                  <SelectValue placeholder="All Skills" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Skills</SelectItem>
                  {skills?.map((skill: any) => (
                    <SelectItem key={skill.id} value={skill.id}>{skill.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.topicId}
                onValueChange={(value) => setFilters(prev => ({ ...prev, topicId: value }))}
                disabled={!filters.skillId}
              >
                <SelectTrigger data-testid="select-topic">
                  <SelectValue placeholder="All Topics" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Topics</SelectItem>
                  {topics?.map((topic: any) => (
                    <SelectItem key={topic.id} value={topic.id}>{topic.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.difficulty}
                onValueChange={(value) => setFilters(prev => ({ ...prev, difficulty: value }))}
              >
                <SelectTrigger data-testid="select-difficulty">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.type}
                onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger data-testid="select-type">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                  <SelectItem value="coding">Coding</SelectItem>
                  <SelectItem value="scenario">Scenario</SelectItem>
                  <SelectItem value="file_upload">File Upload</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger data-testid="select-status">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Questions List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {questionsLoading ? (
            [1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse" data-testid={`question-skeleton-${i}`}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <div className="h-5 bg-muted rounded w-16"></div>
                      <div className="h-5 bg-muted rounded w-12"></div>
                    </div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-full"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredQuestions && filteredQuestions.length > 0 ? (
            filteredQuestions.map((question: any, index: number) => (
              <Card key={question.id} data-testid={`question-card-${index}`}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Question badges */}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={question.type === 'coding' ? 'default' : 'secondary'}>
                        {question.type.replace('_', ' ')}
                      </Badge>
                      <Badge variant={
                        question.difficulty === 'easy' ? 'outline' :
                        question.difficulty === 'medium' ? 'secondary' : 'destructive'
                      }>
                        {question.difficulty}
                      </Badge>
                      <Badge variant={
                        question.status === 'approved' ? 'default' :
                        question.status === 'pending' ? 'secondary' : 'destructive'
                      }>
                        {question.status}
                      </Badge>
                      {question.isAiGenerated && (
                        <Badge variant="outline">
                          <i className="fas fa-robot mr-1"></i>AI
                        </Badge>
                      )}
                    </div>

                    {/* Question content */}
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">{question.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {question.description}
                      </p>
                    </div>

                    {/* Question metadata */}
                    <div className="space-y-2 text-xs text-muted-foreground">
                      {question.skill && (
                        <p><span className="font-medium">Skill:</span> {question.skill.name}</p>
                      )}
                      {question.topic && (
                        <p><span className="font-medium">Topic:</span> {question.topic.name}</p>
                      )}
                      {question.timeLimit && (
                        <p><span className="font-medium">Time:</span> {question.timeLimit} min</p>
                      )}
                      <p><span className="font-medium">Created:</span> {new Date(question.createdAt).toLocaleDateString()}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="flex items-center space-x-2">
                        {question.createdBy && (
                          <div className="w-6 h-6 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                            <span className="text-xs font-semibold text-primary-foreground">
                              {question.createdBy.firstName?.[0] || 'U'}
                            </span>
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {question.createdBy?.firstName} {question.createdBy?.lastName}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        {canManageQuestions && (
                          <Button size="sm" variant="ghost" data-testid={`button-edit-question-${index}`}>
                            <i className="fas fa-edit"></i>
                          </Button>
                        )}
                        
                        {canApproveQuestions && question.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => approveQuestionMutation.mutate(question.id)}
                              disabled={approveQuestionMutation.isPending}
                              data-testid={`button-approve-question-${index}`}
                            >
                              <i className="fas fa-check text-chart-2"></i>
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => rejectQuestionMutation.mutate(question.id)}
                              disabled={rejectQuestionMutation.isPending}
                              data-testid={`button-reject-question-${index}`}
                            >
                              <i className="fas fa-times text-destructive"></i>
                            </Button>
                          </>
                        )}

                        <Button size="sm" variant="ghost" data-testid={`button-view-question-${index}`}>
                          <i className="fas fa-eye"></i>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <Card>
                <CardContent className="p-12">
                  <div className="text-center">
                    <i className="fas fa-question-circle text-6xl text-muted-foreground mb-4"></i>
                    <p className="text-muted-foreground mb-2">No questions found</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      {filters.search || filters.skillId || filters.topicId || filters.difficulty || filters.type || filters.status
                        ? "Try adjusting your filters to see more questions"
                        : "Create your first question to get started"
                      }
                    </p>
                    {canManageQuestions && (
                      <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-question">
                        <i className="fas fa-plus mr-2"></i>Create Question
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
