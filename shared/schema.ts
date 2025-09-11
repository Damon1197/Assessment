import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Enums
export const userRoleEnum = pgEnum("user_role", ["super_admin", "sme", "manager_hr", "candidate"]);
export const questionTypeEnum = pgEnum("question_type", ["multiple_choice", "coding", "file_upload", "scenario"]);
export const difficultyLevelEnum = pgEnum("difficulty_level", ["easy", "medium", "hard"]);
export const assessmentStatusEnum = pgEnum("assessment_status", ["draft", "active", "completed", "paused"]);
export const questionStatusEnum = pgEnum("question_status", ["pending", "approved", "rejected"]);
export const submissionStatusEnum = pgEnum("submission_status", ["not_started", "in_progress", "submitted", "graded"]);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").notNull().default("candidate"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Skills and Topics
export const skills = pgTable("skills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  category: varchar("category"), // e.g., "programming", "enterprise", "technical"
  createdAt: timestamp("created_at").defaultNow(),
});

export const topics = pgTable("topics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  skillId: varchar("skill_id").references(() => skills.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Questions
export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  type: questionTypeEnum("type").notNull(),
  difficulty: difficultyLevelEnum("difficulty").notNull(),
  skillId: varchar("skill_id").references(() => skills.id),
  topicId: varchar("topic_id").references(() => topics.id),
  content: jsonb("content").notNull(), // Question-specific content
  correctAnswer: jsonb("correct_answer"), // For auto-graded questions
  maxScore: integer("max_score").default(100),
  timeLimit: integer("time_limit"), // in minutes
  isAiGenerated: boolean("is_ai_generated").default(false),
  status: questionStatusEnum("status").default("pending"),
  createdBy: varchar("created_by").references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Assessments
export const assessments = pgTable("assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  instructions: text("instructions"),
  status: assessmentStatusEnum("status").default("draft"),
  isAdaptive: boolean("is_adaptive").default(false),
  isProctored: boolean("is_proctored").default(false),
  duration: integer("duration"), // in minutes
  maxAttempts: integer("max_attempts").default(1),
  passingScore: integer("passing_score").default(70),
  scheduledStart: timestamp("scheduled_start"),
  scheduledEnd: timestamp("scheduled_end"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Assessment Questions (many-to-many with ordering)
export const assessmentQuestions = pgTable("assessment_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assessmentId: varchar("assessment_id").references(() => assessments.id),
  questionId: varchar("question_id").references(() => questions.id),
  order: integer("order").notNull(),
  weight: integer("weight").default(1), // for scoring
  isRequired: boolean("is_required").default(true),
});

// Assessment Assignments (who takes what assessment)
export const assessmentAssignments = pgTable("assessment_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assessmentId: varchar("assessment_id").references(() => assessments.id),
  candidateId: varchar("candidate_id").references(() => users.id),
  assignedBy: varchar("assigned_by").references(() => users.id),
  status: submissionStatusEnum("status").default("not_started"),
  startedAt: timestamp("started_at"),
  submittedAt: timestamp("submitted_at"),
  score: integer("score"),
  feedback: text("feedback"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Question Submissions (individual question responses)
export const questionSubmissions = pgTable("question_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: varchar("assignment_id").references(() => assessmentAssignments.id),
  questionId: varchar("question_id").references(() => questions.id),
  answer: jsonb("answer").notNull(),
  score: integer("score"),
  timeSpent: integer("time_spent"), // in seconds
  isCorrect: boolean("is_correct"),
  feedback: text("feedback"),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

// AI Generation Logs
export const aiGenerationLogs = pgTable("ai_generation_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestedBy: varchar("requested_by").references(() => users.id),
  prompt: text("prompt").notNull(),
  skillId: varchar("skill_id").references(() => skills.id),
  difficulty: difficultyLevelEnum("difficulty"),
  questionType: questionTypeEnum("question_type"),
  generatedQuestions: jsonb("generated_questions"),
  status: varchar("status").default("processing"), // processing, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const userRelations = relations(users, ({ many }) => ({
  createdQuestions: many(questions, { relationName: "createdBy" }),
  approvedQuestions: many(questions, { relationName: "approvedBy" }),
  createdAssessments: many(assessments),
  assignments: many(assessmentAssignments, { relationName: "candidate" }),
  assignedAssessments: many(assessmentAssignments, { relationName: "assignedBy" }),
  aiGenerationLogs: many(aiGenerationLogs),
}));

export const skillRelations = relations(skills, ({ many }) => ({
  topics: many(topics),
  questions: many(questions),
}));

export const topicRelations = relations(topics, ({ one, many }) => ({
  skill: one(skills, {
    fields: [topics.skillId],
    references: [skills.id],
  }),
  questions: many(questions),
}));

export const questionRelations = relations(questions, ({ one, many }) => ({
  skill: one(skills, {
    fields: [questions.skillId],
    references: [skills.id],
  }),
  topic: one(topics, {
    fields: [questions.topicId],
    references: [topics.id],
  }),
  createdBy: one(users, {
    fields: [questions.createdBy],
    references: [users.id],
    relationName: "createdBy",
  }),
  approvedBy: one(users, {
    fields: [questions.approvedBy],
    references: [users.id],
    relationName: "approvedBy",
  }),
  assessmentQuestions: many(assessmentQuestions),
  submissions: many(questionSubmissions),
}));

export const assessmentRelations = relations(assessments, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [assessments.createdBy],
    references: [users.id],
  }),
  questions: many(assessmentQuestions),
  assignments: many(assessmentAssignments),
}));

export const assessmentQuestionRelations = relations(assessmentQuestions, ({ one }) => ({
  assessment: one(assessments, {
    fields: [assessmentQuestions.assessmentId],
    references: [assessments.id],
  }),
  question: one(questions, {
    fields: [assessmentQuestions.questionId],
    references: [questions.id],
  }),
}));

export const assessmentAssignmentRelations = relations(assessmentAssignments, ({ one, many }) => ({
  assessment: one(assessments, {
    fields: [assessmentAssignments.assessmentId],
    references: [assessments.id],
  }),
  candidate: one(users, {
    fields: [assessmentAssignments.candidateId],
    references: [users.id],
    relationName: "candidate",
  }),
  assignedBy: one(users, {
    fields: [assessmentAssignments.assignedBy],
    references: [users.id],
    relationName: "assignedBy",
  }),
  submissions: many(questionSubmissions),
}));

export const questionSubmissionRelations = relations(questionSubmissions, ({ one }) => ({
  assignment: one(assessmentAssignments, {
    fields: [questionSubmissions.assignmentId],
    references: [assessmentAssignments.id],
  }),
  question: one(questions, {
    fields: [questionSubmissions.questionId],
    references: [questions.id],
  }),
}));

export const aiGenerationLogRelations = relations(aiGenerationLogs, ({ one }) => ({
  requestedBy: one(users, {
    fields: [aiGenerationLogs.requestedBy],
    references: [users.id],
  }),
  skill: one(skills, {
    fields: [aiGenerationLogs.skillId],
    references: [skills.id],
  }),
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSkillSchema = createInsertSchema(skills).omit({
  id: true,
  createdAt: true,
});

export const insertTopicSchema = createInsertSchema(topics).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAssessmentQuestionSchema = createInsertSchema(assessmentQuestions).omit({
  id: true,
});

export const insertAssessmentAssignmentSchema = createInsertSchema(assessmentAssignments).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionSubmissionSchema = createInsertSchema(questionSubmissions).omit({
  id: true,
  submittedAt: true,
});

export const insertAiGenerationLogSchema = createInsertSchema(aiGenerationLogs).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertSkill = z.infer<typeof insertSkillSchema>;
export type Skill = typeof skills.$inferSelect;
export type InsertTopic = z.infer<typeof insertTopicSchema>;
export type Topic = typeof topics.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessmentQuestion = z.infer<typeof insertAssessmentQuestionSchema>;
export type AssessmentQuestion = typeof assessmentQuestions.$inferSelect;
export type InsertAssessmentAssignment = z.infer<typeof insertAssessmentAssignmentSchema>;
export type AssessmentAssignment = typeof assessmentAssignments.$inferSelect;
export type InsertQuestionSubmission = z.infer<typeof insertQuestionSubmissionSchema>;
export type QuestionSubmission = typeof questionSubmissions.$inferSelect;
export type InsertAiGenerationLog = z.infer<typeof insertAiGenerationLogSchema>;
export type AiGenerationLog = typeof aiGenerationLogs.$inferSelect;
