export { documentFieldKeys, mergeDocumentPageAnalyses } from "../../packages/document-intelligence/src/page-analysis";
export type { DocumentFieldKey, DocumentFieldEvidence, DocumentPageAnalysis, DocumentFieldConflict, MergedDocumentAnalysis } from "../../packages/document-intelligence/src/page-analysis";
import { documentFieldKeys } from "../../packages/document-intelligence/src/page-analysis";

export const documentPageAnalysisOutputSchema = {
  type: "json_schema" as const,
  json_schema: {
    name: "narqa_document_page_analysis",
    strict: true,
    schema: {
      type: "object",
      properties: {
        pageNumber: { type: "integer", minimum: 1 },
        status: { type: "string", enum: ["readable", "partial", "unreadable"] },
        documentType: { type: "string" },
        fields: {
          type: "array",
          items: {
            type: "object",
            properties: {
              key: { type: "string", enum: [...documentFieldKeys] },
              value: { type: "string" },
              evidence: { type: "string" },
              confidence: { type: "number", minimum: 0, maximum: 1 },
            },
            required: ["key", "value", "evidence", "confidence"],
            additionalProperties: false,
          },
        },
        evidence: { type: "array", items: { type: "string" } },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        warnings: { type: "array", items: { type: "string" } },
      },
      required: ["pageNumber", "status", "documentType", "fields", "evidence", "confidence", "warnings"],
      additionalProperties: false,
    },
  },
};
