import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { __conversationTestUtils, buildOperationalWorkbookBuffer } from "./conversationalAssistant";

describe("Arabic conversational operational assistant", () => {
  it("classifies a new supplier request and asks for the missing supply category", () => {
    const progress = __conversationTestUtils.deriveConversationProgress("مورد جديد العالمية");
    expect(progress.intent).toBe("supplier_registration");
    expect(progress.fields.name).toBe("العالمية");
    expect(progress.readyForReview).toBe(false);
    expect(progress.nextQuestion).toContain("خامات");
  });

  it("accepts the spoken or written supplier category and prepares a review draft", () => {
    const initial = __conversationTestUtils.deriveConversationProgress("مورد جديد العالمية");
    const answered = __conversationTestUtils.deriveConversationProgress("معدات", { intent: initial.intent, fields: initial.fields, awaiting: "supplyCategory" });
    expect(answered.fields.supplyCategory).toBe("معدات");
    expect(answered.readyForReview).toBe(true);
    expect(answered.summary).toContain("العالمية");
  });

  it("recognises operational load and receiving-note requests", () => {
    expect(__conversationTestUtils.classifyIntent("سجل حمولة سيارة للعميل")).toBe("vehicle_load");
    expect(__conversationTestUtils.classifyIntent("إذن استلام خامات اليوم")).toBe("receiving_note");
  });

  it("normalises Arabic category phrasing without inventing a category", () => {
    expect(__conversationTestUtils.supplyCategory("توريد فنيين")).toBe("فنيين");
    expect(__conversationTestUtils.supplyCategory("خدمة غير مصنفة")).toBeUndefined();
  });

  it("retains an unrecognised category answer for human review instead of inventing a supplier class", () => {
    const initial = __conversationTestUtils.deriveConversationProgress("مورد جديد العالمية");
    const answered = __conversationTestUtils.deriveConversationProgress("خدمة غير مصنفة", { intent: initial.intent, fields: initial.fields, awaiting: "supplyCategory" });
    expect(answered.fields.supplyCategory).toBe("خدمة غير مصنفة");
    expect(answered.readyForReview).toBe(true);
  });

  it("exports operational, audit, conversation and exception sheets in the approved workbook", () => {
    const buffer = buildOperationalWorkbookBuffer({
      operationalRows: [{ id: 7, method: "voice", action: "confirmed_execution" }],
      auditRows: [{ id: 8, status: "executed" }],
      turnRows: [{ sessionId: 8, speaker: "user", content: "مورد جديد العالمية" }],
      exceptionRows: [{ sessionId: 9, status: "failed" }],
    });
    const workbook = XLSX.read(buffer, { type: "buffer" });
    expect(workbook.SheetNames).toEqual(["Operational Records", "Conversation Audit", "Conversation Turns", "Exceptions"]);
    expect(XLSX.utils.sheet_to_json(workbook.Sheets["Operational Records"])).toHaveLength(1);
  });
});
