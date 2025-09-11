import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import QuestionDisplay from "@/components/assessment/question-display";

export default function AssessmentExecution() {
  const { id: assessmentId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isStarted, setIsStarted] = useState(false);

  const { data: assessment, isLoading: assessmentLoading } = useQuery({
    queryKey: ["/api/assessments", assessmentId],
    retry: false,
    enabled: !!assessmentId,
  });

  const { data: assignment, isLoading: assignmentLoading } = useQuery({
    queryKey: ["/api/assignments", user?.id],
    retry: false,
    enabled: !!user?.id,
    select: (data) => data?.find((a: any) => a.assessmentId === assessmentId),
  });

  const startAssignmentMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", `/api/assignments/${assignment?.id}/start`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      setIsStarted(true);
      if (assessment?.duration) {
        setTimeRemaining(assessment.duration * 60); // Convert to seconds
      }
      toast({
        title: "Assessment Started",
        description: "Good luck with your assessment!",
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
        description: "Failed to start assessment",
        variant: "destructive",
      });
    },
  });

  const submitAssignmentMutation = useMutation({
    mutationFn: async () => {
      // Submit all answers first
      const submissions = Object.entries(answers).map(([questionId, answer]) => ({
        assignmentId: assignment?.id,
        questionId,
        answer,
        timeSpent: 0, // Would track this in a real implementation
      }));

      for (const submission of submissions) {
        await apiRequest("POST", "/api/submissions", submission);
      }

      // Mark assignment as submitted
      await apiRequest("PUT", `/api/assignments/${assignment?.id}/submit`, {});
    },
    onSuccess: () => {
      toast({
        title: "Assessment Submitted",
        description: "Your answers have been saved successfully",
      });
      setLocation("/");
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
        description: "Failed to submit assessment",
        variant: "destructive",
      });
    },
  });

  // Timer effect
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          // Time's up - auto submit
          submitAssignmentMutation.mutate();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, submitAssignmentMutation]);

  if (assessmentLoading || assignmentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (!assessment || !assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <i className="fas fa-exclamation-triangle text-4xl text-destructive mb-4"></i>
            <h2 className="text-lg font-semibold mb-2">Assessment Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The assessment you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => setLocation("/")} data-testid="button-back-home">
              Go Back Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (assignment.status === 'submitted') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <i className="fas fa-check-circle text-4xl text-chart-2 mb-4"></i>
            <h2 className="text-lg font-semibold mb-2">Assessment Completed</h2>
            <p className="text-muted-foreground mb-4">
              You have already submitted this assessment.
            </p>
            {assignment.score && (
              <div className="mb-4">
                <p className="text-2xl font-bold text-foreground">{assignment.score}%</p>
                <p className="text-sm text-muted-foreground">Your Score</p>
              </div>
            )}
            <Button onClick={() => setLocation("/")} data-testid="button-back-dashboard">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Assessment intro screen
  if (!isStarted && assignment.status === 'not_started') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl mb-2">{assessment.title}</CardTitle>
            <p className="text-muted-foreground">{assessment.description}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Assessment details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assessment.duration && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-chart-1/10 rounded-lg flex items-center justify-center">
                    <i className="fas fa-clock text-chart-1"></i>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Duration</p>
                    <p className="text-sm text-muted-foreground">{assessment.duration} minutes</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-chart-2/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-question-circle text-chart-2"></i>
                </div>
                <div>
                  <p className="font-medium text-foreground">Questions</p>
                  <p className="text-sm text-muted-foreground">{assessment.questions?.length || 0} questions</p>
                </div>
              </div>

              {assessment.passingScore && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-chart-3/10 rounded-lg flex items-center justify-center">
                    <i className="fas fa-chart-bar text-chart-3"></i>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Passing Score</p>
                    <p className="text-sm text-muted-foreground">{assessment.passingScore}%</p>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-chart-4/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-redo text-chart-4"></i>
                </div>
                <div>
                  <p className="font-medium text-foreground">Attempts</p>
                  <p className="text-sm text-muted-foreground">{assessment.maxAttempts || 1} allowed</p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="flex flex-wrap gap-2">
              {assessment.isAdaptive && (
                <Badge variant="outline">
                  <i className="fas fa-chart-line mr-1"></i>Adaptive Testing
                </Badge>
              )}
              {assessment.isProctored && (
                <Badge variant="outline">
                  <i className="fas fa-eye mr-1"></i>Proctored
                </Badge>
              )}
            </div>

            {/* Instructions */}
            {assessment.instructions && (
              <div className="p-4 bg-muted/30 rounded-lg">
                <h3 className="font-medium text-foreground mb-2">Instructions</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {assessment.instructions}
                </p>
              </div>
            )}

            {/* Start button */}
            <div className="text-center pt-4">
              <Button
                size="lg"
                onClick={() => startAssignmentMutation.mutate()}
                disabled={startAssignmentMutation.isPending}
                data-testid="button-start-assessment"
              >
                {startAssignmentMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Starting...
                  </div>
                ) : (
                  <>
                    <i className="fas fa-play mr-2"></i>
                    Start Assessment
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Assessment in progress
  const questions = assessment.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-foreground">{assessment.title}</h1>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                {timeRemaining !== null && (
                  <span className={timeRemaining < 300 ? "text-destructive" : ""}>
                    <i className="fas fa-clock mr-1"></i>
                    {formatTime(timeRemaining)}
                  </span>
                )}
              </div>
            </div>
            <Button 
              variant="destructive" 
              onClick={() => submitAssignmentMutation.mutate()}
              disabled={submitAssignmentMutation.isPending}
              data-testid="button-submit-assessment"
            >
              {submitAssignmentMutation.isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Submitting...
                </div>
              ) : (
                'Submit Assessment'
              )}
            </Button>
          </div>
          
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="container mx-auto px-4 py-8">
        {currentQuestion ? (
          <QuestionDisplay
            question={currentQuestion.question}
            answer={answers[currentQuestion.question.id]}
            onAnswerChange={(answer) => 
              setAnswers(prev => ({ ...prev, [currentQuestion.question.id]: answer }))
            }
          />
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <i className="fas fa-question-circle text-4xl text-muted-foreground mb-4"></i>
              <p className="text-muted-foreground">No questions available</p>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            data-testid="button-previous-question"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Previous
          </Button>

          <div className="flex space-x-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  index === currentQuestionIndex
                    ? 'bg-primary text-primary-foreground'
                    : answers[questions[index]?.question?.id]
                    ? 'bg-chart-2 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
                data-testid={`button-question-${index + 1}`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <Button
            onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
            disabled={currentQuestionIndex === questions.length - 1}
            data-testid="button-next-question"
          >
            Next
            <i className="fas fa-arrow-right ml-2"></i>
          </Button>
        </div>
      </div>
    </div>
  );
}
