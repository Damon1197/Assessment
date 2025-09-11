var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  aiGenerationLogRelations: () => aiGenerationLogRelations,
  aiGenerationLogs: () => aiGenerationLogs,
  assessmentAssignmentRelations: () => assessmentAssignmentRelations,
  assessmentAssignments: () => assessmentAssignments,
  assessmentQuestionRelations: () => assessmentQuestionRelations,
  assessmentQuestions: () => assessmentQuestions,
  assessmentRelations: () => assessmentRelations,
  assessmentStatusEnum: () => assessmentStatusEnum,
  assessments: () => assessments,
  difficultyLevelEnum: () => difficultyLevelEnum,
  insertAiGenerationLogSchema: () => insertAiGenerationLogSchema,
  insertAssessmentAssignmentSchema: () => insertAssessmentAssignmentSchema,
  insertAssessmentQuestionSchema: () => insertAssessmentQuestionSchema,
  insertAssessmentSchema: () => insertAssessmentSchema,
  insertQuestionSchema: () => insertQuestionSchema,
  insertQuestionSubmissionSchema: () => insertQuestionSubmissionSchema,
  insertSkillSchema: () => insertSkillSchema,
  insertTopicSchema: () => insertTopicSchema,
  insertUserSchema: () => insertUserSchema,
  questionRelations: () => questionRelations,
  questionStatusEnum: () => questionStatusEnum,
  questionSubmissionRelations: () => questionSubmissionRelations,
  questionSubmissions: () => questionSubmissions,
  questionTypeEnum: () => questionTypeEnum,
  questions: () => questions,
  sessions: () => sessions,
  skillRelations: () => skillRelations,
  skills: () => skills,
  submissionStatusEnum: () => submissionStatusEnum,
  topicRelations: () => topicRelations,
  topics: () => topics,
  userRelations: () => userRelations,
  userRoleEnum: () => userRoleEnum,
  users: () => users
});
import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  pgEnum
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var userRoleEnum = pgEnum("user_role", ["super_admin", "sme", "manager_hr", "candidate"]);
var questionTypeEnum = pgEnum("question_type", ["multiple_choice", "coding", "file_upload", "scenario"]);
var difficultyLevelEnum = pgEnum("difficulty_level", ["easy", "medium", "hard"]);
var assessmentStatusEnum = pgEnum("assessment_status", ["draft", "active", "completed", "paused"]);
var questionStatusEnum = pgEnum("question_status", ["pending", "approved", "rejected"]);
var submissionStatusEnum = pgEnum("submission_status", ["not_started", "in_progress", "submitted", "graded"]);
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").notNull().default("candidate"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var skills = pgTable("skills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  category: varchar("category"),
  // e.g., "programming", "enterprise", "technical"
  createdAt: timestamp("created_at").defaultNow()
});
var topics = pgTable("topics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  skillId: varchar("skill_id").references(() => skills.id),
  createdAt: timestamp("created_at").defaultNow()
});
var questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  type: questionTypeEnum("type").notNull(),
  difficulty: difficultyLevelEnum("difficulty").notNull(),
  skillId: varchar("skill_id").references(() => skills.id),
  topicId: varchar("topic_id").references(() => topics.id),
  content: jsonb("content").notNull(),
  // Question-specific content
  correctAnswer: jsonb("correct_answer"),
  // For auto-graded questions
  maxScore: integer("max_score").default(100),
  timeLimit: integer("time_limit"),
  // in minutes
  isAiGenerated: boolean("is_ai_generated").default(false),
  status: questionStatusEnum("status").default("pending"),
  createdBy: varchar("created_by").references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var assessments = pgTable("assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  instructions: text("instructions"),
  status: assessmentStatusEnum("status").default("draft"),
  isAdaptive: boolean("is_adaptive").default(false),
  isProctored: boolean("is_proctored").default(false),
  duration: integer("duration"),
  // in minutes
  maxAttempts: integer("max_attempts").default(1),
  passingScore: integer("passing_score").default(70),
  scheduledStart: timestamp("scheduled_start"),
  scheduledEnd: timestamp("scheduled_end"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var assessmentQuestions = pgTable("assessment_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assessmentId: varchar("assessment_id").references(() => assessments.id),
  questionId: varchar("question_id").references(() => questions.id),
  order: integer("order").notNull(),
  weight: integer("weight").default(1),
  // for scoring
  isRequired: boolean("is_required").default(true)
});
var assessmentAssignments = pgTable("assessment_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assessmentId: varchar("assessment_id").references(() => assessments.id),
  candidateId: varchar("candidate_id").references(() => users.id),
  assignedBy: varchar("assigned_by").references(() => users.id),
  status: submissionStatusEnum("status").default("not_started"),
  startedAt: timestamp("started_at"),
  submittedAt: timestamp("submitted_at"),
  score: integer("score"),
  feedback: text("feedback"),
  createdAt: timestamp("created_at").defaultNow()
});
var questionSubmissions = pgTable("question_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: varchar("assignment_id").references(() => assessmentAssignments.id),
  questionId: varchar("question_id").references(() => questions.id),
  answer: jsonb("answer").notNull(),
  score: integer("score"),
  timeSpent: integer("time_spent"),
  // in seconds
  isCorrect: boolean("is_correct"),
  feedback: text("feedback"),
  submittedAt: timestamp("submitted_at").defaultNow()
});
var aiGenerationLogs = pgTable("ai_generation_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestedBy: varchar("requested_by").references(() => users.id),
  prompt: text("prompt").notNull(),
  skillId: varchar("skill_id").references(() => skills.id),
  difficulty: difficultyLevelEnum("difficulty"),
  questionType: questionTypeEnum("question_type"),
  generatedQuestions: jsonb("generated_questions"),
  status: varchar("status").default("processing"),
  // processing, completed, failed
  createdAt: timestamp("created_at").defaultNow()
});
var userRelations = relations(users, ({ many }) => ({
  createdQuestions: many(questions, { relationName: "createdBy" }),
  approvedQuestions: many(questions, { relationName: "approvedBy" }),
  createdAssessments: many(assessments),
  assignments: many(assessmentAssignments, { relationName: "candidate" }),
  assignedAssessments: many(assessmentAssignments, { relationName: "assignedBy" }),
  aiGenerationLogs: many(aiGenerationLogs)
}));
var skillRelations = relations(skills, ({ many }) => ({
  topics: many(topics),
  questions: many(questions)
}));
var topicRelations = relations(topics, ({ one, many }) => ({
  skill: one(skills, {
    fields: [topics.skillId],
    references: [skills.id]
  }),
  questions: many(questions)
}));
var questionRelations = relations(questions, ({ one, many }) => ({
  skill: one(skills, {
    fields: [questions.skillId],
    references: [skills.id]
  }),
  topic: one(topics, {
    fields: [questions.topicId],
    references: [topics.id]
  }),
  createdBy: one(users, {
    fields: [questions.createdBy],
    references: [users.id],
    relationName: "createdBy"
  }),
  approvedBy: one(users, {
    fields: [questions.approvedBy],
    references: [users.id],
    relationName: "approvedBy"
  }),
  assessmentQuestions: many(assessmentQuestions),
  submissions: many(questionSubmissions)
}));
var assessmentRelations = relations(assessments, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [assessments.createdBy],
    references: [users.id]
  }),
  questions: many(assessmentQuestions),
  assignments: many(assessmentAssignments)
}));
var assessmentQuestionRelations = relations(assessmentQuestions, ({ one }) => ({
  assessment: one(assessments, {
    fields: [assessmentQuestions.assessmentId],
    references: [assessments.id]
  }),
  question: one(questions, {
    fields: [assessmentQuestions.questionId],
    references: [questions.id]
  })
}));
var assessmentAssignmentRelations = relations(assessmentAssignments, ({ one, many }) => ({
  assessment: one(assessments, {
    fields: [assessmentAssignments.assessmentId],
    references: [assessments.id]
  }),
  candidate: one(users, {
    fields: [assessmentAssignments.candidateId],
    references: [users.id],
    relationName: "candidate"
  }),
  assignedBy: one(users, {
    fields: [assessmentAssignments.assignedBy],
    references: [users.id],
    relationName: "assignedBy"
  }),
  submissions: many(questionSubmissions)
}));
var questionSubmissionRelations = relations(questionSubmissions, ({ one }) => ({
  assignment: one(assessmentAssignments, {
    fields: [questionSubmissions.assignmentId],
    references: [assessmentAssignments.id]
  }),
  question: one(questions, {
    fields: [questionSubmissions.questionId],
    references: [questions.id]
  })
}));
var aiGenerationLogRelations = relations(aiGenerationLogs, ({ one }) => ({
  requestedBy: one(users, {
    fields: [aiGenerationLogs.requestedBy],
    references: [users.id]
  }),
  skill: one(skills, {
    fields: [aiGenerationLogs.skillId],
    references: [skills.id]
  })
}));
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertSkillSchema = createInsertSchema(skills).omit({
  id: true,
  createdAt: true
});
var insertTopicSchema = createInsertSchema(topics).omit({
  id: true,
  createdAt: true
});
var insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertAssessmentQuestionSchema = createInsertSchema(assessmentQuestions).omit({
  id: true
});
var insertAssessmentAssignmentSchema = createInsertSchema(assessmentAssignments).omit({
  id: true,
  createdAt: true
});
var insertQuestionSubmissionSchema = createInsertSchema(questionSubmissions).omit({
  id: true,
  submittedAt: true
});
var insertAiGenerationLogSchema = createInsertSchema(aiGenerationLogs).omit({
  id: true,
  createdAt: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, desc, and, sql as sql2 } from "drizzle-orm";
var DatabaseStorage = class {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async upsertUser(userData) {
    const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return user;
  }
  // Skills operations
  async getSkills() {
    return await db.select().from(skills).orderBy(skills.name);
  }
  async createSkill(skill) {
    const [newSkill] = await db.insert(skills).values(skill).returning();
    return newSkill;
  }
  async getSkillById(id) {
    const [skill] = await db.select().from(skills).where(eq(skills.id, id));
    return skill;
  }
  // Topics operations
  async getTopicsBySkill(skillId) {
    return await db.select().from(topics).where(eq(topics.skillId, skillId)).orderBy(topics.name);
  }
  async createTopic(topic) {
    const [newTopic] = await db.insert(topics).values(topic).returning();
    return newTopic;
  }
  // Questions operations
  async getQuestions(filters) {
    let query = db.select().from(questions).leftJoin(skills, eq(questions.skillId, skills.id)).leftJoin(topics, eq(questions.topicId, topics.id)).leftJoin(users, eq(questions.createdBy, users.id));
    const conditions = [];
    if (filters?.skillId) conditions.push(eq(questions.skillId, filters.skillId));
    if (filters?.topicId) conditions.push(eq(questions.topicId, filters.topicId));
    if (filters?.difficulty) conditions.push(eq(questions.difficulty, filters.difficulty));
    if (filters?.type) conditions.push(eq(questions.type, filters.type));
    if (filters?.status) conditions.push(eq(questions.status, filters.status));
    if (filters?.createdBy) conditions.push(eq(questions.createdBy, filters.createdBy));
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    return await query.orderBy(desc(questions.createdAt));
  }
  async createQuestion(question) {
    const [newQuestion] = await db.insert(questions).values(question).returning();
    return newQuestion;
  }
  async updateQuestion(id, updates) {
    const [updatedQuestion] = await db.update(questions).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(questions.id, id)).returning();
    return updatedQuestion;
  }
  async getQuestionById(id) {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question;
  }
  async approveQuestion(id, approvedBy) {
    const [question] = await db.update(questions).set({ status: "approved", approvedBy, updatedAt: /* @__PURE__ */ new Date() }).where(eq(questions.id, id)).returning();
    return question;
  }
  async rejectQuestion(id) {
    const [question] = await db.update(questions).set({ status: "rejected", updatedAt: /* @__PURE__ */ new Date() }).where(eq(questions.id, id)).returning();
    return question;
  }
  // Assessments operations
  async getAssessments(filters) {
    let query = db.select().from(assessments).leftJoin(users, eq(assessments.createdBy, users.id));
    const conditions = [];
    if (filters?.status) conditions.push(eq(assessments.status, filters.status));
    if (filters?.createdBy) conditions.push(eq(assessments.createdBy, filters.createdBy));
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    return await query.orderBy(desc(assessments.createdAt));
  }
  async createAssessment(assessment) {
    const [newAssessment] = await db.insert(assessments).values(assessment).returning();
    return newAssessment;
  }
  async updateAssessment(id, updates) {
    const [updatedAssessment] = await db.update(assessments).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(assessments.id, id)).returning();
    return updatedAssessment;
  }
  async getAssessmentById(id) {
    const [assessment] = await db.select().from(assessments).where(eq(assessments.id, id));
    return assessment;
  }
  async getAssessmentWithQuestions(id) {
    const assessment = await this.getAssessmentById(id);
    if (!assessment) return void 0;
    const questionsData = await db.select().from(assessmentQuestions).leftJoin(questions, eq(assessmentQuestions.questionId, questions.id)).where(eq(assessmentQuestions.assessmentId, id)).orderBy(assessmentQuestions.order);
    return {
      ...assessment,
      questions: questionsData
    };
  }
  // Assessment Questions operations
  async addQuestionToAssessment(assessmentQuestion) {
    const [newAssessmentQuestion] = await db.insert(assessmentQuestions).values(assessmentQuestion).returning();
    return newAssessmentQuestion;
  }
  async removeQuestionFromAssessment(assessmentId, questionId) {
    await db.delete(assessmentQuestions).where(
      and(
        eq(assessmentQuestions.assessmentId, assessmentId),
        eq(assessmentQuestions.questionId, questionId)
      )
    );
  }
  // Assessment Assignments operations
  async getAssignments(filters) {
    let query = db.select().from(assessmentAssignments).leftJoin(assessments, eq(assessmentAssignments.assessmentId, assessments.id)).leftJoin(users, eq(assessmentAssignments.candidateId, users.id));
    const conditions = [];
    if (filters?.candidateId) conditions.push(eq(assessmentAssignments.candidateId, filters.candidateId));
    if (filters?.assessmentId) conditions.push(eq(assessmentAssignments.assessmentId, filters.assessmentId));
    if (filters?.status) conditions.push(eq(assessmentAssignments.status, filters.status));
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    return await query.orderBy(desc(assessmentAssignments.createdAt));
  }
  async createAssignment(assignment) {
    const [newAssignment] = await db.insert(assessmentAssignments).values(assignment).returning();
    return newAssignment;
  }
  async updateAssignment(id, updates) {
    const [updatedAssignment] = await db.update(assessmentAssignments).set(updates).where(eq(assessmentAssignments.id, id)).returning();
    return updatedAssignment;
  }
  // Question Submissions operations
  async getSubmissions(assignmentId) {
    return await db.select().from(questionSubmissions).where(eq(questionSubmissions.assignmentId, assignmentId)).orderBy(questionSubmissions.submittedAt);
  }
  async createSubmission(submission) {
    const [newSubmission] = await db.insert(questionSubmissions).values(submission).returning();
    return newSubmission;
  }
  async updateSubmission(id, updates) {
    const [updatedSubmission] = await db.update(questionSubmissions).set(updates).where(eq(questionSubmissions.id, id)).returning();
    return updatedSubmission;
  }
  // AI Generation operations
  async createAiGenerationLog(log2) {
    const [newLog] = await db.insert(aiGenerationLogs).values(log2).returning();
    return newLog;
  }
  async getAiGenerationLogs(userId) {
    let query = db.select().from(aiGenerationLogs);
    if (userId) {
      query = query.where(eq(aiGenerationLogs.requestedBy, userId));
    }
    return await query.orderBy(desc(aiGenerationLogs.createdAt));
  }
  // Analytics operations
  async getAssessmentStats() {
    const total = await db.select({ count: sql2`count(*)` }).from(assessments);
    const active = await db.select({ count: sql2`count(*)` }).from(assessments).where(eq(assessments.status, "active"));
    const completed = await db.select({ count: sql2`count(*)` }).from(assessments).where(eq(assessments.status, "completed"));
    return {
      totalAssessments: total[0]?.count || 0,
      activeAssessments: active[0]?.count || 0,
      completedAssessments: completed[0]?.count || 0
    };
  }
  async getQuestionStats() {
    const total = await db.select({ count: sql2`count(*)` }).from(questions);
    const approved = await db.select({ count: sql2`count(*)` }).from(questions).where(eq(questions.status, "approved"));
    const pending = await db.select({ count: sql2`count(*)` }).from(questions).where(eq(questions.status, "pending"));
    const aiGenerated = await db.select({ count: sql2`count(*)` }).from(questions).where(eq(questions.isAiGenerated, true));
    return {
      totalQuestions: total[0]?.count || 0,
      approvedQuestions: approved[0]?.count || 0,
      pendingQuestions: pending[0]?.count || 0,
      aiGeneratedQuestions: aiGenerated[0]?.count || 0
    };
  }
  async getUserStats() {
    const total = await db.select({ count: sql2`count(*)` }).from(users);
    const candidates = await db.select({ count: sql2`count(*)` }).from(users).where(eq(users.role, "candidate"));
    const smes = await db.select({ count: sql2`count(*)` }).from(users).where(eq(users.role, "sme"));
    const managers = await db.select({ count: sql2`count(*)` }).from(users).where(eq(users.role, "manager_hr"));
    return {
      totalUsers: total[0]?.count || 0,
      candidates: candidates[0]?.count || 0,
      smes: smes[0]?.count || 0,
      managers: managers[0]?.count || 0
    };
  }
};
var storage = new DatabaseStorage();

// server/replitAuth.ts
import * as client from "openid-client";
import { Strategy } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}
var getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID
    );
  },
  { maxAge: 3600 * 1e3 }
);
function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1e3;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions"
  });
  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl
    }
  });
}
function updateUserSession(user, tokens) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}
async function upsertUser(claims) {
  const existingUser = await storage.getUser(claims["sub"]);
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
    role: existingUser?.role || claims["role"] || "candidate"
  });
}
async function setupAuth(app2) {
  app2.set("trust proxy", 1);
  app2.use(getSession());
  app2.use(passport.initialize());
  app2.use(passport.session());
  const config = await getOidcConfig();
  const verify = async (tokens, verified) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };
  for (const domain of process.env.REPLIT_DOMAINS.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`
      },
      verify
    );
    passport.use(strategy);
  }
  passport.serializeUser((user, cb) => cb(null, user));
  passport.deserializeUser((user, cb) => cb(null, user));
  app2.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"]
    })(req, res, next);
  });
  app2.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login"
    })(req, res, next);
  });
  app2.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`
        }).href
      );
    });
  });
}
var isAuthenticated = async (req, res, next) => {
  const user = req.user;
  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const now = Math.floor(Date.now() / 1e3);
  if (now <= user.expires_at) {
    return next();
  }
  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

// server/services/openai.ts
import OpenAI from "openai";
var openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});
async function generateQuestions(request) {
  try {
    let prompt = "";
    switch (request.questionType) {
      case "multiple_choice":
        prompt = `Generate ${request.count} multiple choice questions for ${request.skill}`;
        if (request.topic) prompt += ` focusing on ${request.topic}`;
        prompt += ` at ${request.difficulty} difficulty level.
        
        ${request.context ? `Use this context: ${request.context}` : ""}
        
        For each question, provide:
        1. A clear, concise title
        2. A detailed description/question text
        3. 4 answer options (A, B, C, D)
        4. The correct answer (letter)
        5. An explanation of why the answer is correct
        6. Estimated time limit in minutes
        
        Return as JSON array with this structure:
        {
          "questions": [
            {
              "title": "Question title",
              "description": "Question text",
              "content": {
                "options": ["A: option1", "B: option2", "C: option3", "D: option4"]
              },
              "correctAnswer": "A",
              "explanation": "Why this answer is correct",
              "timeLimit": 5
            }
          ]
        }`;
        break;
      case "coding":
        prompt = `Generate ${request.count} coding challenges for ${request.skill}`;
        if (request.topic) prompt += ` focusing on ${request.topic}`;
        prompt += ` at ${request.difficulty} difficulty level.
        
        ${request.context ? `Use this context: ${request.context}` : ""}
        
        For each question, provide:
        1. A clear, concise title
        2. A detailed problem description with requirements
        3. Input/output examples
        4. Constraints and edge cases
        5. Function signature or starter code
        6. Test cases for validation
        7. Expected solution approach
        8. Estimated time limit in minutes
        
        Return as JSON array with this structure:
        {
          "questions": [
            {
              "title": "Problem title",
              "description": "Problem description with examples",
              "content": {
                "starterCode": "function signature or template",
                "testCases": [
                  {"input": "example input", "expectedOutput": "expected result"},
                  {"input": "edge case", "expectedOutput": "expected result"}
                ],
                "constraints": "Time/space complexity, input limits",
                "language": "${request.skill.toLowerCase()}"
              },
              "correctAnswer": {
                "solutionCode": "sample solution",
                "approach": "explanation of solution approach"
              },
              "timeLimit": 30
            }
          ]
        }`;
        break;
      case "scenario":
        prompt = `Generate ${request.count} scenario-based questions for ${request.skill}`;
        if (request.topic) prompt += ` focusing on ${request.topic}`;
        prompt += ` at ${request.difficulty} difficulty level.
        
        ${request.context ? `Use this context: ${request.context}` : ""}
        
        For each question, provide:
        1. A realistic scenario title
        2. A detailed scenario description
        3. Specific tasks or decisions to be made
        4. Expected deliverables (files, configurations, etc.)
        5. Evaluation criteria
        6. Estimated time limit in minutes
        
        Return as JSON array with this structure:
        {
          "questions": [
            {
              "title": "Scenario title",
              "description": "Detailed scenario and requirements",
              "content": {
                "scenario": "Background situation",
                "tasks": ["Task 1", "Task 2", "Task 3"],
                "deliverables": ["Expected output 1", "Expected output 2"],
                "evaluationCriteria": ["Criteria 1", "Criteria 2"]
              },
              "correctAnswer": {
                "sampleSolution": "Example of correct approach",
                "keyPoints": ["Important aspect 1", "Important aspect 2"]
              },
              "timeLimit": 60
            }
          ]
        }`;
        break;
    }
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert assessment creator specializing in technical skills evaluation. 
          Generate high-quality, professional questions that accurately assess the specified skill level. 
          Ensure questions are clear, unambiguous, and test practical knowledge.
          Always respond with valid JSON format.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 4e3,
      temperature: 0.7
    });
    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.questions || [];
  } catch (error) {
    console.error("Error generating questions with AI:", error);
    throw new Error("Failed to generate questions: " + error.message);
  }
}
async function improveQuestionQuality(question) {
  try {
    const prompt = `Review and improve this assessment question for clarity, accuracy, and educational value:

    Title: ${question.title}
    Description: ${question.description}
    Type: ${question.type}
    Difficulty: ${question.difficulty}
    Content: ${JSON.stringify(question.content)}

    Please provide an improved version that:
    1. Has clearer, more precise language
    2. Better tests the intended skill
    3. Has appropriate difficulty level
    4. Includes better examples or test cases if applicable
    5. Has more accurate scoring criteria

    Return the improved question in the same JSON format.`;
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert in educational assessment and question quality improvement."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2e3,
      temperature: 0.3
    });
    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Error improving question quality:", error);
    throw new Error("Failed to improve question: " + error.message);
  }
}
async function generateQuestionFeedback(question, answer, isCorrect) {
  try {
    const prompt = `Generate constructive feedback for this assessment question and answer:

    Question: ${question.title}
    Description: ${question.description}
    Student Answer: ${JSON.stringify(answer)}
    Is Correct: ${isCorrect}
    Correct Answer: ${JSON.stringify(question.correctAnswer)}

    Provide helpful feedback that:
    1. Explains what the student did right or wrong
    2. Provides learning guidance
    3. Suggests improvement areas
    4. Is encouraging and constructive

    Return only the feedback text.`;
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a helpful tutor providing constructive feedback on assessment answers."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });
    return response.choices[0].message.content || "Good effort! Keep practicing to improve your skills.";
  } catch (error) {
    console.error("Error generating feedback:", error);
    return "Thank you for your response. Please review the correct answer and continue practicing.";
  }
}

// server/services/codeExecution.ts
import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
var CodeExecutionService = class {
  workingDir = "/tmp/code_execution";
  supportedLanguages = {
    python: {
      extension: "py",
      command: "python3",
      args: []
    },
    javascript: {
      extension: "js",
      command: "node",
      args: []
    },
    c: {
      extension: "c",
      command: "gcc",
      args: ["-o", "program", "-std=c99"],
      runCommand: "./program"
    },
    cpp: {
      extension: "cpp",
      command: "g++",
      args: ["-o", "program", "-std=c++17"],
      runCommand: "./program"
    }
  };
  constructor() {
    this.ensureWorkingDir();
  }
  async ensureWorkingDir() {
    try {
      await fs.mkdir(this.workingDir, { recursive: true });
    } catch (error) {
      console.error("Failed to create working directory:", error);
    }
  }
  async executeCode(request) {
    const startTime = Date.now();
    const sessionId = randomUUID();
    const sessionDir = path.join(this.workingDir, sessionId);
    try {
      await fs.mkdir(sessionDir, { recursive: true });
      const language = request.language.toLowerCase();
      const langConfig = this.supportedLanguages[language];
      if (!langConfig) {
        throw new Error(`Unsupported language: ${request.language}`);
      }
      const filename = `code.${langConfig.extension}`;
      const filePath = path.join(sessionDir, filename);
      await fs.writeFile(filePath, request.code);
      let result;
      if (language === "c" || language === "cpp") {
        result = await this.compileAndRun(langConfig, filePath, sessionDir, request);
      } else {
        result = await this.runInterpreted(langConfig, filePath, request);
      }
      result.executionTime = Date.now() - startTime;
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
        error: error.message,
        executionTime: Date.now() - startTime
      };
    } finally {
      try {
        await fs.rm(sessionDir, { recursive: true, force: true });
      } catch (error) {
        console.error("Failed to cleanup session directory:", error);
      }
    }
  }
  async compileAndRun(langConfig, filePath, sessionDir, request) {
    const compileResult = await this.runCommand(
      langConfig.command,
      [...langConfig.args, filePath],
      sessionDir,
      "",
      10
      // 10 second compile timeout
    );
    if (!compileResult.success) {
      return {
        success: false,
        output: compileResult.output,
        error: compileResult.error || "Compilation failed",
        executionTime: 0
      };
    }
    return await this.runCommand(
      langConfig.runCommand,
      [],
      sessionDir,
      "",
      request.timeLimit || 30
    );
  }
  async runInterpreted(langConfig, filePath, request) {
    return await this.runCommand(
      langConfig.command,
      [...langConfig.args, filePath],
      path.dirname(filePath),
      "",
      request.timeLimit || 30
    );
  }
  async runTestCases(langConfig, filePath, sessionDir, testCases, language) {
    const results = [];
    for (const testCase of testCases) {
      let runResult;
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
        actualOutput,
        passed
      });
    }
    return results;
  }
  async runCommand(command, args, workingDir, input = "", timeoutSeconds = 30) {
    return new Promise((resolve) => {
      let output = "";
      let error = "";
      let timedOut = false;
      const process2 = spawn(command, args, {
        cwd: workingDir,
        stdio: ["pipe", "pipe", "pipe"]
      });
      const timeout = setTimeout(() => {
        timedOut = true;
        process2.kill("SIGKILL");
      }, timeoutSeconds * 1e3);
      process2.stdout.on("data", (data) => {
        output += data.toString();
      });
      process2.stderr.on("data", (data) => {
        error += data.toString();
      });
      process2.on("close", (code) => {
        clearTimeout(timeout);
        if (timedOut) {
          resolve({
            success: false,
            output,
            error: `Process timed out after ${timeoutSeconds} seconds`,
            executionTime: timeoutSeconds * 1e3
          });
        } else {
          resolve({
            success: code === 0,
            output,
            error: error || void 0,
            executionTime: 0
            // Will be set by caller
          });
        }
      });
      process2.on("error", (err) => {
        clearTimeout(timeout);
        resolve({
          success: false,
          output,
          error: err.message,
          executionTime: 0
        });
      });
      if (input) {
        process2.stdin.write(input);
      }
      process2.stdin.end();
    });
  }
  async validateCode(code, language) {
    try {
      const result = await this.executeCode({
        code,
        language,
        timeLimit: 5
      });
      return {
        isValid: result.success,
        errors: result.error ? [result.error] : [],
        warnings: []
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [error.message],
        warnings: []
      };
    }
  }
};
var codeExecutionService = new CodeExecutionService();

// server/routes.ts
import { z } from "zod";
async function registerRoutes(app2) {
  await setupAuth(app2);
  app2.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.get("/api/skills", isAuthenticated, async (req, res) => {
    try {
      const skills2 = await storage.getSkills();
      res.json(skills2);
    } catch (error) {
      console.error("Error fetching skills:", error);
      res.status(500).json({ message: "Failed to fetch skills" });
    }
  });
  app2.post("/api/skills", isAuthenticated, async (req, res) => {
    try {
      const userRole = req.user.claims.role || "candidate";
      if (!["super_admin", "sme"].includes(userRole)) {
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
  app2.get("/api/skills/:skillId/topics", isAuthenticated, async (req, res) => {
    try {
      const topics2 = await storage.getTopicsBySkill(req.params.skillId);
      res.json(topics2);
    } catch (error) {
      console.error("Error fetching topics:", error);
      res.status(500).json({ message: "Failed to fetch topics" });
    }
  });
  app2.post("/api/topics", isAuthenticated, async (req, res) => {
    try {
      const userRole = req.user.claims.role || "candidate";
      if (!["super_admin", "sme"].includes(userRole)) {
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
  app2.get("/api/questions", isAuthenticated, async (req, res) => {
    try {
      const filters = {
        skillId: req.query.skillId,
        topicId: req.query.topicId,
        difficulty: req.query.difficulty,
        type: req.query.type,
        status: req.query.status,
        createdBy: req.query.createdBy
      };
      Object.keys(filters).forEach((key) => {
        if (!filters[key]) {
          delete filters[key];
        }
      });
      const questions2 = await storage.getQuestions(filters);
      res.json(questions2);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });
  app2.post("/api/questions", isAuthenticated, async (req, res) => {
    try {
      const userRole = req.user.claims.role || "candidate";
      if (!["super_admin", "sme"].includes(userRole)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      const questionData = insertQuestionSchema.parse({
        ...req.body,
        createdBy: req.user.claims.sub
      });
      const question = await storage.createQuestion(questionData);
      res.json(question);
    } catch (error) {
      console.error("Error creating question:", error);
      res.status(500).json({ message: "Failed to create question" });
    }
  });
  app2.put("/api/questions/:id", isAuthenticated, async (req, res) => {
    try {
      const userRole = req.user.claims.role || "candidate";
      if (!["super_admin", "sme"].includes(userRole)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      const question = await storage.updateQuestion(req.params.id, req.body);
      res.json(question);
    } catch (error) {
      console.error("Error updating question:", error);
      res.status(500).json({ message: "Failed to update question" });
    }
  });
  app2.post("/api/questions/:id/approve", isAuthenticated, async (req, res) => {
    try {
      const userRole = req.user.claims.role || "candidate";
      if (userRole !== "super_admin") {
        return res.status(403).json({ message: "Only Super Admin can approve questions" });
      }
      const question = await storage.approveQuestion(req.params.id, req.user.claims.sub);
      res.json(question);
    } catch (error) {
      console.error("Error approving question:", error);
      res.status(500).json({ message: "Failed to approve question" });
    }
  });
  app2.post("/api/questions/:id/reject", isAuthenticated, async (req, res) => {
    try {
      const userRole = req.user.claims.role || "candidate";
      if (userRole !== "super_admin") {
        return res.status(403).json({ message: "Only Super Admin can reject questions" });
      }
      const question = await storage.rejectQuestion(req.params.id);
      res.json(question);
    } catch (error) {
      console.error("Error rejecting question:", error);
      res.status(500).json({ message: "Failed to reject question" });
    }
  });
  app2.post("/api/questions/generate", isAuthenticated, async (req, res) => {
    try {
      const userRole = req.user.claims.role || "candidate";
      if (!["super_admin", "sme"].includes(userRole)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      const { skill, topic, difficulty, questionType, count, context } = req.body;
      const logData = insertAiGenerationLogSchema.parse({
        requestedBy: req.user.claims.sub,
        prompt: `Generate ${count} ${questionType} questions for ${skill} (${difficulty})`,
        skillId: req.body.skillId,
        difficulty,
        questionType,
        status: "processing"
      });
      const log2 = await storage.createAiGenerationLog(logData);
      try {
        const generatedQuestions = await generateQuestions({
          skill,
          topic,
          difficulty,
          questionType,
          count,
          context
        });
        await storage.createAiGenerationLog({
          ...logData,
          generatedQuestions,
          status: "completed"
        });
        res.json({ questions: generatedQuestions, logId: log2.id });
      } catch (error) {
        await storage.createAiGenerationLog({
          ...logData,
          status: "failed"
        });
        throw error;
      }
    } catch (error) {
      console.error("Error generating questions:", error);
      res.status(500).json({ message: "Failed to generate questions" });
    }
  });
  app2.post("/api/questions/:id/improve", isAuthenticated, async (req, res) => {
    try {
      const userRole = req.user.claims.role || "candidate";
      if (!["super_admin", "sme"].includes(userRole)) {
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
  app2.get("/api/assessments", isAuthenticated, async (req, res) => {
    try {
      const userRole = req.user.claims.role || "candidate";
      const filters = {
        status: req.query.status
      };
      if (userRole === "candidate") {
        const assignments = await storage.getAssignments({ candidateId: req.user.claims.sub });
        return res.json(assignments);
      } else if (userRole === "manager_hr") {
        filters.createdBy = req.user.claims.sub;
      }
      const assessments2 = await storage.getAssessments(filters);
      res.json(assessments2);
    } catch (error) {
      console.error("Error fetching assessments:", error);
      res.status(500).json({ message: "Failed to fetch assessments" });
    }
  });
  app2.post("/api/assessments", isAuthenticated, async (req, res) => {
    try {
      const userRole = req.user.claims.role || "candidate";
      if (!["super_admin", "manager_hr"].includes(userRole)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      const assessmentData = insertAssessmentSchema.parse({
        ...req.body,
        createdBy: req.user.claims.sub
      });
      const assessment = await storage.createAssessment(assessmentData);
      res.json(assessment);
    } catch (error) {
      console.error("Error creating assessment:", error);
      res.status(500).json({ message: "Failed to create assessment" });
    }
  });
  app2.get("/api/assessments/:id", isAuthenticated, async (req, res) => {
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
  app2.put("/api/assessments/:id", isAuthenticated, async (req, res) => {
    try {
      const userRole = req.user.claims.role || "candidate";
      if (!["super_admin", "manager_hr"].includes(userRole)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      const assessment = await storage.updateAssessment(req.params.id, req.body);
      res.json(assessment);
    } catch (error) {
      console.error("Error updating assessment:", error);
      res.status(500).json({ message: "Failed to update assessment" });
    }
  });
  app2.post("/api/assessments/:id/questions", isAuthenticated, async (req, res) => {
    try {
      const userRole = req.user.claims.role || "candidate";
      if (!["super_admin", "manager_hr"].includes(userRole)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      const assessmentQuestionData = insertAssessmentQuestionSchema.parse({
        assessmentId: req.params.id,
        ...req.body
      });
      const assessmentQuestion = await storage.addQuestionToAssessment(assessmentQuestionData);
      res.json(assessmentQuestion);
    } catch (error) {
      console.error("Error adding question to assessment:", error);
      res.status(500).json({ message: "Failed to add question to assessment" });
    }
  });
  app2.post("/api/assignments", isAuthenticated, async (req, res) => {
    try {
      const userRole = req.user.claims.role || "candidate";
      if (!["super_admin", "manager_hr"].includes(userRole)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      const assignmentData = insertAssessmentAssignmentSchema.parse({
        ...req.body,
        assignedBy: req.user.claims.sub
      });
      const assignment = await storage.createAssignment(assignmentData);
      res.json(assignment);
    } catch (error) {
      console.error("Error creating assignment:", error);
      res.status(500).json({ message: "Failed to create assignment" });
    }
  });
  app2.get("/api/assignments/:id", isAuthenticated, async (req, res) => {
    try {
      const assignments = await storage.getAssignments({ candidateId: req.params.id });
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });
  app2.put("/api/assignments/:id/start", isAuthenticated, async (req, res) => {
    try {
      const assignment = await storage.updateAssignment(req.params.id, {
        status: "in_progress",
        startedAt: /* @__PURE__ */ new Date()
      });
      res.json(assignment);
    } catch (error) {
      console.error("Error starting assignment:", error);
      res.status(500).json({ message: "Failed to start assignment" });
    }
  });
  app2.put("/api/assignments/:id/submit", isAuthenticated, async (req, res) => {
    try {
      const assignment = await storage.updateAssignment(req.params.id, {
        status: "submitted",
        submittedAt: /* @__PURE__ */ new Date()
      });
      res.json(assignment);
    } catch (error) {
      console.error("Error submitting assignment:", error);
      res.status(500).json({ message: "Failed to submit assignment" });
    }
  });
  app2.get("/api/assignments/:assignmentId/submissions", isAuthenticated, async (req, res) => {
    try {
      const submissions = await storage.getSubmissions(req.params.assignmentId);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });
  app2.post("/api/submissions", isAuthenticated, async (req, res) => {
    try {
      const submissionData = insertQuestionSubmissionSchema.parse(req.body);
      const submission = await storage.createSubmission(submissionData);
      const question = await storage.getQuestionById(submission.questionId);
      if (question && ["coding", "scenario"].includes(question.type)) {
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
  app2.post("/api/code/execute", isAuthenticated, async (req, res) => {
    try {
      const { code, language, testCases, timeLimit, memoryLimit } = req.body;
      const result = await codeExecutionService.executeCode({
        code,
        language,
        testCases,
        timeLimit,
        memoryLimit
      });
      res.json(result);
    } catch (error) {
      console.error("Error executing code:", error);
      res.status(500).json({ message: "Failed to execute code" });
    }
  });
  app2.post("/api/code/validate", isAuthenticated, async (req, res) => {
    try {
      const { code, language } = req.body;
      const result = await codeExecutionService.validateCode(code, language);
      res.json(result);
    } catch (error) {
      console.error("Error validating code:", error);
      res.status(500).json({ message: "Failed to validate code" });
    }
  });
  app2.get("/api/analytics/stats", isAuthenticated, async (req, res) => {
    try {
      const userRole = req.user.claims.role || "candidate";
      if (userRole !== "super_admin") {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      const [assessmentStats, questionStats, userStats] = await Promise.all([
        storage.getAssessmentStats(),
        storage.getQuestionStats(),
        storage.getUserStats()
      ]);
      res.json({
        assessments: assessmentStats,
        questions: questionStats,
        users: userStats
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });
  app2.get("/api/analytics/ai-logs", isAuthenticated, async (req, res) => {
    try {
      const userRole = req.user.claims.role || "candidate";
      if (!["super_admin", "sme"].includes(userRole)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      const userId = userRole === "sme" ? req.user.claims.sub : void 0;
      const logs = await storage.getAiGenerationLogs(userId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching AI logs:", error);
      res.status(500).json({ message: "Failed to fetch AI logs" });
    }
  });
  const codeExecutionSchema = z.object({
    code: z.string().min(1, "Code is required"),
    language: z.enum(["python", "javascript", "c", "cpp"]),
    testCases: z.array(z.object({
      input: z.string(),
      expectedOutput: z.string()
    })).optional(),
    timeLimit: z.number().min(1).max(15).optional().default(10)
    // Max 15 seconds for security
  });
  app2.post("/api/code/execute", isAuthenticated, async (req, res) => {
    try {
      const requestData = codeExecutionSchema.parse(req.body);
      const result = await codeExecutionService.executeCode(requestData);
      res.json(result);
    } catch (error) {
      console.error("Code execution error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to execute code", error: error.message });
      }
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs2 from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path2.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
