import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import CodeEditor from "./code-editor";

interface QuestionDisplayProps {
  question: any;
  answer: any;
  onAnswerChange: (answer: any) => void;
  showSubmit?: boolean;
  onSubmit?: () => void;
  readOnly?: boolean;
}

export default function QuestionDisplay({
  question,
  answer,
  onAnswerChange,
  showSubmit = false,
  onSubmit,
  readOnly = false,
}: QuestionDisplayProps) {
  const { toast } = useToast();
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [codeOutput, setCodeOutput] = useState<any>(null);

  const executeCodeMutation = useMutation({
    mutationFn: async (codeData: { code: string; language: string; testCases?: any[] }) => {
      const response = await apiRequest("POST", "/api/code/execute", codeData);
      return response.json();
    },
    onSuccess: (result) => {
      setCodeOutput(result);
      setIsRunningCode(false);
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
        title: "Execution Failed",
        description: "Failed to execute code. Please try again.",
        variant: "destructive",
      });
      setIsRunningCode(false);
    },
  });

  const handleCodeExecution = () => {
    if (!answer?.code) {
      toast({
        title: "No Code to Execute",
        description: "Please write some code before running.",
        variant: "destructive",
      });
      return;
    }

    setIsRunningCode(true);
    executeCodeMutation.mutate({
      code: answer.code,
      language: question.content?.language || "python",
      testCases: question.content?.testCases || [],
    });
  };

  const renderQuestionContent = () => {
    switch (question.type) {
      case "multiple_choice":
        return (
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-foreground">{question.description}</p>
            </div>
            
            <RadioGroup
              value={answer?.selectedOption || ""}
              onValueChange={(value) => onAnswerChange({ selectedOption: value })}
              disabled={readOnly}
            >
              {question.content?.options?.map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-2" data-testid={`option-${index}`}>
                  <RadioGroupItem 
                    value={String.fromCharCode(65 + index)} 
                    id={`option-${index}`}
                  />
                  <Label htmlFor={`option-${index}`} className="text-sm">
                    <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case "coding":
        return (
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-foreground mb-2">{question.description}</p>
              {question.content?.constraints && (
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium">Constraints:</p>
                  <p>{question.content.constraints}</p>
                </div>
              )}
            </div>

            {/* Test Cases Display */}
            {question.content?.testCases && question.content.testCases.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Test Cases</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {question.content.testCases.slice(0, 2).map((testCase: any, index: number) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-muted/30 rounded text-sm">
                        <div>
                          <p className="font-medium text-foreground">Input:</p>
                          <p className="text-muted-foreground font-mono">{testCase.input}</p>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Expected Output:</p>
                          <p className="text-muted-foreground font-mono">{testCase.expectedOutput}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Code Editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Your Solution</Label>
                {!readOnly && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCodeExecution}
                    disabled={isRunningCode}
                    data-testid="button-run-code"
                  >
                    {isRunningCode ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        Running...
                      </div>
                    ) : (
                      <>
                        <i className="fas fa-play mr-2"></i>
                        Run Code
                      </>
                    )}
                  </Button>
                )}
              </div>
              
              <CodeEditor
                value={answer?.code || question.content?.starterCode || ""}
                onChange={(code) => onAnswerChange({ ...answer, code })}
                language={question.content?.language || "python"}
                height="300px"
                readOnly={readOnly}
                data-testid="code-editor-question"
              />
            </div>

            {/* Code Output */}
            {codeOutput && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    <i className="fas fa-terminal mr-2"></i>
                    Execution Result
                    <Badge variant={codeOutput.success ? "default" : "destructive"} className="ml-2">
                      {codeOutput.success ? "Success" : "Error"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Output */}
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">Output:</p>
                      <pre className="text-sm bg-background border border-border rounded p-3 overflow-x-auto">
                        {codeOutput.output || "No output"}
                      </pre>
                    </div>

                    {/* Error */}
                    {codeOutput.error && (
                      <div>
                        <p className="text-sm font-medium text-destructive mb-1">Error:</p>
                        <pre className="text-sm bg-destructive/10 border border-destructive rounded p-3 overflow-x-auto text-destructive">
                          {codeOutput.error}
                        </pre>
                      </div>
                    )}

                    {/* Test Results */}
                    {codeOutput.testResults && codeOutput.testResults.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-foreground mb-2">Test Results:</p>
                        <div className="space-y-2">
                          {codeOutput.testResults.map((result: any, index: number) => (
                            <div
                              key={index}
                              className={`p-3 rounded border ${
                                result.passed
                                  ? "border-chart-2 bg-chart-2/10"
                                  : "border-destructive bg-destructive/10"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Test Case {index + 1}</span>
                                <Badge variant={result.passed ? "default" : "destructive"}>
                                  {result.passed ? "Passed" : "Failed"}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                                <div>
                                  <p className="font-medium">Input:</p>
                                  <p className="font-mono">{result.input}</p>
                                </div>
                                <div>
                                  <p className="font-medium">Expected:</p>
                                  <p className="font-mono">{result.expectedOutput}</p>
                                </div>
                                <div>
                                  <p className="font-medium">Actual:</p>
                                  <p className="font-mono">{result.actualOutput}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Execution Stats */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Execution Time: {codeOutput.executionTime || 0}ms</span>
                      {codeOutput.memoryUsed && (
                        <span>Memory Used: {codeOutput.memoryUsed}MB</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case "scenario":
        return (
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium text-foreground mb-2">Scenario</h4>
              <p className="text-foreground mb-4">{question.content?.scenario}</p>
              
              {question.description && (
                <>
                  <h4 className="font-medium text-foreground mb-2">Requirements</h4>
                  <p className="text-foreground">{question.description}</p>
                </>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium">Your Response</Label>
              <Textarea
                value={answer?.response || ""}
                onChange={(e) => onAnswerChange({ response: e.target.value })}
                placeholder="Describe your approach and solution to this scenario..."
                rows={8}
                className="mt-2"
                readOnly={readOnly}
                data-testid="textarea-scenario-response"
              />
            </div>
          </div>
        );

      case "file_upload":
        return (
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-foreground mb-2">{question.description}</p>
              {question.content?.requirements && (
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium">Requirements:</p>
                  <p>{question.content.requirements}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Upload File</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <i className="fas fa-upload text-4xl text-muted-foreground mb-4"></i>
                <p className="text-foreground mb-2">
                  Drop your file here or <Button variant="link" className="p-0">browse</Button>
                </p>
                <p className="text-sm text-muted-foreground">
                  {question.content?.allowedFileTypes?.length > 0 && (
                    <>Allowed types: {question.content.allowedFileTypes.join(", ")}</>
                  )}
                  {question.content?.maxFileSize && (
                    <> • Max size: {question.content.maxFileSize}MB</>
                  )}
                </p>
              </div>
              <Input
                type="file"
                className="hidden"
                accept={question.content?.allowedFileTypes?.join(",")}
                disabled={readOnly}
                data-testid="input-file-upload"
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">Question type not supported for display</p>
          </div>
        );
    }
  };

  return (
    <Card className="w-full" data-testid="question-display">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{question.title}</CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {question.type.replace("_", " ").toUpperCase()}
              </Badge>
              <Badge variant={
                question.difficulty === "easy" ? "secondary" :
                question.difficulty === "medium" ? "default" : "destructive"
              }>
                {question.difficulty.toUpperCase()}
              </Badge>
              {question.timeLimit && (
                <Badge variant="outline">
                  <i className="fas fa-clock mr-1"></i>
                  {question.timeLimit}min
                </Badge>
              )}
              <Badge variant="outline">
                {question.maxScore} points
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {renderQuestionContent()}
        
        {showSubmit && (
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex justify-end">
              <Button onClick={onSubmit} data-testid="button-submit-answer">
                <i className="fas fa-check mr-2"></i>
                Submit Answer
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
