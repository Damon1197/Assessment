import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const generatorSchema = z.object({
  skill: z.string().min(1, "Skill is required"),
  skillId: z.string().min(1, "Skill ID is required"),
  topic: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  questionType: z.enum(["multiple_choice", "coding", "scenario"]),
  count: z.number().min(1).max(10),
  context: z.string().optional(),
});

type GeneratorFormData = z.infer<typeof generatorSchema>;

interface AIGeneratorProps {
  skills: Array<{ id: string; name: string }>;
  onGenerated: () => void;
}

export default function AIGenerator({ skills, onGenerated }: AIGeneratorProps) {
  const { toast } = useToast();
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set());

  const form = useForm<GeneratorFormData>({
    resolver: zodResolver(generatorSchema),
    defaultValues: {
      skill: "",
      skillId: "",
      topic: "",
      difficulty: "medium",
      questionType: "multiple_choice",
      count: 3,
      context: "",
    },
  });

  const generateQuestionsMutation = useMutation({
    mutationFn: async (data: GeneratorFormData) => {
      const response = await apiRequest("POST", "/api/questions/generate", data);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedQuestions(data.questions || []);
      setSelectedQuestions(new Set(data.questions?.map((_: any, index: number) => index) || []));
      toast({
        title: "Questions Generated",
        description: `Generated ${data.questions?.length || 0} questions successfully`,
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
        title: "Generation Failed",
        description: "Failed to generate questions. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveQuestionsMutation = useMutation({
    mutationFn: async (questions: any[]) => {
      const promises = questions.map((question) =>
        apiRequest("POST", "/api/questions", {
          ...question,
          isAiGenerated: true,
          skillId: form.getValues("skillId"),
        })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Questions Saved",
        description: "Selected questions have been saved to the question bank",
      });
      onGenerated();
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
        title: "Save Failed",
        description: "Failed to save questions. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = (data: GeneratorFormData) => {
    generateQuestionsMutation.mutate(data);
  };

  const handleSaveSelected = () => {
    const questionsToSave = generatedQuestions.filter((_, index) =>
      selectedQuestions.has(index)
    );
    saveQuestionsMutation.mutate(questionsToSave);
  };

  const toggleQuestionSelection = (index: number) => {
    const newSelection = new Set(selectedQuestions);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedQuestions(newSelection);
  };

  const selectedSkill = skills.find(s => s.id === form.watch("skillId"));

  return (
    <div className="space-y-6">
      {/* Generation Form */}
      <Card data-testid="card-ai-generator-form">
        <CardHeader>
          <CardTitle>AI Question Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleGenerate)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="skillId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skill Category</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          const skill = skills.find(s => s.id === value);
                          form.setValue("skill", skill?.name || "");
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-ai-skill">
                            <SelectValue placeholder="Select skill" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {skills.map((skill) => (
                            <SelectItem key={skill.id} value={skill.id}>
                              {skill.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Topic (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Specific topic or subtopic"
                          data-testid="input-ai-topic"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty Level</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-ai-difficulty">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="questionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-ai-question-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                          <SelectItem value="coding">Coding Challenge</SelectItem>
                          <SelectItem value="scenario">Scenario Based</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Questions</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          min={1}
                          max={10}
                          data-testid="input-ai-count"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="context"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Context (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Provide additional context, upload document content, or specific requirements..."
                        rows={4}
                        data-testid="textarea-ai-context"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={generateQuestionsMutation.isPending}
                className="w-full"
                data-testid="button-generate-questions"
              >
                {generateQuestionsMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Generating Questions...
                  </div>
                ) : (
                  <>
                    <i className="fas fa-robot mr-2"></i>
                    Generate Questions
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Generated Questions */}
      {generatedQuestions.length > 0 && (
        <Card data-testid="card-generated-questions">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated Questions</CardTitle>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {selectedQuestions.size} of {generatedQuestions.length} selected
                </span>
                <Button
                  onClick={handleSaveSelected}
                  disabled={selectedQuestions.size === 0 || saveQuestionsMutation.isPending}
                  data-testid="button-save-selected"
                >
                  {saveQuestionsMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Saving...
                    </div>
                  ) : (
                    <>
                      <i className="fas fa-save mr-2"></i>
                      Save Selected
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {generatedQuestions.map((question, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg transition-colors ${
                    selectedQuestions.has(index)
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                  data-testid={`generated-question-${index}`}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedQuestions.has(index)}
                      onChange={() => toggleQuestionSelection(index)}
                      className="mt-1"
                      data-testid={`checkbox-question-${index}`}
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-foreground">{question.title}</h4>
                        <Badge variant="outline">
                          {form.watch("questionType").replace("_", " ")}
                        </Badge>
                        <Badge variant={
                          form.watch("difficulty") === "easy" ? "secondary" :
                          form.watch("difficulty") === "medium" ? "default" : "destructive"
                        }>
                          {form.watch("difficulty")}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{question.description}</p>
                      
                      {/* Question Content Preview */}
                      {form.watch("questionType") === "multiple_choice" && question.content?.options && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Options:</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {question.content.options.map((option: string, optionIndex: number) => (
                              <div
                                key={optionIndex}
                                className={`text-xs p-2 rounded border ${
                                  question.correctAnswer === String.fromCharCode(65 + optionIndex)
                                    ? "border-chart-2 bg-chart-2/10"
                                    : "border-border"
                                }`}
                              >
                                {String.fromCharCode(65 + optionIndex)}: {option}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {form.watch("questionType") === "coding" && question.content && (
                        <div className="mt-3">
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            {question.content.language && (
                              <span>Language: {question.content.language}</span>
                            )}
                            {question.timeLimit && (
                              <span>Time: {question.timeLimit}min</span>
                            )}
                          </div>
                        </div>
                      )}

                      {question.explanation && (
                        <div className="mt-3 p-3 bg-muted/30 rounded">
                          <p className="text-xs font-medium text-foreground mb-1">Explanation:</p>
                          <p className="text-xs text-muted-foreground">{question.explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
