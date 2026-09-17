export const documentFieldKeys = ["operationType", "customerName", "customerTaxNumber", "vehiclePlateNumber", "vendorName", "referenceNo", "documentDate", "materialName", "quantity", "unit", "unitPrice", "totalPrice", "amount", "currency"] as const;
export type DocumentFieldKey = typeof documentFieldKeys[number];

export interface DocumentFieldEvidence {
  key: DocumentFieldKey;
  value: string;
  evidence: string;
  confidence: number;
}

export interface DocumentPageAnalysis {
  pageNumber: number;
  status: "readable" | "partial" | "unreadable";
  documentType: string;
  fields: DocumentFieldEvidence[];
  evidence: string[];
  confidence: number;
  warnings: string[];
}

export interface DocumentFieldConflict {
  key: DocumentFieldKey;
  candidates: Array<{ value: string; pages: number[]; confidence: number }>;
}

export interface MergedDocumentAnalysis {
  fields: Partial<Record<DocumentFieldKey, string>>;
  fieldEvidence: Partial<Record<DocumentFieldKey, Array<{ pageNumber: number; value: string; evidence: string; confidence: number }>>>;
  conflicts: DocumentFieldConflict[];
  pages: DocumentPageAnalysis[];
  unreadablePages: number[];
  overallConfidence: number;
  requiresReview: boolean;
  rawEvidence: string;
}

function normalizeCandidate(value: string) {
  return value.replace(/[٠-٩]/g, digit => "٠١٢٣٤٥٦٧٨٩".indexOf(digit).toString()).replace(/\s+/g, " ").trim().toLowerCase();
}

export function mergeDocumentPageAnalyses(input: DocumentPageAnalysis[]): MergedDocumentAnalysis {
  const pages = [...input].sort((a, b) => a.pageNumber - b.pageNumber);
  if (!pages.length) throw new Error("At least one page analysis is required");
  if (new Set(pages.map(page => page.pageNumber)).size !== pages.length) throw new Error("Duplicate PDF page numbers are not allowed");
  const fields: MergedDocumentAnalysis["fields"] = {};
  const fieldEvidence: MergedDocumentAnalysis["fieldEvidence"] = {};
  const conflicts: DocumentFieldConflict[] = [];

  for (const key of documentFieldKeys) {
    const observations = pages.flatMap(page => page.fields.filter(item => item.key === key && item.value.trim()).map(item => ({ pageNumber: page.pageNumber, ...item })));
    if (!observations.length) continue;
    fieldEvidence[key] = observations.map(({ pageNumber, value, evidence, confidence }) => ({ pageNumber, value, evidence, confidence }));
    const grouped = new Map<string, typeof observations>();
    for (const observation of observations) {
      const normalized = normalizeCandidate(observation.value);
      grouped.set(normalized, [...(grouped.get(normalized) ?? []), observation]);
    }
    const candidates = Array.from(grouped.values()).map(group => ({ value: group[0].value, pages: group.map(item => item.pageNumber), confidence: group.reduce((sum, item) => sum + item.confidence, 0) / group.length }));
    candidates.sort((a, b) => b.pages.length - a.pages.length || b.confidence - a.confidence || a.pages[0] - b.pages[0]);
    fields[key] = candidates[0].value;
    if (candidates.length > 1) conflicts.push({ key, candidates });
  }

  const readablePages = pages.filter(page => page.status !== "unreadable");
  const unreadablePages = pages.filter(page => page.status === "unreadable").map(page => page.pageNumber);
  const overallConfidence = readablePages.length ? readablePages.reduce((sum, page) => sum + page.confidence, 0) / readablePages.length : 0;
  return { fields, fieldEvidence, conflicts, pages, unreadablePages, overallConfidence, requiresReview: unreadablePages.length > 0 || conflicts.length > 0 || overallConfidence < 0.85, rawEvidence: pages.map(page => `صفحة ${page.pageNumber}: ${page.evidence.join(" | ") || "لا يوجد دليل مقروء"}`).join("\n") };
}
