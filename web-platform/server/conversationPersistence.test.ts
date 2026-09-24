import { beforeEach, describe, expect, it, vi } from "vitest";
import * as XLSX from "xlsx";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  logActivity: vi.fn(),
}));

vi.mock("./db", () => ({
  getDb: mocks.getDb,
  logActivity: mocks.logActivity,
}));

import { buildOperationalWorkbook, importApprovedMessage } from "./conversationalAssistant";

function databaseForMessageImport() {
  const values = vi.fn()
    .mockResolvedValueOnce([{ insertId: 41 }])
    .mockResolvedValueOnce([{ insertId: 42 }])
    .mockResolvedValueOnce([{ insertId: 43 }])
    .mockResolvedValueOnce([{ insertId: 44 }]);
  const orderBy = vi.fn().mockResolvedValue([]);
  const database = {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({ orderBy })),
      })),
    })),
    insert: vi.fn(() => ({ values })),
  };
  return { database, values };
}

function databaseForWorkbook() {
  const events = [{ id: 4, userId: 7, createdAt: new Date("2026-09-24T08:00:00.000Z"), entryMethod: "voice", sourceType: "vehicle_load", action: "vehicle_load_confirmed", outcome: "confirmed", sourceEntityId: 90, analysisModel: "narqa-ai", commandText: "سجل حمولة" }];
  const sessions = [{ id: 12, userId: 7, createdAt: new Date("2026-09-24T08:01:00.000Z"), channel: "voice", intent: "vehicle_load", status: "executed", summary: "حمولة مراجعة", confirmationAt: new Date("2026-09-24T08:02:00.000Z"), executedAt: new Date("2026-09-24T08:02:00.000Z"), updatedAt: new Date("2026-09-24T08:02:00.000Z") }];
  const turns = [{ id: 33, conversationSessionId: 12, turnNumber: 1, createdAt: new Date("2026-09-24T08:01:00.000Z"), speaker: "user", modality: "voice", content: "سجل حمولة" }];
  const orderBy = vi.fn()
    .mockResolvedValueOnce(events)
    .mockResolvedValueOnce(sessions)
    .mockResolvedValueOnce(turns);
  const values = vi.fn().mockResolvedValue([{ insertId: 77 }]);
  const database = {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({ orderBy })),
        orderBy,
      })),
    })),
    insert: vi.fn(() => ({ values })),
  };
  return { database, values };
}

describe("approved-message privacy and workbook persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refuses a message import without explicit consent before opening a session or writing content", async () => {
    await expect(importApprovedMessage(7, { contactName: "جهة اتصال", sourceChannel: "sms", content: "رسالة خاصة", consentConfirmed: false })).rejects.toThrow("consent");
    expect(mocks.getDb).not.toHaveBeenCalled();
    expect(mocks.logActivity).not.toHaveBeenCalled();
  });

  it("stores only a user-approved message import after creating a review conversation", async () => {
    const { database, values } = databaseForMessageImport();
    mocks.getDb.mockResolvedValue(database);

    const result = await importApprovedMessage(7, { contactName: "شركة العالمية", contactPhone: "01001234567", sourceChannel: "manual_message", content: "إذن استلام رقم 18", consentConfirmed: true });

    expect(result).toMatchObject({ importId: 44, conversation: { sessionId: 41 } });
    expect(values).toHaveBeenCalledWith(expect.objectContaining({
      userId: 7,
      contactName: "شركة العالمية",
      contactPhone: "01001234567",
      sourceChannel: "manual_message",
      messageContent: "إذن استلام رقم 18",
      status: "imported",
    }));
    expect(mocks.logActivity).toHaveBeenCalledWith(expect.objectContaining({
      userId: 7,
      module: "messaging",
      action: "approved_message_imported",
      entityType: "approved_message_import",
    }));
  });

  it("generates an export from only the authenticated user's operational history and records the export", async () => {
    const { database, values } = databaseForWorkbook();
    mocks.getDb.mockResolvedValue(database);

    const result = await buildOperationalWorkbook(7);
    const workbook = XLSX.read(result.buffer, { type: "buffer" });

    expect(result).toMatchObject({ exportId: 77, recordCount: 1 });
    expect(workbook.SheetNames).toEqual(["Operational Records", "Conversation Audit", "Conversation Turns", "Exceptions"]);
    expect(XLSX.utils.sheet_to_json(workbook.Sheets["Operational Records"])).toEqual([expect.objectContaining({ source: "vehicle_load", action: "vehicle_load_confirmed", entityId: 90 })]);
    expect(XLSX.utils.sheet_to_json(workbook.Sheets["Conversation Turns"])).toEqual([expect.objectContaining({ sessionId: 12, content: "سجل حمولة" })]);
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ userId: 7, recordCount: 1, status: "created" }));
  });
});
