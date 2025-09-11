import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateQuestions, improveQuestionQuality, generateQuestionFeedback } from "./services/gemini";
import { codeExecutionService } from "./services/codeExecution";
import { ProctoringService } from "./services/proctoring";
import {
  insertSkillSchema,
  insertTopicSchema,
  insertQuestionSchema,
  insertAssessmentSchema,
  insertAssessmentQuestionSchema,
  insertAssessmentAssignmentSchema,
  insertQuestionSubmissionSchema,
  insertAiGenerationLogSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Skills routes
  app.get('/api/skills', isAuthenticated, async (req, res) => {
    try {
      const skills = await storage.getSkills();
      res.json(skills);
    } catch (error) {
      console.error("Error fetching skills:", error);
      res.status(500).json({ message: "Failed to fetch skills" });
    }
  });

  app.post('/api/skills', isAuthenticated, async (req: any, res) => {
    try {
      const userRole = req.user.claims.role || 'candidate';
      if (!['super_admin', 'sme'].includes(userRole)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const skillData = insertSkillSchema.parse(req.body);
      const skill = await storage.createSkill(skillData);
      res.json(skill);
    } catch (error) {
      console.error("Error creating skill:", error);
      res.status(500).json({ message: "Failed to create skill" });
    }
  });

  app.get('/api/skills/:skillId/topics', isAuthenticated, async (req, res) => {
    try {
      const topics = await storage.getTopicsBySkill(req.params.skillId);
      res.json(topics);
    } catch (error) {
      console.error("Error fetching topics:", error);
      res.status(500).json({ message: "Failed to fetch topics" });
    }
  });

  app.post('/api/topics', isAuthenticated, async (req: any, res) => {
    try {
      const userRole = req.user.claims.role || 'candidate';
      if (!['super_admin', 'sme'].includes(userRole)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const topicData = insertTopicSchema.parse(req.body);
      const topic = await storage.createTopic(topicData);
      res.json(topic);
    } catch (error) {
      console.error("Error creating topic:", error);
      res.status(500).json({ message: "Failed to create topic" });
    }
  });

  // Questions routes
  app.get('/api/questions', isAuthenticated, async (req, res) => {
    try {
      const filters = {
        skillId: req.query.skillId as string,
        topicId: req.query.topicId as string,
        difficulty: req.query.difficulty as string,
        type: req.query.type as string,
        status: req.query.status as string,
        createdBy: req.query.createdBy as string,
      };

      // Remove undefined filters
      Object.keys(filters).forEach(key => {
        if (!filters[key as keyof typeof filters]) {
          delete filters[key as keyof typeof filters];
        }
      });

      const questions = await storage.getQuestions(filters);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.post('/api/questions', isAuthenticated, async (req: any, res) => {
    try {
      const userRole = req.user.claims.role || 'candidate';
      if (!['super_admin', 'sme'].includes(userRole)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const questionData = insertQuestionSchema.parse({
        ...req.body,
        createdBy: req.user.claims.sub,
      });
      
      const question = await storage.createQuestion(questionData);
      res.json(question);
    } catch (error) {
      console.error("Error creating question:", error);
      res.status(500).json({ message: "Failed to create question" });
    }
  });

  app.put('/api/questions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userRole = req.user.claims.role || 'candidate';
      if (!['super_admin', 'sme'].includes(userRole)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const question = await storage.updateQuestion(req.params.id, req.body);
      res.json(question);
    } catch (error) {
      console.error("Error updating question:", error);
      res.status(500).json({ message: "Failed to update question" });
    }
  });

  app.post('/api/questions/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const userRole = req.user.claims.role || 'candidate';
      if (userRole !== 'super_admin') {
        return res.status(403).json({ message: "Only Super Admin can approve questions" });
      }

      const question = await storage.approveQuestion(req.params.id, req.user.claims.sub);
      res.json(question);
    } catch (error) {
      console.error("Error approving question:", error);
      res.status(500).json({ message: "Failed to approve question" });
    }
  });

  app.post('/api/questions/:id/reject', isAuthenticated, async (req: any, res) => {
    try {
      const userRole = req.user.claims.role || 'candidate';
      if (userRole !== 'super_admin') {
        return res.status(403).json({ message: "Only Super Admin can reject questions" });
      }

      const question = await storage.rejectQuestion(req.params.id);
      res.json(question);
    } catch (error) {
      console.error("Error rejecting question:", error);
      res.status(500).json({ message: "Failed to reject question" });
    }
  });

  // AI Question Generation routes
  app.post('/api/questions/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userRole = req.user.claims.role || 'candidate';
      if (!['super_admin', 'sme'].includes(userRole)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { skill, topic, difficulty, questionType, count, context } = req.body;

      // Log the generation request
      const logData = insertAiGenerationLogSchema.parse({
        requestedBy: req.user.claims.sub,
        prompt: `Generate ${count} ${questionType} questions for ${skill} (${difficulty})`,
        skillId: req.body.skillId,
        difficulty,
        questionType,
        status: "processing",
      });

      const log = await storage.createAiGenerationLog(logData);

      try {
        const generatedQuestions = await generateQuestions({
          skill,
          topic,
          difficulty,
          questionType,
          count,
          context,
        });

        // Update log with results
        await storage.createAiGenerationLog({
          ...logData,
          generatedQuestions,
          status: "completed",
        });

        res.json({ questions: generatedQuestions, logId: log.id });
      } catch (error) {
        // Update log with error
        await storage.createAiGenerationLog({
          ...logData,
          status: "failed",
        });
        throw error;
      }
    } catch (error) {
      console.error("Error generating questions:", error);
      res.status(500).json({ message: "Failed to generate questions" });
    }
  });

  app.post('/api/questions/:id/improve', isAuthenticated, async (req: any, res) => {
    try {
      const userRole = req.user.claims.role || 'candidate';
      if (!['super_admin', 'sme'].includes(userRole)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const question = await storage.getQuestionById(req.params.id);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      const improvedQuestion = await improveQuestionQuality(question);
      res.json(improvedQuestion);
    } catch (error) {
      console.error("Error improving question:", error);
      res.status(500).json({ message: "Failed to improve question" });
    }
  });

  // Assessments routes
  app.get('/api/assessments', isAuthenticated, async (req: any, res) => {
    try {
      const userRole = req.user.claims.role || 'candidate';
      const filters: any = {
        status: req.query.status as string,
      };

      // Role-based filtering
      if (userRole === 'candidate') {
        // Candidates only see their assigned assessments
        const assignments = await storage.getAssignments({ candidateId: req.user.claims.sub });
        return res.json(assignments);
      } else if (userRole === 'manager_hr') {
        // Managers see assessments they created
        filters.createdBy = req.user.claims.sub;
      }
      // Super admins and SMEs see all assessments

      const assessments = await storage.getAssessments(filters);
      res.json(assessments);
    } catch (error) {
      console.error("Error fetching assessments:", error);
      res.status(500).json({ message: "Failed to fetch assessments" });
    }
  });

  app.post('/api/assessments', isAuthenticated, async (req: any, res) => {
    try {
      const userRole = req.user.claims.role || 'candidate';
      if (!['super_admin', 'manager_hr'].includes(userRole)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const assessmentData = insertAssessmentSchema.parse({
        ...req.body,
        createdBy: req.user.claims.sub,
      });

      const assessment = await storage.createAssessment(assessmentData);
      res.json(assessment);
    } catch (error) {
      console.error("Error creating assessment:", error);
      res.status(500).json({ message: "Failed to create assessment" });
    }
  });

  app.get('/api/assessments/:id', isAuthenticated, async (req, res) => {
    try {
      const assessment = await storage.getAssessmentWithQuestions(req.params.id);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      res.json(assessment);
    } catch (error) {
      console.error("Error fetching assessment:", error);
      res.status(500).json({ message: "Failed to fetch assessment" });
    }
  });

  app.put('/api/assessments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userRole = req.user.claims.role || 'candidate';
      if (!['super_admin', 'manager_hr'].includes(userRole)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const assessment = await storage.updateAssessment(req.params.id, req.body);
      res.json(assessment);
    } catch (error) {
      console.error("Error updating assessment:", error);
      res.status(500).json({ message: "Failed to update assessment" });
    }
  });

  app.post('/api/assessments/:id/questions', isAuthenticated, async (req: any, res) => {
    try {
      const userRole = req.user.claims.role || 'candidate';
      if (!['super_admin', 'manager_hr'].includes(userRole)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const assessmentQuestionData = insertAssessmentQuestionSchema.parse({
        assessmentId: req.params.id,
        ...req.body,
      });

      const assessmentQuestion = await storage.addQuestionToAssessment(assessmentQuestionData);
      res.json(assessmentQuestion);
    } catch (error) {
      console.error("Error adding question to assessment:", error);
      res.status(500).json({ message: "Failed to add question to assessment" });
    }
  });

  // Assessment Assignments routes
  app.post('/api/assignments', isAuthenticated, async (req: any, res) => {
    try {
      const userRole = req.user.claims.role || 'candidate';
      if (!['super_admin', 'manager_hr'].includes(userRole)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const assignmentData = insertAssessmentAssignmentSchema.parse({
        ...req.body,
        assignedBy: req.user.claims.sub,
      });

      const assignment = await storage.createAssignment(assignmentData);
      res.json(assignment);
    } catch (error) {
      console.error("Error creating assignment:", error);
      res.status(500).json({ message: "Failed to create assignment" });
    }
  });

  app.get('/api/assignments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const assignments = await storage.getAssignments({ candidateId: req.params.id });
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  app.put('/api/assignments/:id/start', isAuthenticated, async (req: any, res) => {
    try {
      const assignment = await storage.updateAssignment(req.params.id, {
        status: "in_progress",
        startedAt: new Date(),
      });
      res.json(assignment);
    } catch (error) {
      console.error("Error starting assignment:", error);
      res.status(500).json({ message: "Failed to start assignment" });
    }
  });

  app.put('/api/assignments/:id/submit', isAuthenticated, async (req: any, res) => {
    try {
      const assignment = await storage.updateAssignment(req.params.id, {
        status: "submitted",
        submittedAt: new Date(),
      });
      res.json(assignment);
    } catch (error) {
      console.error("Error submitting assignment:", error);
      res.status(500).json({ message: "Failed to submit assignment" });
    }
  });

  // Question Submissions routes
  app.get('/api/assignments/:assignmentId/submissions', isAuthenticated, async (req, res) => {
    try {
      const submissions = await storage.getSubmissions(req.params.assignmentId);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  app.post('/api/submissions', isAuthenticated, async (req: any, res) => {
    try {
      const submissionData = insertQuestionSubmissionSchema.parse(req.body);
      const submission = await storage.createSubmission(submissionData);

      // Generate AI feedback for the submission if it's a complex question type
      const question = await storage.getQuestionById(submission.questionId!);
      if (question && ['coding', 'scenario'].includes(question.type)) {
        try {
          const feedback = await generateQuestionFeedback(
            question,
            submission.answer,
            submission.isCorrect || false
          );
          
          await storage.updateSubmission(submission.id, { feedback });
        } catch (error) {
          console.error("Error generating feedback:", error);
        }
      }

      res.json(submission);
    } catch (error) {
      console.error("Error creating submission:", error);
      res.status(500).json({ message: "Failed to create submission" });
    }
  });

  // Code Execution routes
  app.post('/api/code/execute', isAuthenticated, async (req, res) => {
    try {
      const { code, language, testCases, timeLimit, memoryLimit } = req.body;

      const result = await codeExecutionService.executeCode({
        code,
        language,
        testCases,
        timeLimit,
        memoryLimit,
      });

      res.json(result);
    } catch (error) {
      console.error("Error executing code:", error);
      res.status(500).json({ message: "Failed to execute code" });
    }
  });

  app.post('/api/code/validate', isAuthenticated, async (req, res) => {
    try {
      const { code, language } = req.body;
      const result = await codeExecutionService.validateCode(code, language);
      res.json(result);
    } catch (error) {
      console.error("Error validating code:", error);
      res.status(500).json({ message: "Failed to validate code" });
    }
  });

  // Analytics routes
  app.get('/api/analytics/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userRole = req.user.claims.role || 'candidate';
      if (userRole !== 'super_admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const [assessmentStats, questionStats, userStats] = await Promise.all([
        storage.getAssessmentStats(),
        storage.getQuestionStats(),
        storage.getUserStats(),
      ]);

      res.json({
        assessments: assessmentStats,
        questions: questionStats,
        users: userStats,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get('/api/analytics/ai-logs', isAuthenticated, async (req: any, res) => {
    try {
      const userRole = req.user.claims.role || 'candidate';
      if (!['super_admin', 'sme'].includes(userRole)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const userId = userRole === 'sme' ? req.user.claims.sub : undefined;
      const logs = await storage.getAiGenerationLogs(userId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching AI logs:", error);
      res.status(500).json({ message: "Failed to fetch AI logs" });
    }
  });

  // Code execution endpoint
  const codeExecutionSchema = z.object({
    code: z.string().min(1, "Code is required"),
    language: z.enum(["python", "javascript", "c", "cpp"]),
    testCases: z.array(z.object({
      input: z.string(),
      expectedOutput: z.string(),
    })).optional(),
    timeLimit: z.number().min(1).max(15).optional().default(10), // Max 15 seconds for security
  });

  app.post('/api/code/execute', isAuthenticated, async (req: any, res) => {
    try {
      const requestData = codeExecutionSchema.parse(req.body);
      const result = await codeExecutionService.executeCode(requestData);
      res.json(result);
    } catch (error) {
      console.error("Code execution error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to execute code", error: (error as Error).message });
      }
    }
  });

  // Admin dashboard routes for proctoring
  app.get('/api/proctoring/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userRole = req.user.claims.role || 'candidate';
      if (!['super_admin', 'manager_hr', 'sme'].includes(userRole)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      
      const sessions = ProctoringService.getAllActiveSessions();
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching proctoring sessions:", error);
      res.status(500).json({ message: 'Failed to fetch sessions' });
    }
  });

  app.get('/api/proctoring/violations', isAuthenticated, async (req: any, res) => {
    try {
      const userRole = req.user.claims.role || 'candidate';
      if (!['super_admin', 'manager_hr', 'sme'].includes(userRole)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      
      const violations = ProctoringService.getAllViolations();
      res.json(violations);
    } catch (error) {
      console.error("Error fetching violations:", error);
      res.status(500).json({ message: 'Failed to fetch violations' });
    }
  });

  // Proctoring API routes
  app.post('/api/proctoring/start', isAuthenticated, async (req: any, res) => {
    try {
      const { assignmentId } = req.body;
      const candidateId = req.user.claims.sub;
      
      if (!assignmentId) {
        return res.status(400).json({ message: "Assignment ID is required" });
      }
      
      const session = await ProctoringService.startProctoringSession(assignmentId, candidateId);
      res.json({ sessionId: session.id, session });
    } catch (error) {
      console.error("Error starting proctoring session:", error);
      res.status(500).json({ message: "Failed to start proctoring session" });
    }
  });

  app.post('/api/proctoring/:sessionId/end', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      await ProctoringService.endProctoringSession(sessionId);
      res.json({ message: "Proctoring session ended successfully" });
    } catch (error) {
      console.error("Error ending proctoring session:", error);
      res.status(500).json({ message: "Failed to end proctoring session" });
    }
  });

  app.post('/api/proctoring/:sessionId/analyze-frame', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const { imageData } = req.body;
      
      if (!imageData) {
        return res.status(400).json({ message: "Image data is required" });
      }
      
      const result = await ProctoringService.analyzeWebcamFrame(sessionId, imageData);
      res.json(result);
    } catch (error) {
      console.error("Error analyzing webcam frame:", error);
      res.status(500).json({ message: "Failed to analyze webcam frame" });
    }
  });

  app.post('/api/proctoring/:sessionId/report-event', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const { eventType, details } = req.body;
      
      await ProctoringService.reportBrowserEvent(sessionId, eventType, details);
      res.json({ message: "Event reported successfully" });
    } catch (error) {
      console.error("Error reporting browser event:", error);
      res.status(500).json({ message: "Failed to report event" });
    }
  });

  app.get('/api/proctoring/:sessionId/status', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const session = ProctoringService.getSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Proctoring session not found" });
      }
      
      res.json(session);
    } catch (error) {
      console.error("Error getting proctoring status:", error);
      res.status(500).json({ message: "Failed to get proctoring status" });
    }
  });

  app.get('/api/proctoring/:sessionId/violations', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const violations = ProctoringService.getViolations(sessionId);
      res.json(violations);
    } catch (error) {
      console.error("Error getting violations:", error);
      res.status(500).json({ message: "Failed to get violations" });
    }
  });

  app.post('/api/proctoring/check-plagiarism', isAuthenticated, async (req: any, res) => {
    try {
      const { code, language, questionId } = req.body;
      
      if (!code || !language) {
        return res.status(400).json({ message: "Code and language are required" });
      }
      
      const result = await ProctoringService.detectPlagiarism(code, language, questionId);
      res.json(result);
    } catch (error) {
      console.error("Error checking plagiarism:", error);
      res.status(500).json({ message: "Failed to check plagiarism" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
