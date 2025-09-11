import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export interface CodeExecutionRequest {
  code: string;
  language: string;
  testCases?: Array<{
    input: string;
    expectedOutput: string;
  }>;
  timeLimit?: number; // in seconds, default 30
  memoryLimit?: number; // in MB, default 128
}

export interface CodeExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number; // in milliseconds
  memoryUsed?: number;
  testResults?: Array<{
    input: string;
    expectedOutput: string;
    actualOutput: string;
    passed: boolean;
  }>;
}

export class CodeExecutionService {
  private readonly workingDir = "/tmp/code_execution";
  private readonly supportedLanguages = {
    python: {
      extension: "py",
      command: "python3",
      args: [],
    },
    javascript: {
      extension: "js",
      command: "node",
      args: [],
    },
    c: {
      extension: "c",
      command: "gcc",
      args: ["-o", "program", "-std=c99"],
      runCommand: "./program",
    },
    cpp: {
      extension: "cpp",
      command: "g++",
      args: ["-o", "program", "-std=c++17"],
      runCommand: "./program",
    },
  };

  constructor() {
    this.ensureWorkingDir();
  }

  private async ensureWorkingDir() {
    try {
      await fs.mkdir(this.workingDir, { recursive: true });
    } catch (error) {
      console.error("Failed to create working directory:", error);
    }
  }

  async executeCode(request: CodeExecutionRequest): Promise<CodeExecutionResult> {
    const startTime = Date.now();
    const sessionId = randomUUID();
    const sessionDir = path.join(this.workingDir, sessionId);

    try {
      // Create session directory
      await fs.mkdir(sessionDir, { recursive: true });

      const language = request.language.toLowerCase();
      const langConfig = this.supportedLanguages[language as keyof typeof this.supportedLanguages];

      if (!langConfig) {
        throw new Error(`Unsupported language: ${request.language}`);
      }

      // Write code to file
      const filename = `code.${langConfig.extension}`;
      const filePath = path.join(sessionDir, filename);
      await fs.writeFile(filePath, request.code);

      let result: CodeExecutionResult;

      if (language === "c" || language === "cpp") {
        // Compile first, then run
        result = await this.compileAndRun(langConfig, filePath, sessionDir, request);
      } else {
        // Interpret directly
        result = await this.runInterpreted(langConfig, filePath, request);
      }

      result.executionTime = Date.now() - startTime;

      // Run test cases if provided
      if (request.testCases && request.testCases.length > 0 && result.success) {
        result.testResults = await this.runTestCases(
          langConfig,
          filePath,
          sessionDir,
          request.testCases,
          language
        );
      }

      return result;

    } catch (error) {
      return {
        success: false,
        output: "",
        error: (error as Error).message,
        executionTime: Date.now() - startTime,
      };
    } finally {
      // Cleanup session directory
      try {
        await fs.rm(sessionDir, { recursive: true, force: true });
      } catch (error) {
        console.error("Failed to cleanup session directory:", error);
      }
    }
  }

  private async compileAndRun(
    langConfig: any,
    filePath: string,
    sessionDir: string,
    request: CodeExecutionRequest
  ): Promise<CodeExecutionResult> {
    // Compile
    const compileResult = await this.runCommand(
      langConfig.command,
      [...langConfig.args, filePath],
      sessionDir,
      "",
      10 // 10 second compile timeout
    );

    if (!compileResult.success) {
      return {
        success: false,
        output: compileResult.output,
        error: compileResult.error || "Compilation failed",
        executionTime: 0,
      };
    }

    // Run
    return await this.runCommand(
      langConfig.runCommand,
      [],
      sessionDir,
      "",
      request.timeLimit || 30
    );
  }

  private async runInterpreted(
    langConfig: any,
    filePath: string,
    request: CodeExecutionRequest
  ): Promise<CodeExecutionResult> {
    return await this.runCommand(
      langConfig.command,
      [...langConfig.args, filePath],
      path.dirname(filePath),
      "",
      request.timeLimit || 30
    );
  }

  private async runTestCases(
    langConfig: any,
    filePath: string,
    sessionDir: string,
    testCases: Array<{ input: string; expectedOutput: string }>,
    language: string
  ): Promise<Array<{
    input: string;
    expectedOutput: string;
    actualOutput: string;
    passed: boolean;
  }>> {
    const results = [];

    for (const testCase of testCases) {
      let runResult: CodeExecutionResult;

      if (language === "c" || language === "cpp") {
        runResult = await this.runCommand(
          "./program",
          [],
          sessionDir,
          testCase.input,
          10
        );
      } else {
        runResult = await this.runCommand(
          langConfig.command,
          [...langConfig.args, filePath],
          path.dirname(filePath),
          testCase.input,
          10
        );
      }

      const actualOutput = runResult.output.trim();
      const expectedOutput = testCase.expectedOutput.trim();
      const passed = actualOutput === expectedOutput;

      results.push({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: actualOutput,
        passed,
      });
    }

    return results;
  }

  private async runCommand(
    command: string,
    args: string[],
    workingDir: string,
    input: string = "",
    timeoutSeconds: number = 30
  ): Promise<CodeExecutionResult> {
    return new Promise((resolve) => {
      let output = "";
      let error = "";
      let timedOut = false;

      const process = spawn(command, args, {
        cwd: workingDir,
        stdio: ["pipe", "pipe", "pipe"],
      });

      const timeout = setTimeout(() => {
        timedOut = true;
        process.kill("SIGKILL");
      }, timeoutSeconds * 1000);

      process.stdout.on("data", (data) => {
        output += data.toString();
      });

      process.stderr.on("data", (data) => {
        error += data.toString();
      });

      process.on("close", (code) => {
        clearTimeout(timeout);

        if (timedOut) {
          resolve({
            success: false,
            output: output,
            error: `Process timed out after ${timeoutSeconds} seconds`,
            executionTime: timeoutSeconds * 1000,
          });
        } else {
          resolve({
            success: code === 0,
            output: output,
            error: error || undefined,
            executionTime: 0, // Will be set by caller
          });
        }
      });

      process.on("error", (err) => {
        clearTimeout(timeout);
        resolve({
          success: false,
          output: output,
          error: err.message,
          executionTime: 0,
        });
      });

      // Send input if provided
      if (input) {
        process.stdin.write(input);
      }
      process.stdin.end();
    });
  }

  async validateCode(code: string, language: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    try {
      const result = await this.executeCode({
        code,
        language,
        timeLimit: 5,
      });

      return {
        isValid: result.success,
        errors: result.error ? [result.error] : [],
        warnings: [],
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [(error as Error).message],
        warnings: [],
      };
    }
  }
}

export const codeExecutionService = new CodeExecutionService();
