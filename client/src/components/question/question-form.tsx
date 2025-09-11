import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CodeEditor from "@/components/assessment/code-editor";

const questionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  type: z.enum(["multiple_choice", "coding", "scenario", "file_upload"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  skillId: z.string().min(1, "Skill is required"),
  topicId: z.string().optional(),
  timeLimit: z.number().min(1).max(300).optional(),
  maxScore: z.number().min(1).max(100).default(100),
  content: z.any(),
  correctAnswer: z.any().optional(),
});

type QuestionFormData = z.infer<typeof questionSchema>;

interface QuestionFormProps {
  skills: Array<{ id: string; name: string }>;
  onSubmit: (data: QuestionFormData) => void;
  isLoading?: boolean;
  initialData?: Partial<QuestionFormData>;
}

export default function QuestionForm({ skills, onSubmit, isLoading, initialData }: QuestionFormProps) {
  const [selectedSkill, setSelectedSkill] = useState(initialData?.skillId || "");
  const [questionType, setQuestionType] = useState<string>(initialData?.type || "multiple_choice");

  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      type: (initialData?.type as any) || "multiple_choice",
      difficulty: (initialData?.difficulty as any) || "medium",
      skillId: initialData?.skillId || "",
      topicId: initialData?.topicId || "",
      timeLimit: initialData?.timeLimit || 30,
      maxScore: initialData?.maxScore || 100,
      content: initialData?.content || {},
      correctAnswer: initialData?.correctAnswer || null,
    },
  });

  const handleSubmit = (data: QuestionFormData) => {
    let processedContent = {};
    let processedCorrectAnswer = null;

    switch (data.type) {
      case "multiple_choice":
        const options = [
          form.getValues("content.optionA"),
          form.getValues("content.optionB"),
          form.getValues("content.optionC"),
          form.getValues("content.optionD"),
        ].filter(Boolean);
        
        processedContent = { options };
        processedCorrectAnswer = form.getValues("correctAnswer.correctOption");
        break;

      case "coding":
        processedContent = {
          language: form.getValues("content.language") || "python",
          starterCode: form.getValues("content.starterCode") || "",
          testCases: form.getValues("content.testCases") || [],
          constraints: form.getValues("content.constraints") || "",
        };
        processedCorrectAnswer = {
          solutionCode: form.getValues("correctAnswer.solutionCode") || "",
          approach: form.getValues("correctAnswer.approach") || "",
        };
        break;

      case "scenario":
        processedContent = {
          scenario: form.getValues("content.scenario") || "",
          tasks: form.getValues("content.tasks") || [],
          deliverables: form.getValues("content.deliverables") || [],
          evaluationCriteria: form.getValues("content.evaluationCriteria") || [],
        };
        processedCorrectAnswer = {
          sampleSolution: form.getValues("correctAnswer.sampleSolution") || "",
          keyPoints: form.getValues("correctAnswer.keyPoints") || [],
        };
        break;

      case "file_upload":
        processedContent = {
          allowedFileTypes: form.getValues("content.allowedFileTypes") || [],
          maxFileSize: form.getValues("content.maxFileSize") || 10,
          requirements: form.getValues("content.requirements") || "",
        };
        break;
    }

    onSubmit({
      ...data,
      content: processedContent,
      correctAnswer: processedCorrectAnswer,
    });
  };

  const renderQuestionTypeFields = () => {
    switch (questionType) {
      case "multiple_choice":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="content.optionA"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Option A</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="First option" data-testid="input-option-a" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content.optionB"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Option B</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Second option" data-testid="input-option-b" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content.optionC"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Option C</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Third option" data-testid="input-option-c" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content.optionD"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Option D</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Fourth option" data-testid="input-option-d" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="correctAnswer.correctOption"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correct Answer</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-correct-option">
                        <SelectValue placeholder="Select correct option" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="A">Option A</SelectItem>
                      <SelectItem value="B">Option B</SelectItem>
                      <SelectItem value="C">Option C</SelectItem>
                      <SelectItem value="D">Option D</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case "coding":
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="content.language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Programming Language</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || "python"}>
                    <FormControl>
                      <SelectTrigger data-testid="select-language">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="c">C</SelectItem>
                      <SelectItem value="cpp">C++</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content.starterCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Starter Code (Optional)</FormLabel>
                  <FormControl>
                    <CodeEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      language={form.watch("content.language") || "python"}
                      height="200px"
                      data-testid="code-editor-starter"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content.constraints"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Constraints</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Time complexity, space complexity, input limits..."
                      data-testid="textarea-constraints"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="correctAnswer.solutionCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sample Solution</FormLabel>
                  <FormControl>
                    <CodeEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      language={form.watch("content.language") || "python"}
                      height="300px"
                      data-testid="code-editor-solution"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="correctAnswer.approach"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Solution Approach</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Explain the approach and algorithm used..."
                      data-testid="textarea-approach"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case "scenario":
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="content.scenario"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scenario Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe the scenario or situation..."
                      rows={4}
                      data-testid="textarea-scenario"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content.requirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requirements</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="What needs to be delivered or accomplished..."
                      rows={3}
                      data-testid="textarea-requirements"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="correctAnswer.sampleSolution"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sample Solution</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Example of a good solution or approach..."
                      rows={4}
                      data-testid="textarea-sample-solution"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case "file_upload":
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="content.allowedFileTypes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allowed File Types</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., .pdf, .docx, .zip"
                      value={Array.isArray(field.value) ? field.value.join(", ") : field.value || ""}
                      onChange={(e) => field.onChange(e.target.value.split(",").map(s => s.trim()))}
                      data-testid="input-file-types"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content.maxFileSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max File Size (MB)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      data-testid="input-max-file-size"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content.requirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>File Requirements</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Specific requirements for the uploaded file..."
                      data-testid="textarea-file-requirements"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter question title" data-testid="input-title" />
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
                        placeholder="Describe what this question tests..."
                        rows={4}
                        data-testid="textarea-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Type</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setQuestionType(value);
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-question-type">
                          <SelectValue placeholder="Select question type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                        <SelectItem value="coding">Coding Challenge</SelectItem>
                        <SelectItem value="scenario">Scenario Based</SelectItem>
                        <SelectItem value="file_upload">File Upload</SelectItem>
                      </SelectContent>
                    </Select>
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
              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-difficulty">
                          <SelectValue placeholder="Select difficulty" />
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
                name="skillId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skill Category</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedSkill(value);
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-skill">
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="timeLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time Limit (min)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          data-testid="input-time-limit"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Score</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          data-testid="input-max-score"
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

        {/* Question Type Specific Fields */}
        <Card>
          <CardHeader>
            <CardTitle>
              Question Content
              <Badge variant="outline" className="ml-2">
                {questionType.replace("_", " ").toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderQuestionTypeFields()}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" data-testid="button-cancel">
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} data-testid="button-save-question">
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Saving...
              </div>
            ) : (
              "Save Question"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
