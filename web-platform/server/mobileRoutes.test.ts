import { describe, expect, it } from "vitest";
import { __mobileRouteTestUtils } from "./mobileRoutes";

describe("mobile draft validation", () => {
  const validDraft = {
    sourceType: "ocr",
    title: "فاتورة مورد",
    intent: "expense",
    amount: "1250.50",
    currency: "EGP",
    rawContent: "إجمالي 1250.50",
    confidence: "0.82",
  };

  it("accepts a reviewed mobile draft with validated finance fields", () => {
    expect(__mobileRouteTestUtils.mobileDraftSchema.safeParse(validDraft).success).toBe(true);
  });

  it("rejects unvalidated amounts and blank raw input", () => {
    expect(__mobileRouteTestUtils.mobileDraftSchema.safeParse({ ...validDraft, amount: "-4" }).success).toBe(false);
    expect(__mobileRouteTestUtils.mobileDraftSchema.safeParse({ ...validDraft, rawContent: "" }).success).toBe(false);
  });
});

describe("mobile AI input validation", () => {
  it("accepts authenticated OCR, PDF, and voice text for server-side analysis", () => {
    expect(__mobileRouteTestUtils.mobileAnalysisSchema.safeParse({ sourceType: "pdf", rawContent: "فاتورة إجمالي 1250" }).success).toBe(true);
    expect(__mobileRouteTestUtils.mobileAnalysisSchema.safeParse({ sourceType: "voice_command", rawContent: "سجل مصروف نقل 250 جنيه" }).success).toBe(true);
  });

  it("rejects blank and unsupported analysis sources", () => {
    expect(__mobileRouteTestUtils.mobileAnalysisSchema.safeParse({ sourceType: "unknown", rawContent: "x" }).success).toBe(false);
    expect(__mobileRouteTestUtils.mobileAnalysisSchema.safeParse({ sourceType: "ocr", rawContent: "" }).success).toBe(false);
  });

  it("accepts a supported image data URL and rejects unsupported or oversized visual payloads", () => {
    const dataUrl = `data:image/jpeg;base64,${"a".repeat(64)}`;
    expect(__mobileRouteTestUtils.imageAnalysisSchema.safeParse({ sourceType: "camera", imageDataUrl: dataUrl, context: "إذن استلام" }).success).toBe(true);
    expect(__mobileRouteTestUtils.imageAnalysisSchema.safeParse({ sourceType: "camera", imageDataUrl: "data:application/pdf;base64,abc" }).success).toBe(false);
    expect(__mobileRouteTestUtils.imageAnalysisSchema.safeParse({ sourceType: "image", imageDataUrl: `data:image/png;base64,${"a".repeat(8_000_000)}` }).success).toBe(false);
  });

  it("accepts sequential PDF page images and explicitly rejects unsupported page counts", () => {
    const valid = { pageNumber: 2, totalPages: 4, fileName: "receiving.pdf", imageDataUrl: `data:image/jpeg;base64,${"a".repeat(64)}` };
    expect(__mobileRouteTestUtils.documentPageAnalysisSchema.safeParse(valid).success).toBe(true);
    expect(__mobileRouteTestUtils.documentPageAnalysisSchema.safeParse({ ...valid, pageNumber: 5 }).success).toBe(false);
    expect(__mobileRouteTestUtils.documentPageAnalysisSchema.safeParse({ ...valid, pageNumber: 1, totalPages: __mobileRouteTestUtils.MAX_DOCUMENT_PAGES + 1 }).success).toBe(false);
    expect(__mobileRouteTestUtils.documentPageAnalysisSchema.safeParse({ ...valid, imageDataUrl: "data:application/pdf;base64,abc" }).success).toBe(false);
  });
});

describe("mobile operational context validation", () => {
  const profile = { primaryLanguage: "ar", dialect: "ar-EG", sector: "construction", businessLevel: "construction_company", defaultUnit: "متر مكعب", materialVocabulary: ["سن", "رمل"] };

  it("accepts a bounded, user-controlled sector context", () => {
    expect(__mobileRouteTestUtils.operationalProfileSchema.safeParse(profile).success).toBe(true);
  });

  it("rejects unsupported sectors and oversized vocabularies", () => {
    expect(__mobileRouteTestUtils.operationalProfileSchema.safeParse({ ...profile, sector: "unknown" }).success).toBe(false);
    expect(__mobileRouteTestUtils.operationalProfileSchema.safeParse({ ...profile, materialVocabulary: Array.from({ length: 33 }, (_, index) => `مادة ${index}`) }).success).toBe(false);
  });
});

describe("mobile in-app notification validation", () => {
  it("accepts bounded list parameters and rejects invalid polling input", () => {
    expect(__mobileRouteTestUtils.notificationListQuerySchema.safeParse({ unreadOnly: "true", limit: "30" }).success).toBe(true);
    expect(__mobileRouteTestUtils.notificationListQuerySchema.safeParse({ unreadOnly: "unknown", limit: "0" }).success).toBe(false);
    expect(__mobileRouteTestUtils.notificationListQuerySchema.safeParse({ limit: "101" }).success).toBe(false);
  });
});

describe("mobile dashboard live-data mapping", () => {
  it("maps customer workspace records from operational customers, not user contacts", () => {
    const dashboard = __mobileRouteTestUtils.buildMobileDashboardPayload({
      user: { id: 1, name: "مدير", role: "admin" },
      suppliers: [{ id: 10, name: "مورد" }],
      projects: [],
      contacts: [{ id: 3, name: "مستخدم داخلي", email: "user@example.com", phone: null, role: "user" }],
      controlTower: { totalCustomers: 1 },
      drafts: [],
      operationalReferences: { customers: [{ id: 20, name: "عميل تشغيلي", code: "CUS-20" }], vehicles: [], materialTypes: [] },
    });
    expect(dashboard.customers).toEqual([{ id: 20, name: "عميل تشغيلي", code: "CUS-20" }]);
    expect(dashboard.contacts).toEqual([expect.objectContaining({ id: 3, name: "مستخدم داخلي" })]);
  });
});
