import { sql } from "drizzle-orm";
import {
  text,
  integer,
  sqliteTable,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  agentCompany: text("agent_company"),
  agentPerson: text("agent_person"),
  status: text("status").notNull().default("reply_required"),
  closeReason: text("close_reason"),
  gmailUrl: text("gmail_url"),
  sourceText: text("source_text"),
  summary: text("summary"),
  price: text("price"),
  workRate: text("work_rate"),
  location: text("location"),
  remoteType: text("remote_type"),
  techStack: text("tech_stack", { mode: "json" }).$type<string[]>(),
  startDateText: text("start_date_text"),
  contractPeriod: text("contract_period"),
  nextAction: text("next_action"),
  reminderDate: text("reminder_date"),
  lastContactAt: text("last_contact_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const projectStatusHistory = sqliteTable("project_status_history", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id),
  userId: text("user_id").notNull().references(() => users.id),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  reason: text("reason"),
  changedAt: text("changed_at").notNull().default(sql`(datetime('now'))`),
});

export const projectNotes = sqliteTable("project_notes", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id),
  userId: text("user_id").notNull().references(() => users.id),
  noteType: text("note_type").notNull().default("general"),
  body: text("body").notNull(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const interviewPreparations = sqliteTable("interview_preparations", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id),
  userId: text("user_id").notNull().references(() => users.id),
  interviewAt: text("interview_at"),
  interviewUrl: text("interview_url"),
  interviewType: text("interview_type").default("online"),
  interviewPartner: text("interview_partner"),
  strategy: text("strategy"),
  concerns: text("concerns", { mode: "json" }).$type<string[]>(),
  checklist: text("checklist", { mode: "json" }).$type<string[]>(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const interviewQuestions = sqliteTable("interview_questions", {
  id: text("id").primaryKey(),
  preparationId: text("preparation_id").references(() => interviewPreparations.id),
  projectId: text("project_id").notNull().references(() => projects.id),
  question: text("question").notNull(),
  category: text("category"),
  priority: text("priority").default("medium"),
  memo: text("memo"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const interviewAnswers = sqliteTable("interview_answers", {
  id: text("id").primaryKey(),
  questionId: text("question_id").notNull().references(() => interviewQuestions.id),
  aiAnswer: text("ai_answer"),
  userAnswer: text("user_answer"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const interviewReverseQuestions = sqliteTable("interview_reverse_questions", {
  id: text("id").primaryKey(),
  preparationId: text("preparation_id").references(() => interviewPreparations.id),
  projectId: text("project_id").notNull().references(() => projects.id),
  question: text("question").notNull(),
  category: text("category"),
  checked: integer("checked", { mode: "boolean" }).notNull().default(false),
  memo: text("memo"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const interviewNotes = sqliteTable("interview_notes", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id),
  userId: text("user_id").notNull().references(() => users.id),
  duringNote: text("during_note"),
  afterNote: text("after_note"),
  impression: text("impression"),
  ownTemperature: text("own_temperature"),
  concern: text("concern"),
  nextAction: text("next_action"),
  resultStatus: text("result_status"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const reminders = sqliteTable("reminders", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id),
  userId: text("user_id").notNull().references(() => users.id),
  reminderType: text("reminder_type").notNull(),
  remindAt: text("remind_at").notNull(),
  message: text("message"),
  done: integer("done", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const calendarEvents = sqliteTable("calendar_events", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id),
  userId: text("user_id").notNull().references(() => users.id),
  googleEventId: text("google_event_id"),
  calendarUrl: text("calendar_url"),
  title: text("title").notNull(),
  startAt: text("start_at").notNull(),
  endAt: text("end_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const aiExtractionLogs = sqliteTable("ai_extraction_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  projectId: text("project_id").references(() => projects.id),
  inputText: text("input_text"),
  outputJson: text("output_json", { mode: "json" }),
  taskType: text("task_type").notNull(),
  model: text("model"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const billingSubscriptions = sqliteTable("billing_subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  plan: text("plan").notNull().default("free"),
  status: text("status").notNull().default("active"),
  currentPeriodEnd: text("current_period_end"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type ProjectStatusHistory = typeof projectStatusHistory.$inferSelect;
export type InterviewPreparation = typeof interviewPreparations.$inferSelect;
export type InterviewQuestion = typeof interviewQuestions.$inferSelect;
export type InterviewAnswer = typeof interviewAnswers.$inferSelect;
export type InterviewReverseQuestion = typeof interviewReverseQuestions.$inferSelect;
export type InterviewNote = typeof interviewNotes.$inferSelect;
export type Reminder = typeof reminders.$inferSelect;
