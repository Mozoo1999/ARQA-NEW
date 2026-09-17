import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getDb: vi.fn() }));

vi.mock("./db", () => ({ getDb: mocks.getDb }));

import { claimWhatsAppInboundEventForReview, storeWhatsAppInboundEvents } from "./whatsappBusiness";

function inbound(providerMessageId: string) {
  return {
    providerMessageId,
    phoneNumberId: "phone-1",
    senderWhatsAppId: "201001234567",
    messageType: "text",
    messageContent: "اختبار",
    receivedAt: new Date("2026-09-17T10:00:00.000Z"),
    rawPayload: { object: "whatsapp_business_account" },
  };
}

describe("WhatsApp inbound-event idempotency", () => {
  beforeEach(() => vi.clearAllMocks());

  it("counts duplicate provider message IDs without failing the signed batch", async () => {
    const values = vi.fn().mockRejectedValue({ code: "ER_DUP_ENTRY" });
    mocks.getDb.mockResolvedValue({ insert: vi.fn(() => ({ values })) });

    await expect(storeWhatsAppInboundEvents([inbound("wamid.duplicate")])).resolves.toEqual({ created: 0, duplicates: 1 });
  });

  it("persists a new event in received state and never creates an operational record", async () => {
    const values = vi.fn().mockResolvedValue([{ insertId: 44 }]);
    mocks.getDb.mockResolvedValue({ insert: vi.fn(() => ({ values })) });

    await expect(storeWhatsAppInboundEvents([inbound("wamid.new")])).resolves.toEqual({ created: 1, duplicates: 0 });
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ providerMessageId: "wamid.new", status: "received", reviewUserId: null, conversationSessionId: null }));
  });

  it("keeps media-only events in received state instead of claiming them for a text conversation", async () => {
    const update = vi.fn();
    mocks.getDb.mockResolvedValue({
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([{ id: 5, status: "received", messageContent: null }]) })) })) })),
      update,
    });

    await expect(claimWhatsAppInboundEventForReview(5, 9)).rejects.toThrow("no text content");
    expect(update).not.toHaveBeenCalled();
  });
});
