import { describe, expect, it } from "vitest";
import { applyVoiceAnswer, buildVoiceSummary, canExecuteVoiceAction, detectVoiceAction, getNextRequiredField, getVoiceFieldQuestion, initialVoiceFields } from "./voiceActionRegistry";

describe("central voice action registry", () => {
  it("recognises a supplier command and asks the category after its extracted name", () => {
    const action = detectVoiceAction("مورد جديد العالمية");
    const fields = initialVoiceFields(action.id, "مورد جديد العالمية");
    expect(action.id).toBe("supplier_registration");
    expect(fields).toEqual({ name: "العالمية" });
    expect(getNextRequiredField(action.id, fields)?.key).toBe("supplyCategory");
  });

  it("recognises customer and project creation as governed data-changing flows", () => {
    const customer = detectVoiceAction("إضافة عميل العالمية");
    const project = detectVoiceAction("مشروع جديد شرق القاهرة");
    expect(customer).toMatchObject({ id: "customer_registration", executionMode: "server_entity", requiresExplicitApproval: true });
    expect(initialVoiceFields(customer.id, "إضافة عميل العالمية")).toEqual({ name: "العالمية" });
    expect(project).toMatchObject({ id: "project_registration", executionMode: "review_draft", allowedRoles: ["admin", "manager"] });
    expect(initialVoiceFields(project.id, "مشروع جديد شرق القاهرة")).toEqual({ name: "شرق القاهرة" });
  });

  it("requires valid positive vehicle-trip numbers in Arabic or western digits", () => {
    const base = { vehiclePlateNumber: "أ ب ج 1234", loadingLocation: "المحجر", unloadingLocation: "المصنع", customerName: "العميل" };
    expect(applyVoiceAnswer("vehicle_trip", base, "cubicCapacity", "صفر")).toEqual(base);
    expect(applyVoiceAnswer("vehicle_trip", base, "cubicCapacity", "٤٢٫٥ متر مكعب").cubicCapacity).toBe("42.5");
    expect(applyVoiceAnswer("vehicle_trip", base, "tripCount", "0").tripCount).toBeUndefined();
    expect(applyVoiceAnswer("vehicle_trip", base, "tripCount", "٣ نقلات").tripCount).toBe("3");
  });

  it("requires confirmation for data-changing actions while navigation stays inside the app", () => {
    expect(detectVoiceAction("إضافة نقلة سيارة").requiresExplicitApproval).toBe(true);
    expect(detectVoiceAction("افتح الموردين")).toMatchObject({ id: "navigation", executionMode: "client_only", requiresExplicitApproval: false });
  });

  it("blocks restricted financial and settings actions for a standard user", () => {
    expect(canExecuteVoiceAction("invoice_draft", "user")).toBe(false);
    expect(canExecuteVoiceAction("settings_update", "user")).toBe(false);
    expect(canExecuteVoiceAction("vehicle_trip", "user")).toBe(true);
    expect(canExecuteVoiceAction("settings_update", "admin")).toBe(true);
  });

  it("preserves original Arabic spelling in an audible review summary", () => {
    expect(buildVoiceSummary("vehicle_trip", { vehiclePlateNumber: "أ ب ج 1234", loadingLocation: "محجر السويس", unloadingLocation: "مصنع أكتوبر" })).toContain("مصنع أكتوبر");
  });

  it("collects operational load quantity, unit, price, and date in a deterministic order", () => {
    const fields = { customerName: "العالمية", vehiclePlateNumber: "أ ب ج 1234", materialName: "رمل" };
    expect(getNextRequiredField("vehicle_load", fields)?.key).toBe("quantity");
    const withQuantity = applyVoiceAnswer("vehicle_load", fields, "quantity", "٣٠ طن");
    expect(withQuantity.quantity).toBe("30");
    expect(getNextRequiredField("vehicle_load", withQuantity)?.key).toBe("unit");
    expect(applyVoiceAnswer("vehicle_load", withQuantity, "unitPrice", "صفر").unitPrice).toBe("0");
    expect(applyVoiceAnswer("vehicle_load", withQuantity, "operationalDate", "٢٠٢٦-٠٩-٠٧").operationalDate).toBe("2026-09-07");
  });

  it("adapts vehicle-load questions to a configured construction or supply context", () => {
    const construction = { primaryLanguage: "ar" as const, dialect: "ar-EG", sector: "construction" as const, businessLevel: "construction_company" as const, defaultUnit: "متر مكعب", materialVocabulary: ["سن", "رمل"], configured: true };
    const supplyOffice = { ...construction, businessLevel: "supply_office" as const };
    const fields = initialVoiceFields("vehicle_load", "حمولة سيارة", construction);
    expect(fields.unit).toBe("متر مكعب");
    expect(getVoiceFieldQuestion({ key: "materialName", question: "ما نوع الخام؟", kind: "text" }, construction)).toContain("سن");
    const regularLoad = { customerName: "عميل", vehiclePlateNumber: "ن س 1", materialName: "سن", quantity: "20", unit: "متر مكعب", unitPrice: "40", operationalDate: "2026-10-03" };
    expect(getNextRequiredField("vehicle_load", regularLoad, construction)).toBeNull();
    expect(getNextRequiredField("vehicle_load", regularLoad, supplyOffice)?.key).toBe("quarryOrCrusher");
  });
});
