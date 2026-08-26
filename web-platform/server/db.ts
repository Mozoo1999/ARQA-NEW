import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  activityLog,
  architectureDecisions,
  architectureReviews,
  branches,
  company,
  departments,
  InsertUser,
  projectTeamMembers,
  projects,
  purchaseRequestItems,
  purchaseRequests,
  supplierCategories,
  suppliers,
  traceabilityMatrix,
  users,
  smartIntakeDrafts,
  InsertSmartIntakeDraft,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─────────────────────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function updateUser(id: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set(data).where(eq(users.id, id));
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPANY
// ─────────────────────────────────────────────────────────────────────────────

export async function getCompany() {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(company).limit(1);
  return result[0];
}

export async function upsertCompany(data: typeof company.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getCompany();
  if (existing) {
    await db.update(company).set(data).where(eq(company.id, existing.id));
    return existing.id;
  } else {
    const result = await db.insert(company).values(data);
    return Number(result[0].insertId);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BRANCHES
// ─────────────────────────────────────────────────────────────────────────────

export async function getBranches(companyId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (companyId) return db.select().from(branches).where(eq(branches.companyId, companyId)).orderBy(branches.name);
  return db.select().from(branches).orderBy(branches.name);
}

export async function getBranchById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(branches).where(eq(branches.id, id)).limit(1);
  return result[0];
}

export async function createBranch(data: typeof branches.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(branches).values(data);
  return Number(result[0].insertId);
}

export async function updateBranch(id: number, data: Partial<typeof branches.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(branches).set(data).where(eq(branches.id, id));
}

export async function deleteBranch(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(branches).where(eq(branches.id, id));
}

// ─────────────────────────────────────────────────────────────────────────────
// DEPARTMENTS
// ─────────────────────────────────────────────────────────────────────────────

export async function getDepartments(branchId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (branchId) return db.select().from(departments).where(eq(departments.branchId, branchId)).orderBy(departments.name);
  return db.select().from(departments).orderBy(departments.name);
}

export async function getDepartmentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(departments).where(eq(departments.id, id)).limit(1);
  return result[0];
}

export async function createDepartment(data: typeof departments.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(departments).values(data);
  return Number(result[0].insertId);
}

export async function updateDepartment(id: number, data: Partial<typeof departments.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(departments).set(data).where(eq(departments.id, id));
}

export async function deleteDepartment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(departments).where(eq(departments.id, id));
}

// ─────────────────────────────────────────────────────────────────────────────
// PROJECTS
// ─────────────────────────────────────────────────────────────────────────────

export async function getProjects(filters?: { status?: string; ownerId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.status) conditions.push(eq(projects.status, filters.status as typeof projects.$inferSelect["status"]));
  if (filters?.ownerId) conditions.push(eq(projects.ownerId, filters.ownerId));
  if (conditions.length > 0) return db.select().from(projects).where(and(...conditions)).orderBy(desc(projects.createdAt));
  return db.select().from(projects).orderBy(desc(projects.createdAt));
}

export async function getProjectById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result[0];
}

export async function createProject(data: typeof projects.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(projects).values(data);
  return Number(result[0].insertId);
}

export async function updateProject(id: number, data: Partial<typeof projects.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(projects).set(data).where(eq(projects.id, id));
}

export async function deleteProject(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(projects).where(eq(projects.id, id));
}

export async function getProjectTeamMembers(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projectTeamMembers).where(eq(projectTeamMembers.projectId, projectId));
}

export async function addProjectTeamMember(data: typeof projectTeamMembers.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(projectTeamMembers).values(data);
  return Number(result[0].insertId);
}

export async function removeProjectTeamMember(projectId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(projectTeamMembers).where(and(eq(projectTeamMembers.projectId, projectId), eq(projectTeamMembers.userId, userId)));
}

// ─────────────────────────────────────────────────────────────────────────────
// SUPPLIERS
// ─────────────────────────────────────────────────────────────────────────────

export async function getSupplierCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(supplierCategories).orderBy(supplierCategories.name);
}

export async function createSupplierCategory(data: typeof supplierCategories.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(supplierCategories).values(data);
  return Number(result[0].insertId);
}

export async function updateSupplierCategory(id: number, data: Partial<typeof supplierCategories.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(supplierCategories).set(data).where(eq(supplierCategories.id, id));
}

export async function deleteSupplierCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(supplierCategories).where(eq(supplierCategories.id, id));
}

export async function getSuppliers(filters?: { categoryId?: number; status?: string; search?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.categoryId) conditions.push(eq(suppliers.categoryId, filters.categoryId));
  if (filters?.status) conditions.push(eq(suppliers.status, filters.status as typeof suppliers.$inferSelect["status"]));
  if (filters?.search) conditions.push(or(like(suppliers.name, `%${filters.search}%`), like(suppliers.code, `%${filters.search}%`)));
  if (conditions.length > 0) return db.select().from(suppliers).where(and(...conditions)).orderBy(suppliers.name);
  return db.select().from(suppliers).orderBy(suppliers.name);
}

export async function getSupplierById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
  return result[0];
}

export async function createSupplier(data: typeof suppliers.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(suppliers).values(data);
  return Number(result[0].insertId);
}

export async function updateSupplier(id: number, data: Partial<typeof suppliers.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(suppliers).set(data).where(eq(suppliers.id, id));
}

export async function deleteSupplier(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(suppliers).where(eq(suppliers.id, id));
}

// ─────────────────────────────────────────────────────────────────────────────
// PURCHASE REQUESTS
// ─────────────────────────────────────────────────────────────────────────────

export async function getPurchaseRequests(filters?: { status?: string; requesterId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.status) conditions.push(eq(purchaseRequests.status, filters.status as typeof purchaseRequests.$inferSelect["status"]));
  if (filters?.requesterId) conditions.push(eq(purchaseRequests.requesterId, filters.requesterId));
  if (conditions.length > 0) return db.select().from(purchaseRequests).where(and(...conditions)).orderBy(desc(purchaseRequests.createdAt));
  return db.select().from(purchaseRequests).orderBy(desc(purchaseRequests.createdAt));
}

export async function getPurchaseRequestById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(purchaseRequests).where(eq(purchaseRequests.id, id)).limit(1);
  return result[0];
}

export async function getPurchaseRequestItems(purchaseRequestId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(purchaseRequestItems).where(eq(purchaseRequestItems.purchaseRequestId, purchaseRequestId));
}

export async function createPurchaseRequest(data: typeof purchaseRequests.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(purchaseRequests).values(data);
  return Number(result[0].insertId);
}

export async function createPurchaseRequestItem(data: typeof purchaseRequestItems.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(purchaseRequestItems).values(data);
  return Number(result[0].insertId);
}

export async function updatePurchaseRequest(id: number, data: Partial<typeof purchaseRequests.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(purchaseRequests).set(data).where(eq(purchaseRequests.id, id));
}

export async function deletePurchaseRequestItems(purchaseRequestId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(purchaseRequestItems).where(eq(purchaseRequestItems.purchaseRequestId, purchaseRequestId));
}

export async function generateRequestNumber(): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const year = new Date().getFullYear();
  const result = await db.select({ count: sql<number>`COUNT(*)` }).from(purchaseRequests).where(like(purchaseRequests.requestNumber, `PR-${year}-%`));
  const count = Number(result[0]?.count ?? 0) + 1;
  return `PR-${year}-${String(count).padStart(4, "0")}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// GOVERNANCE
// ─────────────────────────────────────────────────────────────────────────────

export async function getArchitectureReviews(filters?: { status?: string }) {
  const db = await getDb();
  if (!db) return [];
  if (filters?.status) return db.select().from(architectureReviews).where(eq(architectureReviews.status, filters.status as typeof architectureReviews.$inferSelect["status"])).orderBy(desc(architectureReviews.createdAt));
  return db.select().from(architectureReviews).orderBy(desc(architectureReviews.createdAt));
}

export async function getArchitectureReviewById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(architectureReviews).where(eq(architectureReviews.id, id)).limit(1);
  return result[0];
}

export async function createArchitectureReview(data: typeof architectureReviews.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(architectureReviews).values(data);
  return Number(result[0].insertId);
}

export async function updateArchitectureReview(id: number, data: Partial<typeof architectureReviews.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(architectureReviews).set(data).where(eq(architectureReviews.id, id));
}

export async function generateReviewId(): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select({ count: sql<number>`COUNT(*)` }).from(architectureReviews);
  const count = Number(result[0]?.count ?? 0) + 1;
  return `AR-${String(count).padStart(3, "0")}`;
}

export async function getArchitectureDecisions(filters?: { status?: string; category?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.status) conditions.push(eq(architectureDecisions.status, filters.status as typeof architectureDecisions.$inferSelect["status"]));
  if (filters?.category) conditions.push(eq(architectureDecisions.category, filters.category as typeof architectureDecisions.$inferSelect["category"]));
  if (conditions.length > 0) return db.select().from(architectureDecisions).where(and(...conditions)).orderBy(desc(architectureDecisions.createdAt));
  return db.select().from(architectureDecisions).orderBy(desc(architectureDecisions.createdAt));
}

export async function getArchitectureDecisionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(architectureDecisions).where(eq(architectureDecisions.id, id)).limit(1);
  return result[0];
}

export async function createArchitectureDecision(data: typeof architectureDecisions.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(architectureDecisions).values(data);
  return Number(result[0].insertId);
}

export async function updateArchitectureDecision(id: number, data: Partial<typeof architectureDecisions.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(architectureDecisions).set(data).where(eq(architectureDecisions.id, id));
}

export async function generateDecisionId(): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Extract max numeric suffix from existing decisionIds to avoid collisions
  const existing = await db.select({ decisionId: architectureDecisions.decisionId }).from(architectureDecisions);
  let maxNum = 0;
  for (const row of existing) {
    const match = row.decisionId?.match(/(\d+)$/);
    if (match) maxNum = Math.max(maxNum, parseInt(match[1], 10));
  }
  const next = maxNum + 1;
  return `ADR-${String(next).padStart(3, "0")}`;
}

export async function getTraceabilityLinks(filters?: { decisionId?: number; reviewId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.decisionId) conditions.push(eq(traceabilityMatrix.decisionId, filters.decisionId));
  if (filters?.reviewId) conditions.push(eq(traceabilityMatrix.reviewId, filters.reviewId));
  if (conditions.length > 0) return db.select().from(traceabilityMatrix).where(and(...conditions)).orderBy(desc(traceabilityMatrix.createdAt));
  return db.select().from(traceabilityMatrix).orderBy(desc(traceabilityMatrix.createdAt));
}

export async function createTraceabilityLink(data: typeof traceabilityMatrix.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(traceabilityMatrix).values(data);
  return Number(result[0].insertId);
}

export async function deleteTraceabilityLink(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(traceabilityMatrix).where(eq(traceabilityMatrix.id, id));
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY LOG
// ─────────────────────────────────────────────────────────────────────────────

export async function logActivity(data: typeof activityLog.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(activityLog).values(data);
  } catch (e) {
    console.warn("[ActivityLog] Failed to log activity:", e);
  }
}

export async function getRecentActivity(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(activityLog).orderBy(desc(activityLog.createdAt)).limit(limit);
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTROL TOWER STATS
// ─────────────────────────────────────────────────────────────────────────────

export async function getControlTowerStats() {
  const db = await getDb();
  if (!db) return null;

  const [
    totalUsers,
    totalProjects,
    activeProjects,
    totalSuppliers,
    activeSuppliers,
    totalPurchaseRequests,
    pendingPurchaseRequests,
    approvedPurchaseRequests,
    totalReviews,
    totalDecisions,
    approvedDecisions,
  ] = await Promise.all([
    db.select({ count: sql<number>`COUNT(*)` }).from(users),
    db.select({ count: sql<number>`COUNT(*)` }).from(projects),
    db.select({ count: sql<number>`COUNT(*)` }).from(projects).where(eq(projects.status, "active")),
    db.select({ count: sql<number>`COUNT(*)` }).from(suppliers),
    db.select({ count: sql<number>`COUNT(*)` }).from(suppliers).where(eq(suppliers.status, "active")),
    db.select({ count: sql<number>`COUNT(*)` }).from(purchaseRequests),
    db.select({ count: sql<number>`COUNT(*)` }).from(purchaseRequests).where(or(eq(purchaseRequests.status, "submitted"), eq(purchaseRequests.status, "under_review"))),
    db.select({ count: sql<number>`COUNT(*)` }).from(purchaseRequests).where(eq(purchaseRequests.status, "approved")),
    db.select({ count: sql<number>`COUNT(*)` }).from(architectureReviews),
    db.select({ count: sql<number>`COUNT(*)` }).from(architectureDecisions),
    db.select({ count: sql<number>`COUNT(*)` }).from(architectureDecisions).where(eq(architectureDecisions.status, "approved")),
  ]);

  return {
    users: { total: Number(totalUsers[0]?.count ?? 0) },
    projects: {
      total: Number(totalProjects[0]?.count ?? 0),
      active: Number(activeProjects[0]?.count ?? 0),
    },
    suppliers: {
      total: Number(totalSuppliers[0]?.count ?? 0),
      active: Number(activeSuppliers[0]?.count ?? 0),
    },
    purchaseRequests: {
      total: Number(totalPurchaseRequests[0]?.count ?? 0),
      pending: Number(pendingPurchaseRequests[0]?.count ?? 0),
      approved: Number(approvedPurchaseRequests[0]?.count ?? 0),
    },
    governance: {
      reviews: Number(totalReviews[0]?.count ?? 0),
      decisions: Number(totalDecisions[0]?.count ?? 0),
      approvedDecisions: Number(approvedDecisions[0]?.count ?? 0),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SMART INTAKE DRAFTS
// ─────────────────────────────────────────────────────────────────────────────

export async function createSmartIntakeDraft(data: InsertSmartIntakeDraft) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(smartIntakeDrafts).values(data);
  return Number(result[0].insertId);
}

export async function getSmartIntakeDrafts(status?: string) {
  const db = await getDb();
  if (!db) return [];
  if (status) {
    return db.select().from(smartIntakeDrafts).where(eq(smartIntakeDrafts.status, status as any)).orderBy(desc(smartIntakeDrafts.createdAt));
  }
  return db.select().from(smartIntakeDrafts).orderBy(desc(smartIntakeDrafts.createdAt));
}

export async function updateSmartIntakeDraftStatus(id: number, status: "pending_review" | "approved" | "rejected" | "posted_to_ledger", reviewerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(smartIntakeDrafts).set({ status, reviewerId, updatedAt: new Date() }).where(eq(smartIntakeDrafts.id, id));
}

// ─────────────────────────────────────────────────────────────────────────────
// ERD SCHEMA & FOREIGN KEY MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

export async function updateTableColumn(tableName: string, oldCol: string, newCol: string, dataType: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const query = `ALTER TABLE \`${tableName}\` CHANGE COLUMN \`${oldCol}\` \`${newCol}\` ${dataType}`;
  await (db as any).session.client.execute(query);
}

export async function addTableColumn(tableName: string, columnName: string, dataType: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const query = `ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${dataType}`;
  await (db as any).session.client.execute(query);
}

export async function dropTableColumn(tableName: string, columnName: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const query = `ALTER TABLE \`${tableName}\` DROP COLUMN \`${columnName}\``;
  await (db as any).session.client.execute(query);
}

export async function addForeignKeyConstraint(
  tableName: string,
  constraintName: string,
  columnName: string,
  refTableName: string,
  refColumnName: string,
  onDelete = "CASCADE"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const query = `ALTER TABLE \`${tableName}\` ADD CONSTRAINT \`${constraintName}\` FOREIGN KEY (\`${columnName}\`) REFERENCES \`${refTableName}\`(\`${refColumnName}\`) ON DELETE ${onDelete}`;
  await (db as any).session.client.execute(query);
}
