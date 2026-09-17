import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { __whatsappBusinessTestUtils } from "./whatsappBusiness";

const webhookPayload = {
  object: "whatsapp_business_account",
  entry: [{
    id: "waba-1",
    changes: [{
      field: "messages",
      value: {
        metadata: { phone_number_id: "phone-1" },
        contacts: [{ wa_id: "201001234567", profile: { name: "شركة العالمية" } }],
        messages: [
          { id: "wamid.1", from: "201001234567", timestamp: "1789662000", type: "text", text: { body: "حمولة رمل 30 طن" } },
          { id: "wamid.2", from: "201001234567", timestamp: "1789662001", type: "image", image: { caption: "إذن استلام" } },
        ],
      },
    }],
  }],
};

describe("WhatsApp Business official boundary", () => {
  it("reports the integration as not configured without exposing or fabricating credentials", () => {
    const status = __whatsappBusinessTestUtils.getWhatsAppConnectionStatus({});
    expect(status.status).toBe("not_configured");
    expect(status.automaticInboundProcessing).toBe(false);
    expect(status.automaticOperationalInsertion).toBe(false);
    expect(status.missingRequirements.length).toBeGreaterThan(1);
  });

  it("requires all server-only configuration values before webhook verification can be prepared", () => {
    expect(__whatsappBusinessTestUtils.getWhatsAppConnectionStatus({ WHATSAPP_VERIFY_TOKEN: "x" }).status).toBe("not_configured");
    expect(__whatsappBusinessTestUtils.getWhatsAppConnectionStatus({ WHATSAPP_VERIFY_TOKEN: "x", WHATSAPP_APP_SECRET: "secret", WHATSAPP_PHONE_NUMBER_ID: "phone", WHATSAPP_BUSINESS_ACCOUNT_ID: "waba" }).status).toBe("ready_for_verification");
  });

  it("validates HMAC-SHA256 signatures against the untouched raw payload", () => {
    const raw = Buffer.from(JSON.stringify(webhookPayload));
    const signature = `sha256=${createHmac("sha256", "test-secret").update(raw).digest("hex")}`;
    expect(__whatsappBusinessTestUtils.verifyWhatsAppSignature(raw, signature, "test-secret")).toBe(true);
    expect(__whatsappBusinessTestUtils.verifyWhatsAppSignature(raw, signature, "wrong-secret")).toBe(false);
    expect(__whatsappBusinessTestUtils.verifyWhatsAppSignature(raw, "sha256=broken", "test-secret")).toBe(false);
  });

  it("extracts supported inbound message evidence without creating a draft or operational record", () => {
    const events = __whatsappBusinessTestUtils.parseWhatsAppInboundEvents(webhookPayload);
    expect(events).toEqual(expect.arrayContaining([
      expect.objectContaining({ providerMessageId: "wamid.1", senderName: "شركة العالمية", messageType: "text", messageContent: "حمولة رمل 30 طن", phoneNumberId: "phone-1" }),
      expect.objectContaining({ providerMessageId: "wamid.2", messageType: "image", messageContent: "إذن استلام" }),
    ]));
    expect(__whatsappBusinessTestUtils.parseWhatsAppInboundEvents({ object: "page", entry: [] })).toEqual([]);
  });

  it("uses a stable public route reserved for official Meta verification only", () => {
    expect(__whatsappBusinessTestUtils.WEBHOOK_PATH).toBe("/api/integrations/whatsapp/webhook");
  });

  it("forbids standard users from converting an inbound event into a review draft", () => {
    expect(__whatsappBusinessTestUtils.canReviewWhatsAppInbound("user")).toBe(false);
    expect(__whatsappBusinessTestUtils.canReviewWhatsAppInbound("manager")).toBe(true);
    expect(__whatsappBusinessTestUtils.canReviewWhatsAppInbound("admin")).toBe(true);
  });
});
