import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("./db", () => mocks);

import { createInAppNotification, markInAppNotificationRead, notificationActionUrl } from "./inAppNotifications";

describe("in-app notification service", () => {
  const database = {
    select: vi.fn(), insert: vi.fn(), update: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getDb.mockResolvedValue(database);
    database.select.mockReturnValue({ from: () => ({ where: () => ({ limit: vi.fn().mockResolvedValue([]) }) }) });
    database.insert.mockReturnValue({ values: vi.fn().mockResolvedValue([{ insertId: 42 }]) });
  });

  it("maps only supported operational records to internal application routes", () => {
    expect(notificationActionUrl("purchase_request", 5)).toBe("/procurement/requests/5");
    expect(notificationActionUrl("smart_intake_draft", 7)).toBe("/ocr");
    expect(notificationActionUrl("unknown_record", 9)).toBeNull();
  });

  it("persists a user-scoped notification and bounds displayed text", async () => {
    const result = await createInAppNotification({ recipientUserId: 2, actorUserId: 1, category: "task", priority: "high", title: `  ${"م".repeat(300)}  `, body: "  مراجعة طلب شراء  ", module: "purchase_requests", entityType: "purchase_request", entityId: 12, dedupeKey: "purchase-submitted:12:2" });
    expect(result).toEqual({ id: 42, created: true });
    const values = database.insert.mock.results[0]?.value.values.mock.calls[0]?.[0] as { title: string; body: string; recipientUserId: number; priority: string };
    expect(values.recipientUserId).toBe(2);
    expect(values.priority).toBe("high");
    expect(values.title).toHaveLength(256);
    expect(values.body).toBe("مراجعة طلب شراء");
  });

  it("reuses an existing dedupe key instead of duplicating the same task", async () => {
    database.select.mockReturnValue({ from: () => ({ where: () => ({ limit: vi.fn().mockResolvedValue([{ id: 31 }]) }) }) });
    const result = await createInAppNotification({ recipientUserId: 2, category: "task", title: "مراجعة", module: "purchase_requests", dedupeKey: "purchase-submitted:12:2" });
    expect(result).toEqual({ id: 31, created: false });
    expect(database.insert).not.toHaveBeenCalled();
  });

  it("marks only a recipient-owned unread notification as read", async () => {
    database.select.mockReturnValue({ from: () => ({ where: () => ({ limit: vi.fn().mockResolvedValue([{ id: 12, isRead: false }]) }) }) });
    database.update.mockReturnValue({ set: () => ({ where: vi.fn().mockResolvedValue(undefined) }) });
    await expect(markInAppNotificationRead(3, 12)).resolves.toEqual({ found: true, changed: true });
    expect(database.update).toHaveBeenCalledOnce();
  });
});
