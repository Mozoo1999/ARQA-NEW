import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  logActivity: vi.fn(),
  createSmartIntakeDraft: vi.fn(),
  resolveCustomerAndVehicle: vi.fn(),
  createVehicleLoadDraft: vi.fn(),
  confirmVehicleLoadDraft: vi.fn(),
  createReceivingNote: vi.fn(),
  confirmReceivingNote: vi.fn(),
  recordOperationalInputEvent: vi.fn(),
}));

vi.mock("./db", () => ({
  getDb: mocks.getDb,
  logActivity: mocks.logActivity,
  createSmartIntakeDraft: mocks.createSmartIntakeDraft,
  getSupplierCategories: vi.fn(),
  createSupplierCategory: vi.fn(),
  createSupplier: vi.fn(),
}));

vi.mock("./operationalLogistics", () => ({
  resolveCustomerAndVehicle: mocks.resolveCustomerAndVehicle,
  createVehicleLoadDraft: mocks.createVehicleLoadDraft,
  confirmVehicleLoadDraft: mocks.confirmVehicleLoadDraft,
  createReceivingNote: mocks.createReceivingNote,
  confirmReceivingNote: mocks.confirmReceivingNote,
  recordOperationalInputEvent: mocks.recordOperationalInputEvent,
}));

import { confirmConversation, rejectConversation } from "./conversationalAssistant";

function createDatabase(session: Record<string, unknown>) {
  const values = vi.fn().mockResolvedValue([{ insertId: 1 }]);
  const whereUpdate = vi.fn().mockResolvedValue(undefined);
  return {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([session]), orderBy: vi.fn().mockResolvedValue([]) })),
      })),
    })),
    insert: vi.fn(() => ({ values })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: whereUpdate })) })),
    __values: values,
  };
}

describe("authenticated conversational execution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveCustomerAndVehicle.mockResolvedValue({ customer: { id: 21 }, vehicle: { id: 31 }, createdCustomer: false, createdVehicle: false });
    mocks.createVehicleLoadDraft.mockResolvedValue(501);
    mocks.createReceivingNote.mockResolvedValue(601);
  });

  it("creates and confirms a vehicle load only after an authenticated explicit confirmation", async () => {
    const session = { id: 8, userId: 7, status: "ready_for_review", intent: "vehicle_load", channel: "voice", sourceTranscript: "إضافة حمولة", analysisModel: "narqa-conversation-rules", collectedFields: { customerName: "العالمية", vehiclePlateNumber: "أ ب ج 1234", materialName: "رمل", quantity: "30", unit: "طن", unitPrice: "120", operationalDate: "2026-09-07" } };
    mocks.getDb.mockResolvedValue(createDatabase(session));

    await expect(confirmConversation(7, "user", 8)).resolves.toEqual({ entityType: "vehicle_load", entityId: 501, status: "executed" });
    expect(mocks.createVehicleLoadDraft).toHaveBeenCalledWith(expect.objectContaining({ customerId: 21, vehicleId: 31, entryMethod: "voice", status: "pending_review", lines: [expect.objectContaining({ quantity: "30", unit: "طن", totalPrice: "3600" })] }));
    expect(mocks.confirmVehicleLoadDraft).toHaveBeenCalledWith(501, 7);
    expect(mocks.recordOperationalInputEvent).toHaveBeenCalledWith(expect.objectContaining({ userId: 7, sourceType: "vehicle_load", sourceEntityId: 501, outcome: "confirmed" }));
  });

  it("persists a valid vehicle trip with authenticated confirmation and voice provenance", async () => {
    const session = { id: 11, userId: 7, status: "ready_for_review", intent: "vehicle_trip", channel: "voice", sourceTranscript: "إضافة نقلة سيارة", analysisModel: "narqa-conversation-rules", collectedFields: { vehiclePlateNumber: "أ ب ج 1234", loadingLocation: "محجر السويس", unloadingLocation: "مصنع أكتوبر", customerName: "العالمية", cubicCapacity: "42.5", tripCount: "3", notes: "لا توجد" } };
    const database = createDatabase(session);
    mocks.getDb.mockResolvedValue(database);

    await expect(confirmConversation(7, "user", 11)).resolves.toEqual({ entityType: "vehicle_trip", entityId: 1, status: "executed" });
    expect(database.__values).toHaveBeenCalledWith(expect.objectContaining({ conversationSessionId: 11, entryMethod: "voice", sourceTranscript: "إضافة نقلة سيارة", createdByUserId: 7, confirmedByUserId: 7, tripCount: 3 }));
    expect(database.__values).toHaveBeenCalledWith(expect.objectContaining({ userId: 7, entryMethod: "voice", sourceType: "vehicle_trip", action: "vehicle_trip_confirmed", outcome: "confirmed" }));
  });

  it("records rejection without creating or confirming an operational record", async () => {
    const session = { id: 9, userId: 7, status: "ready_for_review", intent: "receiving_note", channel: "voice" };
    mocks.getDb.mockResolvedValue(createDatabase(session));

    await expect(rejectConversation(7, 9)).resolves.toEqual({ entityType: "conversation_session", entityId: 9, status: "cancelled" });
    expect(mocks.createReceivingNote).not.toHaveBeenCalled();
    expect(mocks.confirmReceivingNote).not.toHaveBeenCalled();
    expect(mocks.logActivity).toHaveBeenCalledWith(expect.objectContaining({ action: "rejected_without_execution", entityId: 9 }));
  });

  it("blocks a standard user from confirming a restricted financial draft", async () => {
    const session = { id: 10, userId: 7, status: "ready_for_review", intent: "invoice_draft", channel: "voice", collectedFields: { customerName: "العالمية", amount: "1500", invoiceDate: "2026-09-07" } };
    mocks.getDb.mockResolvedValue(createDatabase(session));

    await expect(confirmConversation(7, "user", 10)).rejects.toThrow("ليس لديك تفويض");
    expect(mocks.createSmartIntakeDraft).not.toHaveBeenCalled();
    expect(mocks.logActivity).toHaveBeenCalledWith(expect.objectContaining({ action: "blocked_unauthorized_execution", entityId: 10 }));
  });
});
