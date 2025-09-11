import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import CodeEditor from "@/components/assessment/code-editor";
import Sidebar from "@/components/layout/sidebar";
import { PlayIcon, ClockIcon, CheckCircle, XCircle } from "lucide-react";

const DEFAULT_CODE = {
  python: `def hello_world():
    print("Hello, World!")
    return "Hello, World!"

hello_world()`,
  javascript: `function helloWorld() {
    console.log("Hello, World!");
    return "Hello, World!";
}

helloWorld();`,
  c: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`,
  cpp: `#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}`
};

interface TestCase {
  input: string;
  expectedOutput: string;
}

interface CodeExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
  testResults?: Array<{
    input: string;
    expectedOutput: string;
    actualOutput: string;
    passed: boolean;
  }>;
}

export default function CodeEditorPage() {
  const [language, setLanguage] = useState<keyof typeof DEFAULT_CODE>("python");
  const [code, setCode] = useState(DEFAULT_CODE[language]);
  const [testCases, setTestCases] = useState<TestCase[]>([{ input: "", expectedOutput: "" }]);
  const [timeLimit, setTimeLimit] = useState(10);
  const { toast } = useToast();

  const executeCodeMutation = useMutation({
    mutationFn: async (data: { code: string; language: string; testCases?: TestCase[]; timeLimit: number }) => {
      const response = await apiRequest("POST", "/api/code/execute", data);
      return response.json() as Promise<CodeExecutionResult>;
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Code executed successfully",
          description: `Completed in ${result.executionTime}ms`,
        });
      } else {
        toast({
          title: "Execution failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Request failed",
        description: error.message || "Failed to execute code",
        variant: "destructive",
      });
    },
  });

  const handleLanguageChange = (newLanguage: string) => {
    const lang = newLanguage as keyof typeof DEFAULT_CODE;
    setLanguage(lang);
    setCode(DEFAULT_CODE[lang]);
  };

  const handleExecute = () => {
    const validTestCases = testCases.filter(tc => tc.input.trim() || tc.expectedOutput.trim());
    executeCodeMutation.mutate({
      code,
      language,
      testCases: validTestCases.length > 0 ? validTestCases : undefined,
      timeLimit,
    });
  };

  const addTestCase = () => {
    setTestCases([...testCases, { input: "", expectedOutput: "" }]);
  };

  const updateTestCase = (index: number, field: keyof TestCase, value: string) => {
    const updated = [...testCases];
    updated[index][field] = value;
    setTestCases(updated);
  };

  const removeTestCase = (index: number) => {
    if (testCases.length > 1) {
      setTestCases(testCases.filter((_, i) => i !== index));
    }
  };

  const result = executeCodeMutation.data;

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Code Sandbox</h1>
              <p className="text-muted-foreground">Write, test, and execute code in multiple languages</p>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={language} onValueChange={handleLanguageChange} data-testid="select-language">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="c">C</SelectItem>
                  <SelectItem value="cpp">C++</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleExecute} 
                disabled={executeCodeMutation.isPending}
                data-testid="button-execute-code"
              >
                {executeCodeMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                    Running...
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-4 w-4 mr-2" />
                    Run Code
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Code Editor */}
            <Card>
              <CardHeader>
                <CardTitle>Code Editor</CardTitle>
                <CardDescription>
                  Write your {language.charAt(0).toUpperCase() + language.slice(1)} code below
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CodeEditor
                  value={code}
                  onChange={setCode}
                  language={language}
                  height="400px"
                  data-testid="editor-code"
                />
              </CardContent>
            </Card>

            {/* Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>Set execution parameters and test cases</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="timeLimit">Time Limit (seconds)</Label>
                  <Select value={timeLimit.toString()} onValueChange={(v) => setTimeLimit(parseInt(v))} data-testid="select-time-limit">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 seconds</SelectItem>
                      <SelectItem value="10">10 seconds</SelectItem>
                      <SelectItem value="15">15 seconds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Test Cases (Optional)</Label>
                    <Button variant="outline" size="sm" onClick={addTestCase} data-testid="button-add-test-case">
                      Add Test Case
                    </Button>
                  </div>
                  
                  {testCases.map((testCase, index) => (
                    <div key={index} className="border border-border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Test Case {index + 1}</span>
                        {testCases.length > 1 && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeTestCase(index)}
                            data-testid={`button-remove-test-case-${index}`}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs">Input</Label>
                        <Textarea
                          placeholder="Input for your program"
                          value={testCase.input}
                          onChange={(e) => updateTestCase(index, "input", e.target.value)}
                          className="h-16 text-sm"
                          data-testid={`textarea-test-input-${index}`}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Expected Output</Label>
                        <Textarea
                          placeholder="Expected output"
                          value={testCase.expectedOutput}
                          onChange={(e) => updateTestCase(index, "expectedOutput", e.target.value)}
                          className="h-16 text-sm"
                          data-testid={`textarea-test-output-${index}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>Execution Results</span>
                  {result.success ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Success
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Failed
                    </Badge>
                  )}
                  <Badge variant="outline">
                    <ClockIcon className="h-3 w-3 mr-1" />
                    {result.executionTime}ms
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="output" className="w-full">
                  <TabsList>
                    <TabsTrigger value="output">Output</TabsTrigger>
                    {result.error && <TabsTrigger value="error">Error</TabsTrigger>}
                    {result.testResults && <TabsTrigger value="tests">Test Results</TabsTrigger>}
                  </TabsList>
                  
                  <TabsContent value="output" className="mt-4">
                    <div className="bg-muted rounded-lg p-4">
                      <pre className="text-sm text-foreground whitespace-pre-wrap" data-testid="text-execution-output">
                        {result.output || "No output"}
                      </pre>
                    </div>
                  </TabsContent>
                  
                  {result.error && (
                    <TabsContent value="error" className="mt-4">
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                        <pre className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap" data-testid="text-execution-error">
                          {result.error}
                        </pre>
                      </div>
                    </TabsContent>
                  )}
                  
                  {result.testResults && (
                    <TabsContent value="tests" className="mt-4">
                      <div className="space-y-3">
                        {result.testResults.map((test, index) => (
                          <div 
                            key={index} 
                            className={`border rounded-lg p-3 ${
                              test.passed 
                                ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                                : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                            }`}
                            data-testid={`test-result-${index}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">Test Case {index + 1}</span>
                              <Badge variant={test.passed ? "default" : "destructive"}>
                                {test.passed ? "Passed" : "Failed"}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                              <div>
                                <Label className="text-xs font-medium">Input</Label>
                                <pre className="bg-background rounded p-2 mt-1 text-xs">{test.input || "None"}</pre>
                              </div>
                              <div>
                                <Label className="text-xs font-medium">Expected</Label>
                                <pre className="bg-background rounded p-2 mt-1 text-xs">{test.expectedOutput}</pre>
                              </div>
                              <div>
                                <Label className="text-xs font-medium">Actual</Label>
                                <pre className="bg-background rounded p-2 mt-1 text-xs">{test.actualOutput}</pre>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}