import { describe, expect, it } from "vitest";
import { mergeDocumentPageAnalyses, type DocumentPageAnalysis } from "./documentPageAnalysis";

const page = (pageNumber: number, fields: DocumentPageAnalysis["fields"], status: DocumentPageAnalysis["status"] = "readable", confidence = 0.94): DocumentPageAnalysis => ({ pageNumber, status, documentType: "vehicle_load", fields, evidence: fields.map(item => item.evidence), confidence, warnings: [] });

describe("multi-page document evidence merge", () => {
  it("selects the repeated highest-confidence value deterministically and retains page evidence", () => {
    const merged = mergeDocumentPageAnalyses([
      page(2, [{ key: "vehiclePlateNumber", value: "أ ب ج 1234", evidence: "لوحة: أ ب ج 1234", confidence: 0.92 }]),
      page(1, [{ key: "vehiclePlateNumber", value: "أ ب ج 1234", evidence: "السيارة أ ب ج 1234", confidence: 0.97 }]),
    ]);
    expect(merged.fields.vehiclePlateNumber).toBe("أ ب ج 1234");
    expect(merged.fieldEvidence.vehiclePlateNumber?.map(item => item.pageNumber)).toEqual([1, 2]);
    expect(merged.conflicts).toEqual([]);
  });

  it("preserves conflicting candidates instead of silently choosing without review", () => {
    const merged = mergeDocumentPageAnalyses([
      page(1, [{ key: "quantity", value: "30", evidence: "الكمية 30 طن", confidence: 0.96 }]),
      page(2, [{ key: "quantity", value: "35", evidence: "إجمالي الكمية 35", confidence: 0.91 }]),
    ]);
    expect(merged.fields.quantity).toBe("30");
    expect(merged.conflicts[0]).toMatchObject({ key: "quantity", candidates: [{ value: "30", pages: [1] }, { value: "35", pages: [2] }] });
    expect(merged.requiresReview).toBe(true);
  });

  it("reports unreadable pages and low aggregate confidence", () => {
    const merged = mergeDocumentPageAnalyses([page(1, [], "unreadable", 0), page(2, [], "partial", 0.55)]);
    expect(merged.unreadablePages).toEqual([1]);
    expect(merged.overallConfidence).toBe(0.55);
    expect(merged.requiresReview).toBe(true);
    expect(merged.rawEvidence).toContain("صفحة 1: لا يوجد دليل مقروء");
  });

  it("rejects empty analysis sets and duplicate page numbers", () => {
    expect(() => mergeDocumentPageAnalyses([])).toThrow("At least one page");
    expect(() => mergeDocumentPageAnalyses([page(1, []), page(1, [])])).toThrow("Duplicate PDF page");
  });
});
