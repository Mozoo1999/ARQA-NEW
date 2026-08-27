import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  decimal,
  json,
} from "drizzle-orm/mysql-core";

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 1: USERS & AUTH
// ─────────────────────────────────────────────────────────────────────────────

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "manager", "user"]).default("user").notNull(),
  departmentId: int("departmentId"),
  branchId: int("branchId"),
  jobTitle: varchar("jobTitle", { length: 128 }),
  phone: varchar("phone", { length: 32 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 2: ORGANIZATION
// ─────────────────────────────────────────────────────────────────────────────

export const company = mysqlTable("company", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  nameEn: varchar("nameEn", { length: 256 }),
  registrationNumber: varchar("registrationNumber", { length: 64 }),
  industry: varchar("industry", { length: 128 }),
  website: varchar("website", { length: 256 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  address: text("address"),
  city: varchar("city", { length: 128 }),
  country: varchar("country", { length: 128 }).default("Saudi Arabia"),
  description: text("description"),
  foundedYear: int("foundedYear"),
  employeeCount: int("employeeCount"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Company = typeof company.$inferSelect;
export type InsertCompany = typeof company.$inferInsert;

export const branches = mysqlTable("branches", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  code: varchar("code", { length: 32 }),
  city: varchar("city", { length: 128 }),
  address: text("address"),
  phone: varchar("phone", { length: 32 }),
  email: varchar("email", { length: 320 }),
  managerId: int("managerId"),
  isHeadquarters: boolean("isHeadquarters").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Branch = typeof branches.$inferSelect;
export type InsertBranch = typeof branches.$inferInsert;

export const departments = mysqlTable("departments", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId").notNull(),
  parentDepartmentId: int("parentDepartmentId"),
  name: varchar("name", { length: 256 }).notNull(),
  code: varchar("code", { length: 32 }),
  description: text("description"),
  managerId: int("managerId"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = typeof departments.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 3: PROJECTS
// ─────────────────────────────────────────────────────────────────────────────

export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["planning", "active", "on_hold", "completed", "cancelled"])
    .default("planning")
    .notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  branchId: int("branchId"),
  departmentId: int("departmentId"),
  ownerId: int("ownerId").notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  budget: decimal("budget", { precision: 15, scale: 2 }),
  currency: varchar("currency", { length: 8 }).default("SAR"),
  objectives: text("objectives"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

export const projectTeamMembers = mysqlTable("project_team_members", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  role: varchar("role", { length: 128 }),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type ProjectTeamMember = typeof projectTeamMembers.$inferSelect;
export type InsertProjectTeamMember = typeof projectTeamMembers.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 4: SUPPLIERS
// ─────────────────────────────────────────────────────────────────────────────

export const supplierCategories = mysqlTable("supplier_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SupplierCategory = typeof supplierCategories.$inferSelect;
export type InsertSupplierCategory = typeof supplierCategories.$inferInsert;

export const suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 256 }).notNull(),
  nameEn: varchar("nameEn", { length: 256 }),
  categoryId: int("categoryId"),
  registrationNumber: varchar("registrationNumber", { length: 64 }),
  taxNumber: varchar("taxNumber", { length: 64 }),
  contactPerson: varchar("contactPerson", { length: 128 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  website: varchar("website", { length: 256 }),
  address: text("address"),
  city: varchar("city", { length: 128 }),
  country: varchar("country", { length: 128 }).default("Saudi Arabia"),
  rating: mysqlEnum("rating", ["1", "2", "3", "4", "5"]),
  status: mysqlEnum("status", ["active", "inactive", "blacklisted"]).default("active").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 5: PURCHASE REQUESTS
// ─────────────────────────────────────────────────────────────────────────────

export const purchaseRequests = mysqlTable("purchase_requests", {
  id: int("id").autoincrement().primaryKey(),
  requestNumber: varchar("requestNumber", { length: 32 }).notNull().unique(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", [
    "draft",
    "submitted",
    "under_review",
    "approved",
    "rejected",
    "cancelled",
    "fulfilled",
  ])
    .default("draft")
    .notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  requesterId: int("requesterId").notNull(),
  departmentId: int("departmentId"),
  branchId: int("branchId"),
  projectId: int("projectId"),
  supplierId: int("supplierId"),
  totalAmount: decimal("totalAmount", { precision: 15, scale: 2 }),
  currency: varchar("currency", { length: 8 }).default("SAR"),
  requiredByDate: timestamp("requiredByDate"),
  submittedAt: timestamp("submittedAt"),
  reviewedAt: timestamp("reviewedAt"),
  reviewedById: int("reviewedById"),
  reviewNotes: text("reviewNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PurchaseRequest = typeof purchaseRequests.$inferSelect;
export type InsertPurchaseRequest = typeof purchaseRequests.$inferInsert;

export const purchaseRequestItems = mysqlTable("purchase_request_items", {
  id: int("id").autoincrement().primaryKey(),
  purchaseRequestId: int("purchaseRequestId").notNull(),
  itemName: varchar("itemName", { length: 256 }).notNull(),
  description: text("description"),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 32 }),
  estimatedUnitPrice: decimal("estimatedUnitPrice", { precision: 15, scale: 2 }),
  estimatedTotalPrice: decimal("estimatedTotalPrice", { precision: 15, scale: 2 }),
  notes: text("notes"),
});

export type PurchaseRequestItem = typeof purchaseRequestItems.$inferSelect;
export type InsertPurchaseRequestItem = typeof purchaseRequestItems.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 6: GOVERNANCE (NEAF-COMPLIANT)
// ─────────────────────────────────────────────────────────────────────────────

export const architectureReviews = mysqlTable("architecture_reviews", {
  id: int("id").autoincrement().primaryKey(),
  reviewId: varchar("reviewId", { length: 32 }).notNull().unique(), // e.g. AR-001
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["scheduled", "in_progress", "completed", "cancelled"])
    .default("scheduled")
    .notNull(),
  outcome: mysqlEnum("outcome", ["pass", "conditional_pass", "fail", "deferred"]),
  reviewType: mysqlEnum("reviewType", [
    "architecture_alignment",
    "design_review",
    "implementation_review",
    "compliance_review",
    "post_implementation",
  ]).notNull(),
  scope: text("scope"),
  findings: text("findings"),
  recommendations: text("recommendations"),
  reviewerId: int("reviewerId"),
  scheduledDate: timestamp("scheduledDate"),
  completedDate: timestamp("completedDate"),
  neafVersion: varchar("neafVersion", { length: 16 }).default("1.0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ArchitectureReview = typeof architectureReviews.$inferSelect;
export type InsertArchitectureReview = typeof architectureReviews.$inferInsert;

export const architectureDecisions = mysqlTable("architecture_decisions", {
  id: int("id").autoincrement().primaryKey(),
  decisionId: varchar("decisionId", { length: 32 }).notNull().unique(), // e.g. NAD-015
  title: varchar("title", { length: 256 }).notNull(),
  status: mysqlEnum("status", ["proposed", "under_review", "approved", "deprecated", "superseded"])
    .default("proposed")
    .notNull(),
  category: mysqlEnum("category", [
    "technology",
    "process",
    "data",
    "security",
    "integration",
    "governance",
    "infrastructure",
  ]).notNull(),
  problemStatement: text("problemStatement"),
  decisionStatement: text("decisionStatement"),
  rationale: text("rationale"),
  alternatives: text("alternatives"),
  implications: text("implications"),
  constraints: text("constraints"),
  ownerId: int("ownerId"),
  reviewId: int("reviewId"), // links to architecture_reviews
  supersededById: int("supersededById"),
  approvedAt: timestamp("approvedAt"),
  neafRevision: varchar("neafRevision", { length: 16 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ArchitectureDecision = typeof architectureDecisions.$inferSelect;
export type InsertArchitectureDecision = typeof architectureDecisions.$inferInsert;

export const traceabilityMatrix = mysqlTable("traceability_matrix", {
  id: int("id").autoincrement().primaryKey(),
  decisionId: int("decisionId").notNull(),
  reviewId: int("reviewId").notNull(),
  linkType: mysqlEnum("linkType", [
    "originated_from",
    "validated_by",
    "superseded_by",
    "related_to",
  ]).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TraceabilityLink = typeof traceabilityMatrix.$inferSelect;
export type InsertTraceabilityLink = typeof traceabilityMatrix.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY LOG (used by Enterprise Control Tower)
// ─────────────────────────────────────────────────────────────────────────────

export const activityLog = mysqlTable("activity_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  module: varchar("module", { length: 64 }).notNull(), // e.g. 'projects', 'suppliers'
  action: varchar("action", { length: 64 }).notNull(), // e.g. 'created', 'updated', 'approved'
  entityType: varchar("entityType", { length: 64 }).notNull(),
  entityId: int("entityId"),
  entityLabel: varchar("entityLabel", { length: 256 }),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = typeof activityLog.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// SMART INTAKE & FINANCIAL DRAFTS (OCR & Voice Commands Ledger Integration)
// ─────────────────────────────────────────────────────────────────────────────

export const smartIntakeDrafts = mysqlTable("smart_intake_drafts", {
  id: int("id").autoincrement().primaryKey(),
  sourceType: mysqlEnum("sourceType", ["ocr", "voice_command", "whatsapp"]).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  intent: varchar("intent", { length: 64 }).notNull(),
  vendorName: varchar("vendorName", { length: 256 }),
  amount: decimal("amount", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 8 }).default("EGP"),
  documentDate: varchar("documentDate", { length: 32 }),
  referenceNo: varchar("referenceNo", { length: 64 }),
  taxNo: varchar("taxNo", { length: 64 }),
  rawContent: text("rawContent").notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 4 }),
  status: mysqlEnum("status", ["pending_review", "approved", "rejected", "posted_to_ledger"])
    .default("pending_review")
    .notNull(),
  reviewerId: int("reviewerId"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SmartIntakeDraft = typeof smartIntakeDrafts.$inferSelect;
export type InsertSmartIntakeDraft = typeof smartIntakeDrafts.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// OPERATIONAL LOGISTICS INTAKE
// Vehicle loads and receiving notes are separate from generic smart-intake
// drafts so every confirmed quantity remains traceable to a client, vehicle,
// user, input channel and source analysis.
// ─────────────────────────────────────────────────────────────────────────────

export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 256 }).notNull(),
  registrationNumber: varchar("registrationNumber", { length: 64 }),
  taxNumber: varchar("taxNumber", { length: 64 }),
  contactPerson: varchar("contactPerson", { length: 128 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  address: text("address"),
  status: mysqlEnum("status", ["active", "inactive", "blocked"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

export const vehicles = mysqlTable("vehicles", {
  id: int("id").autoincrement().primaryKey(),
  plateNumber: varchar("plateNumber", { length: 64 }).notNull().unique(),
  customerId: int("customerId").references(() => customers.id),
  fleetCode: varchar("fleetCode", { length: 64 }),
  driverName: varchar("driverName", { length: 128 }),
  driverPhone: varchar("driverPhone", { length: 32 }),
  capacityQuantity: decimal("capacityQuantity", { precision: 14, scale: 3 }),
  capacityUnit: varchar("capacityUnit", { length: 32 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = typeof vehicles.$inferInsert;

export const materialTypes = mysqlTable("material_types", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 256 }).notNull(),
  unit: varchar("unit", { length: 32 }).notNull(),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MaterialType = typeof materialTypes.$inferSelect;
export type InsertMaterialType = typeof materialTypes.$inferInsert;

export const vehicleLoadDrafts = mysqlTable("vehicle_load_drafts", {
  id: int("id").autoincrement().primaryKey(),
  draftNumber: varchar("draftNumber", { length: 40 }).notNull().unique(),
  customerId: int("customerId").notNull().references(() => customers.id),
  vehicleId: int("vehicleId").notNull().references(() => vehicles.id),
  smartIntakeDraftId: int("smartIntakeDraftId").references(() => smartIntakeDrafts.id),
  loadDate: timestamp("loadDate").notNull(),
  referenceNo: varchar("referenceNo", { length: 100 }),
  sourceDocumentUrl: text("sourceDocumentUrl"),
  sourceDocumentName: varchar("sourceDocumentName", { length: 256 }),
  entryMethod: mysqlEnum("entryMethod", ["voice", "camera", "image", "pdf", "manual"]).notNull(),
  analysisModel: varchar("analysisModel", { length: 128 }),
  analysisConfidence: decimal("analysisConfidence", { precision: 5, scale: 4 }),
  analysisPayload: json("analysisPayload"),
  rawContent: text("rawContent").notNull(),
  status: mysqlEnum("status", ["pending_review", "matched", "confirmed", "rejected", "received"]).default("pending_review").notNull(),
  createdByUserId: int("createdByUserId").notNull().references(() => users.id),
  confirmedByUserId: int("confirmedByUserId").references(() => users.id),
  confirmedAt: timestamp("confirmedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VehicleLoadDraft = typeof vehicleLoadDrafts.$inferSelect;
export type InsertVehicleLoadDraft = typeof vehicleLoadDrafts.$inferInsert;

export const vehicleLoadLines = mysqlTable("vehicle_load_lines", {
  id: int("id").autoincrement().primaryKey(),
  vehicleLoadDraftId: int("vehicleLoadDraftId").notNull().references(() => vehicleLoadDrafts.id),
  materialTypeId: int("materialTypeId").references(() => materialTypes.id),
  materialName: varchar("materialName", { length: 256 }).notNull(),
  quantity: decimal("quantity", { precision: 14, scale: 3 }).notNull(),
  unit: varchar("unit", { length: 32 }).notNull(),
  unitPrice: decimal("unitPrice", { precision: 15, scale: 2 }),
  totalPrice: decimal("totalPrice", { precision: 15, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VehicleLoadLine = typeof vehicleLoadLines.$inferSelect;
export type InsertVehicleLoadLine = typeof vehicleLoadLines.$inferInsert;

export const receivingNotes = mysqlTable("receiving_notes", {
  id: int("id").autoincrement().primaryKey(),
  receiptNumber: varchar("receiptNumber", { length: 40 }).notNull().unique(),
  customerId: int("customerId").notNull().references(() => customers.id),
  vehicleId: int("vehicleId").references(() => vehicles.id),
  vehicleLoadDraftId: int("vehicleLoadDraftId").references(() => vehicleLoadDrafts.id),
  receiptDate: timestamp("receiptDate").notNull(),
  referenceNo: varchar("referenceNo", { length: 100 }),
  sourceDocumentUrl: text("sourceDocumentUrl"),
  sourceDocumentName: varchar("sourceDocumentName", { length: 256 }),
  entryMethod: mysqlEnum("entryMethod", ["voice", "camera", "image", "pdf", "manual"]).notNull(),
  analysisModel: varchar("analysisModel", { length: 128 }),
  analysisConfidence: decimal("analysisConfidence", { precision: 5, scale: 4 }),
  analysisPayload: json("analysisPayload"),
  status: mysqlEnum("status", ["pending_review", "confirmed", "rejected"]).default("pending_review").notNull(),
  createdByUserId: int("createdByUserId").notNull().references(() => users.id),
  confirmedByUserId: int("confirmedByUserId").references(() => users.id),
  confirmedAt: timestamp("confirmedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReceivingNote = typeof receivingNotes.$inferSelect;
export type InsertReceivingNote = typeof receivingNotes.$inferInsert;

export const receivingNoteLines = mysqlTable("receiving_note_lines", {
  id: int("id").autoincrement().primaryKey(),
  receivingNoteId: int("receivingNoteId").notNull().references(() => receivingNotes.id),
  materialTypeId: int("materialTypeId").references(() => materialTypes.id),
  materialName: varchar("materialName", { length: 256 }).notNull(),
  quantity: decimal("quantity", { precision: 14, scale: 3 }).notNull(),
  unit: varchar("unit", { length: 32 }).notNull(),
  unitPrice: decimal("unitPrice", { precision: 15, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReceivingNoteLine = typeof receivingNoteLines.$inferSelect;
export type InsertReceivingNoteLine = typeof receivingNoteLines.$inferInsert;

export const operationalInputEvents = mysqlTable("operational_input_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  entryMethod: mysqlEnum("entryMethod", ["voice", "camera", "image", "pdf", "manual"]).notNull(),
  sourceType: mysqlEnum("sourceType", ["vehicle_load", "receiving_note", "vehicle_trip", "voice_command"]).notNull(),
  sourceEntityId: int("sourceEntityId"),
  smartIntakeDraftId: int("smartIntakeDraftId").references(() => smartIntakeDrafts.id),
  commandText: text("commandText"),
  analysisModel: varchar("analysisModel", { length: 128 }),
  analysisConfidence: decimal("analysisConfidence", { precision: 5, scale: 4 }),
  action: varchar("action", { length: 128 }).notNull(),
  outcome: mysqlEnum("outcome", ["pending_review", "confirmed", "rejected", "failed"]).notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OperationalInputEvent = typeof operationalInputEvents.$inferSelect;
export type InsertOperationalInputEvent = typeof operationalInputEvents.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// Conversational operational assistant and approved-message intake
// ─────────────────────────────────────────────────────────────────────────────

export const conversationSessions = mysqlTable("conversation_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  channel: mysqlEnum("channel", ["voice", "text", "image", "document", "message"]).notNull(),
  status: mysqlEnum("status", ["collecting", "ready_for_review", "confirmed", "executed", "cancelled", "failed"]).notNull().default("collecting"),
  intent: varchar("intent", { length: 96 }),
  sourceTranscript: text("sourceTranscript"),
  collectedFields: json("collectedFields"),
  nextQuestion: text("nextQuestion"),
  summary: text("summary"),
  analysisModel: varchar("analysisModel", { length: 128 }),
  confirmationAt: timestamp("confirmationAt"),
  executedAt: timestamp("executedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ConversationSession = typeof conversationSessions.$inferSelect;
export type InsertConversationSession = typeof conversationSessions.$inferInsert;

export const conversationTurns = mysqlTable("conversation_turns", {
  id: int("id").autoincrement().primaryKey(),
  conversationSessionId: int("conversationSessionId").notNull().references(() => conversationSessions.id),
  turnNumber: int("turnNumber").notNull(),
  speaker: mysqlEnum("speaker", ["assistant", "user", "system"]).notNull(),
  modality: mysqlEnum("modality", ["voice", "text", "image", "document", "message"]).notNull(),
  content: text("content").notNull(),
  normalizedFields: json("normalizedFields"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ConversationTurn = typeof conversationTurns.$inferSelect;
export type InsertConversationTurn = typeof conversationTurns.$inferInsert;

export const vehicleTrips = mysqlTable("vehicle_trips", {
  id: int("id").autoincrement().primaryKey(),
  tripNumber: varchar("tripNumber", { length: 40 }).notNull().unique(),
  vehicleId: int("vehicleId").notNull().references(() => vehicles.id),
  customerId: int("customerId").notNull().references(() => customers.id),
  conversationSessionId: int("conversationSessionId").references(() => conversationSessions.id),
  loadingLocation: varchar("loadingLocation", { length: 256 }).notNull(),
  unloadingLocation: varchar("unloadingLocation", { length: 256 }).notNull(),
  cubicCapacity: decimal("cubicCapacity", { precision: 12, scale: 3 }).notNull(),
  tripCount: int("tripCount").notNull(),
  notes: text("notes"),
  entryMethod: mysqlEnum("entryMethod", ["voice", "text", "manual"]).notNull(),
  sourceTranscript: text("sourceTranscript").notNull(),
  status: mysqlEnum("status", ["confirmed", "rejected"]).notNull().default("confirmed"),
  createdByUserId: int("createdByUserId").notNull().references(() => users.id),
  confirmedByUserId: int("confirmedByUserId").notNull().references(() => users.id),
  confirmedAt: timestamp("confirmedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VehicleTrip = typeof vehicleTrips.$inferSelect;
export type InsertVehicleTrip = typeof vehicleTrips.$inferInsert;

export const approvedMessageImports = mysqlTable("approved_message_imports", {
  id: int("id").autoincrement().primaryKey(),
  conversationSessionId: int("conversationSessionId").notNull().references(() => conversationSessions.id),
  userId: int("userId").notNull().references(() => users.id),
  contactName: varchar("contactName", { length: 256 }).notNull(),
  contactPhone: varchar("contactPhone", { length: 48 }),
  sourceChannel: mysqlEnum("sourceChannel", ["manual_message", "whatsapp", "sms"]).notNull(),
  consentConfirmedAt: timestamp("consentConfirmedAt").notNull(),
  messageContent: text("messageContent").notNull(),
  status: mysqlEnum("status", ["imported", "approved", "rejected", "executed"]).notNull().default("imported"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ApprovedMessageImport = typeof approvedMessageImports.$inferSelect;
export type InsertApprovedMessageImport = typeof approvedMessageImports.$inferInsert;

export const operationalExcelExports = mysqlTable("operational_excel_exports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  requestedFrom: timestamp("requestedFrom"),
  requestedTo: timestamp("requestedTo"),
  recordCount: int("recordCount").notNull().default(0),
  workbookKey: varchar("workbookKey", { length: 512 }),
  status: mysqlEnum("status", ["created", "downloaded", "failed"]).notNull().default("created"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OperationalExcelExport = typeof operationalExcelExports.$inferSelect;
export type InsertOperationalExcelExport = typeof operationalExcelExports.$inferInsert;
