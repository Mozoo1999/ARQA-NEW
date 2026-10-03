export type MobileNotificationCategory = "task" | "approval" | "update" | "system";
export type MobileNotificationPriority = "low" | "normal" | "high" | "urgent";

export type MobileInAppNotification = {
  id: number;
  category: MobileNotificationCategory;
  priority: MobileNotificationPriority;
  title: string;
  body: string | null;
  module: string;
  entityType: string | null;
  entityId: number | null;
  actionUrl: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
};

export type MobileNotificationSummary = { unreadCount: number; urgentCount: number };

type AuthenticatedRequest = { apiBaseUrl: string; token: string; signal?: AbortSignal };

function errorFromResponse(response: Response, payload: unknown, fallback: string) {
  const message = payload && typeof payload === "object" && "error" in payload && typeof (payload as { error?: unknown }).error === "string"
    ? (payload as { error: string }).error
    : fallback;
  return new Error(response.status === 401 ? "انتهت جلسة الجوال. سجّل الدخول مجدداً." : message);
}

function ensureSummary(value: unknown): MobileNotificationSummary {
  if (!value || typeof value !== "object") throw new Error("أعاد الخادم ملخص إشعارات غير صالح.");
  const candidate = value as { unreadCount?: unknown; urgentCount?: unknown };
  if (typeof candidate.unreadCount !== "number" || !Number.isInteger(candidate.unreadCount) || typeof candidate.urgentCount !== "number" || !Number.isInteger(candidate.urgentCount)) throw new Error("أعاد الخادم ملخص إشعارات غير صالح.");
  return { unreadCount: candidate.unreadCount, urgentCount: candidate.urgentCount };
}

function ensureNotification(value: unknown): MobileInAppNotification {
  if (!value || typeof value !== "object") throw new Error("أعاد الخادم إشعاراً غير صالح.");
  const item = value as Partial<MobileInAppNotification>;
  const validCategory = ["task", "approval", "update", "system"].includes(String(item.category));
  const validPriority = ["low", "normal", "high", "urgent"].includes(String(item.priority));
  if (typeof item.id !== "number" || !Number.isInteger(item.id) || !validCategory || !validPriority || typeof item.title !== "string" || typeof item.module !== "string" || typeof item.isRead !== "boolean" || typeof item.createdAt !== "string") throw new Error("أعاد الخادم إشعاراً غير صالح.");
  return {
    id: item.id,
    category: item.category as MobileNotificationCategory,
    priority: item.priority as MobileNotificationPriority,
    title: item.title,
    body: typeof item.body === "string" ? item.body : null,
    module: item.module,
    entityType: typeof item.entityType === "string" ? item.entityType : null,
    entityId: Number.isInteger(item.entityId) ? item.entityId! : null,
    actionUrl: typeof item.actionUrl === "string" ? item.actionUrl : null,
    isRead: item.isRead,
    readAt: typeof item.readAt === "string" ? item.readAt : null,
    createdAt: item.createdAt,
  };
}

export async function fetchMobileNotificationSummary(input: AuthenticatedRequest) {
  const response = await fetch(`${input.apiBaseUrl}/api/mobile/notifications/summary`, { headers: { Authorization: `Bearer ${input.token}` }, signal: input.signal });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw errorFromResponse(response, body, "تعذر تحميل ملخص الإشعارات.");
  return ensureSummary(body);
}

export async function listMobileNotifications(input: AuthenticatedRequest & { unreadOnly?: boolean; limit?: number }) {
  const query = new URLSearchParams();
  if (input.unreadOnly) query.set("unreadOnly", "true");
  if (input.limit) query.set("limit", String(input.limit));
  const response = await fetch(`${input.apiBaseUrl}/api/mobile/notifications${query.size ? `?${query}` : ""}`, { headers: { Authorization: `Bearer ${input.token}` }, signal: input.signal });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw errorFromResponse(response, body, "تعذر تحميل الإشعارات.");
  if (!Array.isArray(body)) throw new Error("أعاد الخادم قائمة إشعارات غير صالحة.");
  return body.map(ensureNotification);
}

export async function markMobileNotificationRead(input: AuthenticatedRequest & { id: number }) {
  const response = await fetch(`${input.apiBaseUrl}/api/mobile/notifications/${input.id}/read`, { method: "POST", headers: { Authorization: `Bearer ${input.token}` }, signal: input.signal });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw errorFromResponse(response, body, "تعذر تحديث الإشعار.");
  return body as { found: boolean; changed: boolean };
}

export async function markAllMobileNotificationsRead(input: AuthenticatedRequest) {
  const response = await fetch(`${input.apiBaseUrl}/api/mobile/notifications/read-all`, { method: "POST", headers: { Authorization: `Bearer ${input.token}` }, signal: input.signal });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw errorFromResponse(response, body, "تعذر تحديث الإشعارات.");
  if (!body || typeof body !== "object" || !Number.isInteger((body as { changed?: unknown }).changed)) throw new Error("أعاد الخادم نتيجة غير صالحة.");
  return body as { changed: number };
}
