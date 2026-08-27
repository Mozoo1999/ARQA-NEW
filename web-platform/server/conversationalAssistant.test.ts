import { describe, expect, it } from "vitest";
import { __conversationTestUtils } from "./conversationalAssistant";

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
});
