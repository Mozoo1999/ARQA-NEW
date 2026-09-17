import { describe, expect, it } from "vitest";
import { parseClientVoiceAction } from "./clientVoiceActions";

describe("client-side Arabic voice navigation", () => {
  it("routes supported navigation commands inside the mobile application", () => {
    expect(parseClientVoiceAction("افتح الموردين")).toMatchObject({ kind: "navigate", destination: "suppliers" });
    expect(parseClientVoiceAction("اذهب إلى المشاريع")).toMatchObject({ kind: "navigate", destination: "projects" });
    expect(parseClientVoiceAction("حلل مستند PDF")).toMatchObject({ kind: "navigate", destination: "intake" });
    expect(parseClientVoiceAction("إصدار فاتورة")).toMatchObject({ kind: "navigate", destination: "invoice" });
  });

  it("changes only the device design preference for an explicit design command", () => {
    expect(parseClientVoiceAction("اختر تصميم مركز العمليات")).toMatchObject({ kind: "select_design", design: "command_center" });
    expect(parseClientVoiceAction("فعل تصميم مساحة الأعمال")).toMatchObject({ kind: "select_design", design: "operational_canvas" });
  });

  it("does not convert a data-changing vehicle-trip command into navigation", () => {
    expect(parseClientVoiceAction("إضافة نقلة سيارة للعميل العالمية")).toBeNull();
  });

  it("requires a navigation verb for generic entity mentions", () => {
    expect(parseClientVoiceAction("مورد جديد العالمية")).toBeNull();
    expect(parseClientVoiceAction("المشروع يحتاج مراجعة")).toBeNull();
  });
});
