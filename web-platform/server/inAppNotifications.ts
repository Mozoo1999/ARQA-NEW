import { and, desc, eq, inArray } from "drizzle-orm";
import * as db from "./db";
import { userNotifications, users } from "../drizzle/schema";

export const NOTIFICATION_CATEGORIES = ["task", "approval", "update", "system"] as const;
export const NOTIFICATION_PRIORITIES = ["low", "normal", "high", "urgent"] as const;

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];
export type NotificationPriority = (typeof NOTIFICATION_PRIORITIES)[number];

export type CreateInAppNotificationInput = {
  recipientUserId: number;
  actorUserId?: number | null;
  category: NotificationCategory;
  priority?: NotificationPriority;
  title: string;
  body?: string | null;
  module: string;
  entityType?: string | null;
  entityId?: number | null;
  actionUrl?: string | null;
  dedupeKey?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type NotificationListFilter = {
  unreadOnly?: boolean;
  limit?: number;
};

function normalizeLimit(limit?: number) {
  return Math.min(Math.max(limit ?? 30, 1), 100);
}

export function notificationActionUrl(entityType: string, entityId: number): string | null {
  const routes: Record<string, string> = {
    purchase_request: `/procurement/requests/${entityId}`,
    smart_intake_draft: "/ocr",
    conversation_session: "/commands",
    architecture_review: "/governance/reviews",
    architecture_decision: "/governance/decisions",
  };
  return routes[entityType] ?? null;
}

export async function createInAppNotification(input: CreateInAppNotificationInput) {
  const database = await db.getDb();
  if (!database) throw new Error("Database not available");
  const title = input.title.trim();
  if (!title) throw new Error("Notification title is required");

  const values = {
    recipientUserId: input.recipientUserId,
    actorUserId: input.actorUserId ?? null,
    category: input.category,
    priority: input.priority ?? "normal",
    title: title.slice(0, 256),
    body: input.body?.trim().slice(0, 8_000) || null,
    module: input.module.slice(0, 64),
    entityType: input.entityType?.slice(0, 64) || null,
    entityId: input.entityId ?? null,
    actionUrl: input.actionUrl?.slice(0, 512) || null,
    dedupeKey: input.dedupeKey?.slice(0, 160) || null,
    metadata: input.metadata ?? null,
  } as const;

  if (values.dedupeKey) {
    const existing = await database.select({ id: userNotifications.id })
      .from(userNotifications)
      .where(eq(userNotifications.dedupeKey, values.dedupeKey))
      .limit(1);
    if (existing[0]) return { id: existing[0].id, created: false };
  }

  const result = await database.insert(userNotifications).values(values);
  return { id: Number(result[0].insertId), created: true };
}

export async function createNotificationsForRoles(input: Omit<CreateInAppNotificationInput, "recipientUserId"> & { roles: Array<"admin" | "manager" | "user">; excludeUserId?: number }) {
  const database = await db.getDb();
  if (!database) throw new Error("Database not available");
  const { roles, excludeUserId, ...notification } = input;
  const recipients = await database.select({ id: users.id }).from(users).where(and(inArray(users.role, roles), eq(users.isActive, true)));
  const created = [] as number[];
  for (const recipient of recipients) {
    if (recipient.id === excludeUserId) continue;
    const result = await createInAppNotification({
      ...notification,
      recipientUserId: recipient.id,
      dedupeKey: notification.dedupeKey ? `${notification.dedupeKey}:${recipient.id}` : null,
    });
    if (result.created) created.push(result.id);
  }
  return created;
}

export async function listInAppNotifications(userId: number, filter: NotificationListFilter = {}) {
  const database = await db.getDb();
  if (!database) throw new Error("Database not available");
  const conditions = [eq(userNotifications.recipientUserId, userId)];
  if (filter.unreadOnly) conditions.push(eq(userNotifications.isRead, false));
  return database.select().from(userNotifications).where(and(...conditions)).orderBy(desc(userNotifications.createdAt)).limit(normalizeLimit(filter.limit));
}

export async function getInAppNotificationSummary(userId: number) {
  const database = await db.getDb();
  if (!database) throw new Error("Database not available");
  const unread = await database.select({ id: userNotifications.id, priority: userNotifications.priority })
    .from(userNotifications)
    .where(and(eq(userNotifications.recipientUserId, userId), eq(userNotifications.isRead, false)));
  return {
    unreadCount: unread.length,
    urgentCount: unread.filter(notification => notification.priority === "urgent" || notification.priority === "high").length,
  };
}

export async function markInAppNotificationRead(userId: number, notificationId: number) {
  const database = await db.getDb();
  if (!database) throw new Error("Database not available");
  const current = await database.select({ id: userNotifications.id, isRead: userNotifications.isRead })
    .from(userNotifications)
    .where(and(eq(userNotifications.id, notificationId), eq(userNotifications.recipientUserId, userId)))
    .limit(1);
  if (!current[0]) return { found: false, changed: false };
  if (current[0].isRead) return { found: true, changed: false };
  await database.update(userNotifications).set({ isRead: true, readAt: new Date() }).where(eq(userNotifications.id, notificationId));
  return { found: true, changed: true };
}

export async function markAllInAppNotificationsRead(userId: number) {
  const database = await db.getDb();
  if (!database) throw new Error("Database not available");
  const unread = await database.select({ id: userNotifications.id }).from(userNotifications)
    .where(and(eq(userNotifications.recipientUserId, userId), eq(userNotifications.isRead, false)));
  if (!unread.length) return { changed: 0 };
  await database.update(userNotifications).set({ isRead: true, readAt: new Date() })
    .where(and(eq(userNotifications.recipientUserId, userId), eq(userNotifications.isRead, false)));
  return { changed: unread.length };
}

export async function createPurchaseSubmissionNotifications(input: { requestId: number; requestNumber: string; title: string; actorUserId: number }) {
  return createNotificationsForRoles({
    roles: ["admin", "manager"],
    excludeUserId: input.actorUserId,
    actorUserId: input.actorUserId,
    category: "task",
    priority: "high",
    title: "طلب شراء جديد للمراجعة",
    body: `${input.requestNumber} · ${input.title}`,
    module: "purchase_requests",
    entityType: "purchase_request",
    entityId: input.requestId,
    actionUrl: notificationActionUrl("purchase_request", input.requestId),
    dedupeKey: `purchase-submitted:${input.requestId}`,
    metadata: { requestNumber: input.requestNumber },
  });
}

export async function createPurchaseDecisionNotification(input: { requestId: number; requestNumber: string; title: string; requesterId: number; actorUserId: number; approved: boolean }) {
  return createInAppNotification({
    recipientUserId: input.requesterId,
    actorUserId: input.actorUserId,
    category: "approval",
    priority: input.approved ? "normal" : "high",
    title: input.approved ? "تم اعتماد طلب الشراء" : "تم رفض طلب الشراء",
    body: `${input.requestNumber} · ${input.title}`,
    module: "purchase_requests",
    entityType: "purchase_request",
    entityId: input.requestId,
    actionUrl: notificationActionUrl("purchase_request", input.requestId),
    dedupeKey: `purchase-${input.approved ? "approved" : "rejected"}:${input.requestId}:${input.requesterId}`,
    metadata: { requestNumber: input.requestNumber, outcome: input.approved ? "approved" : "rejected" },
  });
}

export async function createDraftReviewNotifications(input: { draftId: number; title: string; actorUserId: number }) {
  return createNotificationsForRoles({
    roles: ["admin", "manager"],
    excludeUserId: input.actorUserId,
    actorUserId: input.actorUserId,
    category: "task",
    priority: "normal",
    title: "مسودة جديدة تحتاج مراجعة",
    body: input.title,
    module: "smart_intake",
    entityType: "smart_intake_draft",
    entityId: input.draftId,
    actionUrl: notificationActionUrl("smart_intake_draft", input.draftId),
    dedupeKey: `draft-review:${input.draftId}`,
  });
}
