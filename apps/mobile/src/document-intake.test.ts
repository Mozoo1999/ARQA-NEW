import { describe, expect, it } from "vitest";
import { createPdfReviewDraft, extractDocumentFields, getOcrReviewGuidance, toLatinDigits } from "./document-intake";

describe("document intake extraction", () => {
  it("converts Arabic-Indic digits before extracting structured financial values", () => {
    expect(toLatinDigits("١٢٣٤٥٦٧٨٩٠")).toBe("1234567890");
    expect(extractDocumentFields("شركة النور\nالإجمالي: ١٢٬٥٠٠٫٧٥\nالتاريخ ٢٠٢٦/٠٨/٢٥\nالرقم الضريبي ١٢٣٤٥٦٧٨٩\nفاتورة INV-2026-019")).toEqual({
      vendorName: "شركة النور",
      amount: "12500.75",
      documentDate: "2026/08/25",
      taxNo: "123456789",
      referenceNo: "INV-2026-019",
    });
  });

  it("returns editable empty values when a low-quality document has no matching fields", () => {
    expect(extractDocumentFields("نص غير واضح")).toEqual({ vendorName: "نص غير واضح", amount: "", documentDate: "", taxNo: "", referenceNo: "" });
  });

  it("guides human review instead of presenting a low-quality OCR result as certain", () => {
    expect(getOcrReviewGuidance("نص قصير", { vendorName: "", amount: "", documentDate: "", taxNo: "", referenceNo: "" }).level).toBe("low");
    expect(getOcrReviewGuidance("شركة النور\nالإجمالي 12500\n2026/08/25\nالرقم الضريبي 123456789\nفاتورة INV-2026-019", { vendorName: "شركة النور", amount: "12500", documentDate: "2026/08/25", taxNo: "123456789", referenceNo: "INV-2026-019" }).level).toBe("high");
  });

  it("turns selectable PDF text into an editable local review draft", () => {
    const draft = createPdfReviewDraft("شركة النور\nفاتورة INV-2026-0042\nالإجمالي ١٢٥٠.٥٠\n2026/08/25");
    expect(draft.fields.amount).toBe("1250.50");
    expect(draft.fields.referenceNo).toBe("INV-2026-0042");
    expect(draft.note).toContain("داخل التطبيق");
  });

  it("flags a scanned PDF with no embedded text without opening an external workspace", () => {
    const draft = createPdfReviewDraft("   ");
    expect(draft.rawText).toBe("");
    expect(draft.note).toContain("ملف ممسوح ضوئياً");
  });
});
