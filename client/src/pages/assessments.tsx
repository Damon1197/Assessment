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
import AssessmentForm from "@/components/assessment/assessment-form";
import type { Assessment } from "@shared/schema";

export default function Assessments() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [filters, setFilters] = useState({
    search: "",
    status: "",
  });
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: assessments, isLoading: assessmentsLoading } = useQuery<Assessment[]>({
    queryKey: ["/api/assessments", filters],
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

  const filteredAssessments = assessments?.filter((assessment: any) => {
    if (filters.search && !assessment.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !assessment.description?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.status && assessment.status !== filters.status) {
      return false;
    }
    return true;
  });

  const canCreateAssessments = ['super_admin', 'manager_hr'].includes(user?.role || '');

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Assessments</h1>
            <p className="text-sm text-muted-foreground">Manage and monitor assessment activities</p>
          </div>
          {canCreateAssessments && (
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
          )}
        </div>

        {/* Filters */}
        <Card data-testid="card-filters">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Search assessments..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                data-testid="input-search"
              />
              
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger data-testid="select-status">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Assessments Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {assessmentsLoading ? (
            [1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse" data-testid={`assessment-skeleton-${i}`}>
                <CardHeader className="pb-3">
                  <div className="space-y-2">
                    <div className="h-5 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                  <div className="flex space-x-2">
                    <div className="h-5 bg-muted rounded w-16"></div>
                    <div className="h-5 bg-muted rounded w-12"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredAssessments && filteredAssessments.length > 0 ? (
            filteredAssessments.map((assessment: any, index: number) => (
              <Card key={assessment.id} className="hover:shadow-md transition-shadow" data-testid={`assessment-card-${index}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{assessment.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(assessment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={
                      assessment.status === 'active' ? 'default' :
                      assessment.status === 'completed' ? 'secondary' :
                      assessment.status === 'draft' ? 'outline' : 'destructive'
                    }>
                      {assessment.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {assessment.description || 'No description provided'}
                  </p>

                  {/* Assessment features */}
                  <div className="flex flex-wrap gap-2">
                    {assessment.isAdaptive && (
                      <Badge variant="outline">
                        <i className="fas fa-chart-line mr-1"></i>Adaptive
                      </Badge>
                    )}
                    {assessment.isProctored && (
                      <Badge variant="outline">
                        <i className="fas fa-eye mr-1"></i>Proctored
                      </Badge>
                    )}
                    {assessment.duration && (
                      <Badge variant="outline">
                        <i className="fas fa-clock mr-1"></i>{assessment.duration}min
                      </Badge>
                    )}
                    {assessment.maxAttempts && assessment.maxAttempts > 1 && (
                      <Badge variant="outline">
                        {assessment.maxAttempts} attempts
                      </Badge>
                    )}
                  </div>

                  {/* Assessment metadata */}
                  <div className="text-xs text-muted-foreground space-y-1">
                    {assessment.passingScore && (
                      <p><span className="font-medium">Passing Score:</span> {assessment.passingScore}%</p>
                    )}
                    {assessment.scheduledStart && (
                      <p><span className="font-medium">Scheduled:</span> {new Date(assessment.scheduledStart).toLocaleDateString()}</p>
                    )}
                  </div>

                  {/* Creator info */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary-foreground">
                          {assessment.createdBy?.firstName?.[0] || 'U'}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {assessment.createdBy?.firstName} {assessment.createdBy?.lastName}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <Button size="sm" variant="ghost" data-testid={`button-view-assessment-${index}`}>
                        <i className="fas fa-eye"></i>
                      </Button>
                      {(canCreateAssessments || assessment.createdBy?.id === user?.id) && (
                        <Button size="sm" variant="ghost" data-testid={`button-edit-assessment-${index}`}>
                          <i className="fas fa-edit"></i>
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" data-testid={`button-reports-assessment-${index}`}>
                        <i className="fas fa-chart-bar"></i>
                      </Button>
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
                    <i className="fas fa-clipboard-list text-6xl text-muted-foreground mb-4"></i>
                    <p className="text-muted-foreground mb-2">No assessments found</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      {filters.search || filters.status
                        ? "Try adjusting your filters to see more assessments"
                        : "Create your first assessment to get started"
                      }
                    </p>
                    {canCreateAssessments && (
                      <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-assessment">
                        <i className="fas fa-plus mr-2"></i>Create Assessment
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
