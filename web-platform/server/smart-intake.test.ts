import { describe, it, expect } from "vitest";
import { createSmartIntakeDraft, getSmartIntakeDrafts, updateSmartIntakeDraftStatus } from "./db";

describe("Smart Intake & Financial Drafts Integration", () => {
  it("should create, list, and approve smart intake drafts with database integrity", async () => {
    if (!process.env.DATABASE_URL) {
      console.warn("Skipping DB test: no DATABASE_URL");
      return;
    }

    const testTitle = `Test OCR Draft ${Date.now()}`;
    const draftId = await createSmartIntakeDraft({
      sourceType: "ocr",
      title: testTitle,
      intent: "ocr_receipt_intake",
      vendorName: "مورد الاختبار",
      amount: "15000.00",
      currency: "EGP",
      documentDate: "2026-08-20",
      referenceNo: "TST-999",
      taxNo: "111-222-333",
      rawContent: "إيصال اختبار محاسبي بقيمة 15,000 جنيه",
      confidence: "0.98",
      status: "pending_review",
    });

    expect(draftId).toBeTypeOf("number");
    expect(draftId).toBeGreaterThan(0);

    const drafts = await getSmartIntakeDrafts("pending_review");
    const found = drafts.find((d) => d.id === draftId);
    expect(found).toBeDefined();
    expect(found?.title).toBe(testTitle);
    expect(found?.status).toBe("pending_review");

    await updateSmartIntakeDraftStatus(draftId, "approved", 1);
    const approvedDrafts = await getSmartIntakeDrafts("approved");
    const approved = approvedDrafts.find((d) => d.id === draftId);
    expect(approved).toBeDefined();
    expect(approved?.status).toBe("approved");
  });
});
