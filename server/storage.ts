import {
  users,
  skills,
  topics,
  questions,
  assessments,
  assessmentQuestions,
  assessmentAssignments,
  questionSubmissions,
  aiGenerationLogs,
  type User,
  type UpsertUser,
  type InsertSkill,
  type Skill,
  type InsertTopic,
  type Topic,
  type InsertQuestion,
  type Question,
  type InsertAssessment,
  type Assessment,
  type InsertAssessmentQuestion,
  type AssessmentQuestion,
  type InsertAssessmentAssignment,
  type AssessmentAssignment,
  type InsertQuestionSubmission,
  type QuestionSubmission,
  type InsertAiGenerationLog,
  type AiGenerationLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, ilike, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Skills operations
  getSkills(): Promise<Skill[]>;
  createSkill(skill: InsertSkill): Promise<Skill>;
  getSkillById(id: string): Promise<Skill | undefined>;

  // Topics operations
  getTopicsBySkill(skillId: string): Promise<Topic[]>;
  createTopic(topic: InsertTopic): Promise<Topic>;

  // Questions operations
  getQuestions(filters?: {
    skillId?: string;
    topicId?: string;
    difficulty?: string;
    type?: string;
    status?: string;
    createdBy?: string;
  }): Promise<(Question & { skill?: Skill; topic?: Topic; createdBy?: User })[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: string, updates: Partial<InsertQuestion>): Promise<Question>;
  getQuestionById(id: string): Promise<Question | undefined>;
  approveQuestion(id: string, approvedBy: string): Promise<Question>;
  rejectQuestion(id: string): Promise<Question>;

  // Assessments operations
  getAssessments(filters?: {
    status?: string;
    createdBy?: string;
  }): Promise<(Assessment & { createdBy?: User })[]>;
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  updateAssessment(id: string, updates: Partial<InsertAssessment>): Promise<Assessment>;
  getAssessmentById(id: string): Promise<Assessment | undefined>;
  getAssessmentWithQuestions(id: string): Promise<Assessment & {
    questions: (AssessmentQuestion & { question: Question })[];
  } | undefined>;

  // Assessment Questions operations
  addQuestionToAssessment(assessmentQuestion: InsertAssessmentQuestion): Promise<AssessmentQuestion>;
  removeQuestionFromAssessment(assessmentId: string, questionId: string): Promise<void>;

  // Assessment Assignments operations
  getAssignments(filters?: {
    candidateId?: string;
    assessmentId?: string;
    status?: string;
  }): Promise<(AssessmentAssignment & { 
    assessment?: Assessment; 
    candidate?: User; 
    assignedBy?: User;
  })[]>;
  createAssignment(assignment: InsertAssessmentAssignment): Promise<AssessmentAssignment>;
  updateAssignment(id: string, updates: Partial<InsertAssessmentAssignment>): Promise<AssessmentAssignment>;

  // Question Submissions operations
  getSubmissions(assignmentId: string): Promise<QuestionSubmission[]>;
  createSubmission(submission: InsertQuestionSubmission): Promise<QuestionSubmission>;
  updateSubmission(id: string, updates: Partial<InsertQuestionSubmission>): Promise<QuestionSubmission>;

  // AI Generation operations
  createAiGenerationLog(log: InsertAiGenerationLog): Promise<AiGenerationLog>;
  getAiGenerationLogs(userId?: string): Promise<AiGenerationLog[]>;

  // Analytics operations
  getAssessmentStats(): Promise<{
    totalAssessments: number;
    activeAssessments: number;
    completedAssessments: number;
  }>;
  getQuestionStats(): Promise<{
    totalQuestions: number;
    approvedQuestions: number;
    pendingQuestions: number;
    aiGeneratedQuestions: number;
  }>;
  getUserStats(): Promise<{
    totalUsers: number;
    candidates: number;
    smes: number;
    managers: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Skills operations
  async getSkills(): Promise<Skill[]> {
    return await db.select().from(skills).orderBy(skills.name);
  }

  async createSkill(skill: InsertSkill): Promise<Skill> {
    const [newSkill] = await db.insert(skills).values(skill).returning();
    return newSkill;
  }

  async getSkillById(id: string): Promise<Skill | undefined> {
    const [skill] = await db.select().from(skills).where(eq(skills.id, id));
    return skill;
  }

  // Topics operations
  async getTopicsBySkill(skillId: string): Promise<Topic[]> {
    return await db.select().from(topics).where(eq(topics.skillId, skillId)).orderBy(topics.name);
  }

  async createTopic(topic: InsertTopic): Promise<Topic> {
    const [newTopic] = await db.insert(topics).values(topic).returning();
    return newTopic;
  }

  // Questions operations
  async getQuestions(filters?: {
    skillId?: string;
    topicId?: string;
    difficulty?: string;
    type?: string;
    status?: string;
    createdBy?: string;
  }): Promise<(Question & { skill?: Skill; topic?: Topic; createdBy?: User })[]> {
    let query = db
      .select()
      .from(questions)
      .leftJoin(skills, eq(questions.skillId, skills.id))
      .leftJoin(topics, eq(questions.topicId, topics.id))
      .leftJoin(users, eq(questions.createdBy, users.id));

    const conditions = [];
    if (filters?.skillId) conditions.push(eq(questions.skillId, filters.skillId));
    if (filters?.topicId) conditions.push(eq(questions.topicId, filters.topicId));
    if (filters?.difficulty) conditions.push(eq(questions.difficulty, filters.difficulty as any));
    if (filters?.type) conditions.push(eq(questions.type, filters.type as any));
    if (filters?.status) conditions.push(eq(questions.status, filters.status as any));
    if (filters?.createdBy) conditions.push(eq(questions.createdBy, filters.createdBy));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(questions.createdAt));
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [newQuestion] = await db.insert(questions).values(question).returning();
    return newQuestion;
  }

  async updateQuestion(id: string, updates: Partial<InsertQuestion>): Promise<Question> {
    const [updatedQuestion] = await db
      .update(questions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(questions.id, id))
      .returning();
    return updatedQuestion;
  }

  async getQuestionById(id: string): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question;
  }

  async approveQuestion(id: string, approvedBy: string): Promise<Question> {
    const [question] = await db
      .update(questions)
      .set({ status: "approved", approvedBy, updatedAt: new Date() })
      .where(eq(questions.id, id))
      .returning();
    return question;
  }

  async rejectQuestion(id: string): Promise<Question> {
    const [question] = await db
      .update(questions)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(eq(questions.id, id))
      .returning();
    return question;
  }

  // Assessments operations
  async getAssessments(filters?: {
    status?: string;
    createdBy?: string;
  }): Promise<(Assessment & { createdBy?: User })[]> {
    let query = db
      .select()
      .from(assessments)
      .leftJoin(users, eq(assessments.createdBy, users.id));

    const conditions = [];
    if (filters?.status) conditions.push(eq(assessments.status, filters.status as any));
    if (filters?.createdBy) conditions.push(eq(assessments.createdBy, filters.createdBy));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(assessments.createdAt));
  }

  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const [newAssessment] = await db.insert(assessments).values(assessment).returning();
    return newAssessment;
  }

  async updateAssessment(id: string, updates: Partial<InsertAssessment>): Promise<Assessment> {
    const [updatedAssessment] = await db
      .update(assessments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(assessments.id, id))
      .returning();
    return updatedAssessment;
  }

  async getAssessmentById(id: string): Promise<Assessment | undefined> {
    const [assessment] = await db.select().from(assessments).where(eq(assessments.id, id));
    return assessment;
  }

  async getAssessmentWithQuestions(id: string): Promise<Assessment & {
    questions: (AssessmentQuestion & { question: Question })[];
  } | undefined> {
    const assessment = await this.getAssessmentById(id);
    if (!assessment) return undefined;

    const questionsData = await db
      .select()
      .from(assessmentQuestions)
      .leftJoin(questions, eq(assessmentQuestions.questionId, questions.id))
      .where(eq(assessmentQuestions.assessmentId, id))
      .orderBy(assessmentQuestions.order);

    return {
      ...assessment,
      questions: questionsData,
    };
  }

  // Assessment Questions operations
  async addQuestionToAssessment(assessmentQuestion: InsertAssessmentQuestion): Promise<AssessmentQuestion> {
    const [newAssessmentQuestion] = await db.insert(assessmentQuestions).values(assessmentQuestion).returning();
    return newAssessmentQuestion;
  }

  async removeQuestionFromAssessment(assessmentId: string, questionId: string): Promise<void> {
    await db
      .delete(assessmentQuestions)
      .where(
        and(
          eq(assessmentQuestions.assessmentId, assessmentId),
          eq(assessmentQuestions.questionId, questionId)
        )
      );
  }

  // Assessment Assignments operations
  async getAssignments(filters?: {
    candidateId?: string;
    assessmentId?: string;
    status?: string;
  }): Promise<(AssessmentAssignment & { 
    assessment?: Assessment; 
    candidate?: User; 
    assignedBy?: User;
  })[]> {
    let query = db
      .select()
      .from(assessmentAssignments)
      .leftJoin(assessments, eq(assessmentAssignments.assessmentId, assessments.id))
      .leftJoin(users, eq(assessmentAssignments.candidateId, users.id));

    const conditions = [];
    if (filters?.candidateId) conditions.push(eq(assessmentAssignments.candidateId, filters.candidateId));
    if (filters?.assessmentId) conditions.push(eq(assessmentAssignments.assessmentId, filters.assessmentId));
    if (filters?.status) conditions.push(eq(assessmentAssignments.status, filters.status as any));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(assessmentAssignments.createdAt));
  }

  async createAssignment(assignment: InsertAssessmentAssignment): Promise<AssessmentAssignment> {
    const [newAssignment] = await db.insert(assessmentAssignments).values(assignment).returning();
    return newAssignment;
  }

  async updateAssignment(id: string, updates: Partial<InsertAssessmentAssignment>): Promise<AssessmentAssignment> {
    const [updatedAssignment] = await db
      .update(assessmentAssignments)
      .set(updates)
      .where(eq(assessmentAssignments.id, id))
      .returning();
    return updatedAssignment;
  }

  // Question Submissions operations
  async getSubmissions(assignmentId: string): Promise<QuestionSubmission[]> {
    return await db
      .select()
      .from(questionSubmissions)
      .where(eq(questionSubmissions.assignmentId, assignmentId))
      .orderBy(questionSubmissions.submittedAt);
  }

  async createSubmission(submission: InsertQuestionSubmission): Promise<QuestionSubmission> {
    const [newSubmission] = await db.insert(questionSubmissions).values(submission).returning();
    return newSubmission;
  }

  async updateSubmission(id: string, updates: Partial<InsertQuestionSubmission>): Promise<QuestionSubmission> {
    const [updatedSubmission] = await db
      .update(questionSubmissions)
      .set(updates)
      .where(eq(questionSubmissions.id, id))
      .returning();
    return updatedSubmission;
  }

  // AI Generation operations
  async createAiGenerationLog(log: InsertAiGenerationLog): Promise<AiGenerationLog> {
    const [newLog] = await db.insert(aiGenerationLogs).values(log).returning();
    return newLog;
  }

  async getAiGenerationLogs(userId?: string): Promise<AiGenerationLog[]> {
    let query = db.select().from(aiGenerationLogs);
    
    if (userId) {
      query = query.where(eq(aiGenerationLogs.requestedBy, userId));
    }

    return await query.orderBy(desc(aiGenerationLogs.createdAt));
  }

  // Analytics operations
  async getAssessmentStats(): Promise<{
    totalAssessments: number;
    activeAssessments: number;
    completedAssessments: number;
  }> {
    const total = await db.select({ count: sql<number>`count(*)` }).from(assessments);
    const active = await db.select({ count: sql<number>`count(*)` }).from(assessments).where(eq(assessments.status, "active"));
    const completed = await db.select({ count: sql<number>`count(*)` }).from(assessments).where(eq(assessments.status, "completed"));

    return {
      totalAssessments: total[0]?.count || 0,
      activeAssessments: active[0]?.count || 0,
      completedAssessments: completed[0]?.count || 0,
    };
  }

  async getQuestionStats(): Promise<{
    totalQuestions: number;
    approvedQuestions: number;
    pendingQuestions: number;
    aiGeneratedQuestions: number;
  }> {
    const total = await db.select({ count: sql<number>`count(*)` }).from(questions);
    const approved = await db.select({ count: sql<number>`count(*)` }).from(questions).where(eq(questions.status, "approved"));
    const pending = await db.select({ count: sql<number>`count(*)` }).from(questions).where(eq(questions.status, "pending"));
    const aiGenerated = await db.select({ count: sql<number>`count(*)` }).from(questions).where(eq(questions.isAiGenerated, true));

    return {
      totalQuestions: total[0]?.count || 0,
      approvedQuestions: approved[0]?.count || 0,
      pendingQuestions: pending[0]?.count || 0,
      aiGeneratedQuestions: aiGenerated[0]?.count || 0,
    };
  }

  async getUserStats(): Promise<{
    totalUsers: number;
    candidates: number;
    smes: number;
    managers: number;
  }> {
    const total = await db.select({ count: sql<number>`count(*)` }).from(users);
    const candidates = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, "candidate"));
    const smes = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, "sme"));
    const managers = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, "manager_hr"));

    return {
      totalUsers: total[0]?.count || 0,
      candidates: candidates[0]?.count || 0,
      smes: smes[0]?.count || 0,
      managers: managers[0]?.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();
