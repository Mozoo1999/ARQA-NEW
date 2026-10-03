import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchMobileNotificationSummary, listMobileNotifications, markAllMobileNotificationsRead, markMobileNotificationRead } from "./mobileNotificationsApi";

const originalFetch = global.fetch;

afterEach(() => { global.fetch = originalFetch; vi.restoreAllMocks(); });

describe("mobile in-app notification API", () => {
  const auth = { apiBaseUrl: "https://api.example.test", token: "session-token" };

  it("loads a validated summary with bearer authentication", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ unreadCount: 3, urgentCount: 1 }), { status: 200, headers: { "Content-Type": "application/json" } }));
    await expect(fetchMobileNotificationSummary(auth)).resolves.toEqual({ unreadCount: 3, urgentCount: 1 });
    expect(global.fetch).toHaveBeenCalledWith("https://api.example.test/api/mobile/notifications/summary", expect.objectContaining({ headers: { Authorization: "Bearer session-token" } }));
  });

  it("loads only a typed notification list and carries unread filter", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify([{ id: 7, category: "task", priority: "high", title: "مراجعة", body: null, module: "purchase_requests", entityType: "purchase_request", entityId: 21, actionUrl: "/procurement/requests/21", isRead: false, readAt: null, createdAt: "2026-10-03T19:00:00.000Z" }]), { status: 200, headers: { "Content-Type": "application/json" } }));
    await expect(listMobileNotifications({ ...auth, unreadOnly: true, limit: 10 })).resolves.toEqual([expect.objectContaining({ id: 7, category: "task", isRead: false })]);
    expect(String((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0])).toContain("unreadOnly=true");
  });

  it("rejects malformed notification payloads instead of rendering invented values", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify([{ id: 7, category: "unknown" }]), { status: 200, headers: { "Content-Type": "application/json" } }));
    await expect(listMobileNotifications(auth)).rejects.toThrow("غير صالح");
  });

  it("marks only the requested notification or all notifications read", async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ found: true, changed: true }), { status: 200, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ changed: 4 }), { status: 200, headers: { "Content-Type": "application/json" } }));
    await expect(markMobileNotificationRead({ ...auth, id: 17 })).resolves.toEqual({ found: true, changed: true });
    await expect(markAllMobileNotificationsRead(auth)).resolves.toEqual({ changed: 4 });
    expect(global.fetch).toHaveBeenNthCalledWith(1, "https://api.example.test/api/mobile/notifications/17/read", expect.objectContaining({ method: "POST" }));
    expect(global.fetch).toHaveBeenNthCalledWith(2, "https://api.example.test/api/mobile/notifications/read-all", expect.objectContaining({ method: "POST" }));
  });
});
