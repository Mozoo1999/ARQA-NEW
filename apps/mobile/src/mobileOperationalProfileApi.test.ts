import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchMobileOperationalProfile, updateMobileOperationalProfile } from "./mobileOperationalProfileApi";

const originalFetch = globalThis.fetch;

function response(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: vi.fn().mockResolvedValue(body) } as unknown as Response;
}

afterEach(() => { globalThis.fetch = originalFetch; vi.restoreAllMocks(); });

describe("mobile operational profile API", () => {
  const profile = { primaryLanguage: "ar" as const, dialect: "ar-EG", sector: "construction" as const, businessLevel: "construction_company" as const, defaultUnit: "متر مكعب", materialVocabulary: ["سن", "رمل"], configured: true };

  it("loads the authenticated user profile without sending client secrets", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(profile));
    globalThis.fetch = fetchMock;
    await expect(fetchMobileOperationalProfile({ apiBaseUrl: "https://api.example", token: "session" })).resolves.toMatchObject(profile);
    expect(fetchMock).toHaveBeenCalledWith("https://api.example/api/mobile/operational-profile", expect.objectContaining({ headers: { Authorization: "Bearer session" } }));
  });

  it("sends a user-controlled context update as an authenticated request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(profile));
    globalThis.fetch = fetchMock;
    await updateMobileOperationalProfile({ apiBaseUrl: "https://api.example", token: "session", ...profile });
    expect(JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)).toMatchObject({ sector: "construction", defaultUnit: "متر مكعب", materialVocabulary: ["سن", "رمل"] });
  });

  it("does not mask expired authorization as a generic profile error", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(response({ error: "Unauthorized mobile session" }, 401));
    await expect(fetchMobileOperationalProfile({ apiBaseUrl: "https://api.example", token: "expired" })).rejects.toThrow("انتهت جلسة الجوال");
  });
});
