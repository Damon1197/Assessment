import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

const assessmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  instructions: z.string().optional(),
  duration: z.number().min(1).max(480).optional(),
  maxAttempts: z.number().min(1).max(10).default(1),
  passingScore: z.number().min(0).max(100).default(70),
  isAdaptive: z.boolean().default(false),
  isProctored: z.boolean().default(false),
  scheduledStart: z.string().optional(),
  scheduledEnd: z.string().optional(),
  selectedQuestions: z.array(z.string()).default([]),
});

type AssessmentFormData = z.infer<typeof assessmentSchema>;

interface AssessmentFormProps {
  onSubmit: (data: AssessmentFormData) => void;
  isLoading?: boolean;
  initialData?: Partial<AssessmentFormData>;
}

export default function AssessmentForm({ onSubmit, isLoading, initialData }: AssessmentFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    skillId: "",
    difficulty: "",
    type: "",
  });

  const form = useForm<AssessmentFormData>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      instructions: initialData?.instructions || "",
      duration: initialData?.duration || 60,
      maxAttempts: initialData?.maxAttempts || 1,
      passingScore: initialData?.passingScore || 70,
      isAdaptive: initialData?.isAdaptive || false,
      isProctored: initialData?.isProctored || false,
      scheduledStart: initialData?.scheduledStart || "",
      scheduledEnd: initialData?.scheduledEnd || "",
      selectedQuestions: initialData?.selectedQuestions || [],
    },
  });

  const { data: skills } = useQuery({
    queryKey: ["/api/skills"],
    retry: false,
  });

  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ["/api/questions", { status: "approved", ...filters }],
    retry: false,
  });

  const handleSubmit = (data: AssessmentFormData) => {
    onSubmit({
      ...data,
      selectedQuestions: Array.from(selectedQuestions),
    });
  };

  const toggleQuestionSelection = (questionId: string) => {
    const newSelection = new Set(selectedQuestions);
    if (newSelection.has(questionId)) {
      newSelection.delete(questionId);
    } else {
      newSelection.add(questionId);
    }
    setSelectedQuestions(newSelection);
  };

  const steps = [
    { title: "Basic Information", description: "Assessment details and configuration" },
    { title: "Question Selection", description: "Choose questions for the assessment" },
    { title: "Review & Create", description: "Review and finalize the assessment" },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Assessment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assessment Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter assessment title" data-testid="input-assessment-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe the purpose and scope of this assessment..."
                          rows={3}
                          data-testid="textarea-assessment-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instructions for Candidates</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Provide detailed instructions for candidates taking this assessment..."
                          rows={4}
                          data-testid="textarea-assessment-instructions"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            data-testid="input-assessment-duration"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxAttempts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Attempts</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            data-testid="input-assessment-attempts"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="passingScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Passing Score (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            data-testid="input-assessment-passing-score"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="isAdaptive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="font-medium">Adaptive Testing</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Dynamically adjust question difficulty based on candidate performance
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-adaptive"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isProctored"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="font-medium">AI Proctoring</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Enable AI-powered monitoring for assessment integrity
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-proctored"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Scheduling */}
            <Card>
              <CardHeader>
                <CardTitle>Scheduling (Optional)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="scheduledStart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date & Time</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                            data-testid="input-scheduled-start"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scheduledEnd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date & Time</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                            data-testid="input-scheduled-end"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            {/* Question Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filter Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select
                    value={filters.skillId}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, skillId: value }))}
                  >
                    <SelectTrigger data-testid="select-filter-skill">
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
                    value={filters.difficulty}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, difficulty: value }))}
                  >
                    <SelectTrigger data-testid="select-filter-difficulty">
                      <SelectValue placeholder="All Difficulties" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Difficulties</SelectItem>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.type}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger data-testid="select-filter-type">
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
                </div>
              </CardContent>
            </Card>

            {/* Question Selection */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Select Questions</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    {selectedQuestions.size} questions selected
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {questionsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-start space-x-3 p-3 border rounded-lg animate-pulse">
                        <div className="w-4 h-4 bg-muted rounded"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : questions && questions.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {questions.map((question: any, index: number) => (
                      <div
                        key={question.id}
                        className={`flex items-start space-x-3 p-3 border rounded-lg transition-colors ${
                          selectedQuestions.has(question.id)
                            ? "border-primary bg-primary/5"
                            : "border-border"
                        }`}
                        data-testid={`question-selection-${index}`}
                      >
                        <Checkbox
                          checked={selectedQuestions.has(question.id)}
                          onCheckedChange={() => toggleQuestionSelection(question.id)}
                          data-testid={`checkbox-question-selection-${index}`}
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-foreground">{question.title}</h4>
                            <Badge variant="outline">
                              {question.type.replace("_", " ")}
                            </Badge>
                            <Badge variant={
                              question.difficulty === "easy" ? "secondary" :
                              question.difficulty === "medium" ? "default" : "destructive"
                            }>
                              {question.difficulty}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {question.description}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            {question.skill && (
                              <span>Skill: {question.skill.name}</span>
                            )}
                            {question.timeLimit && (
                              <span>Time: {question.timeLimit}min</span>
                            )}
                            <span>Score: {question.maxScore}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <i className="fas fa-question-circle text-4xl text-muted-foreground mb-4"></i>
                    <p className="text-muted-foreground">No approved questions available</p>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your filters or ask SMEs to create more questions
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* Assessment Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Assessment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Title</p>
                    <p className="text-sm text-muted-foreground">{form.watch("title")}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Duration</p>
                    <p className="text-sm text-muted-foreground">{form.watch("duration")} minutes</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Questions Selected</p>
                    <p className="text-sm text-muted-foreground">{selectedQuestions.size} questions</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Passing Score</p>
                    <p className="text-sm text-muted-foreground">{form.watch("passingScore")}%</p>
                  </div>
                </div>

                {form.watch("description") && (
                  <div>
                    <p className="text-sm font-medium text-foreground">Description</p>
                    <p className="text-sm text-muted-foreground">{form.watch("description")}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {form.watch("isAdaptive") && (
                    <Badge variant="outline">Adaptive Testing</Badge>
                  )}
                  {form.watch("isProctored") && (
                    <Badge variant="outline">AI Proctored</Badge>
                  )}
                  <Badge variant="outline">
                    {form.watch("maxAttempts")} Attempt{form.watch("maxAttempts") !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Selected Questions Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Selected Questions ({selectedQuestions.size})</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedQuestions.size > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {questions?.filter((q: any) => selectedQuestions.has(q.id)).map((question: any, index: number) => (
                      <div key={question.id} className="flex items-center space-x-3 p-2 bg-muted/30 rounded">
                        <span className="text-sm font-medium text-muted-foreground">{index + 1}.</span>
                        <span className="text-sm text-foreground flex-1">{question.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {question.type.replace("_", " ")}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No questions selected. Go back to select questions.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Step Progress */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div className={`flex items-center space-x-2 ${
                index <= currentStep ? "text-primary" : "text-muted-foreground"
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index <= currentStep ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}>
                  {index + 1}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-px mx-4 ${
                  index < currentStep ? "bg-primary" : "bg-muted"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        {renderStepContent()}

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            data-testid="button-previous-step"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Previous
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button
              type="button"
              onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
              disabled={currentStep === 1 && selectedQuestions.size === 0}
              data-testid="button-next-step"
            >
              Next
              <i className="fas fa-arrow-right ml-2"></i>
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isLoading || selectedQuestions.size === 0}
              data-testid="button-create-assessment"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Creating...
                </div>
              ) : (
                <>
                  <i className="fas fa-plus mr-2"></i>
                  Create Assessment
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
