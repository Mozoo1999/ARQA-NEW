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
});
