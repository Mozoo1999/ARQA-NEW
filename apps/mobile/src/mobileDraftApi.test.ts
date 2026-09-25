import { afterEach, describe, expect, it, vi } from "vitest";
import { createAuthenticatedMobileDraft } from "./mobileDraftApi";

const originalFetch = globalThis.fetch;

afterEach(() => { globalThis.fetch = originalFetch; vi.restoreAllMocks(); });

function response(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: vi.fn().mockResolvedValue(body) } as unknown as Response;
}

const approvedInput = {
  apiBaseUrl: "https://api.example/",
  token: "session-token",
  sourceType: "voice_command" as const,
  title: "مسودة حمولة",
  intent: "vehicle_load",
  currency: "EGP",
  rawContent: "إضافة حمولة للسيارة",
  confidence: "0.91",
};

describe("authenticated mobile draft submission", () => {
  it("sends reviewed content only through a bearer-protected draft route", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ id: 22, status: "pending_review" }, 201));
    globalThis.fetch = fetchMock;

    await expect(createAuthenticatedMobileDraft(approvedInput)).resolves.toEqual({ id: 22, status: "pending_review" });
    expect(fetchMock).toHaveBeenCalledWith("https://api.example/api/mobile/drafts", expect.objectContaining({
      method: "POST",
      headers: { Authorization: "Bearer session-token", "Content-Type": "application/json" },
    }));
    expect(JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)).toMatchObject({ sourceType: "voice_command", intent: "vehicle_load", rawContent: "إضافة حمولة للسيارة" });
  });

  it("keeps an authorization rejection visible instead of claiming that a draft was saved", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(response({ error: "Unauthorized mobile session" }, 401));
    await expect(createAuthenticatedMobileDraft(approvedInput)).rejects.toThrow("انتهت جلسة الجوال");
  });

  it("rejects a malformed success response without inventing a persisted draft identifier", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(response({ status: "pending_review" }, 201));
    await expect(createAuthenticatedMobileDraft(approvedInput)).rejects.toThrow("غير مكتملة");
  });
});
