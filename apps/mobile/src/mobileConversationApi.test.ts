import { afterEach, describe, expect, it, vi } from "vitest";
import { confirmMobileConversation, importApprovedMobileMessage, startMobileConversation } from "./mobileConversationApi";

const originalFetch = globalThis.fetch;

afterEach(() => { globalThis.fetch = originalFetch; vi.restoreAllMocks(); });

function response(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: vi.fn().mockResolvedValue(body) } as unknown as Response;
}

describe("mobile conversation API", () => {
  it("sends a bearer-protected conversation start request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ sessionId: 7, intent: "vehicle_load", fields: {}, nextQuestion: "العميل؟", summary: "", readyForReview: false }));
    globalThis.fetch = fetchMock;

    await expect(startMobileConversation({ apiBaseUrl: "https://api.example", token: "token", channel: "voice", content: "إضافة حمولة" })).resolves.toMatchObject({ sessionId: 7, intent: "vehicle_load" });
    expect(fetchMock).toHaveBeenCalledWith("https://api.example/api/mobile/conversations", expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer token" }) }));
  });

  it("does not hide an authorization failure behind a generic error", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(response({ error: "Unauthorized mobile session" }, 401));
    await expect(confirmMobileConversation({ apiBaseUrl: "https://api.example", token: "expired", sessionId: 7 })).rejects.toThrow("انتهت جلسة الجوال");
  });

  it("always sends explicit consent when importing user-approved message content", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ importId: 4, conversation: { sessionId: 8, intent: "unknown", fields: {}, nextQuestion: null, summary: "", readyForReview: false } }));
    globalThis.fetch = fetchMock;

    await importApprovedMobileMessage({ apiBaseUrl: "https://api.example", token: "token", contactName: "جهة مختارة", sourceChannel: "manual_message", content: "نص وافق عليه المستخدم" });
    expect(JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)).toMatchObject({ consentConfirmed: true, contactName: "جهة مختارة" });
  });
});
