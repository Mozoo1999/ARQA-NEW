import { createHmac, timingSafeEqual } from "node:crypto";
import express, { type Express, type Request, type Response } from "express";
import { and, eq } from "drizzle-orm";
import { whatsappInboundEvents } from "../drizzle/schema";
import * as db from "./db";

const WEBHOOK_PATH = "/api/integrations/whatsapp/webhook";

type WhatsAppEnvironment = Record<string, string | undefined>;

type WhatsAppConfiguration = {
  verifyToken?: string;
  appSecret?: string;
  phoneNumberId?: string;
  businessAccountId?: string;
};

export type WhatsAppConnectionStatus = {
  provider: "meta_whatsapp_business_platform";
  status: "not_configured" | "ready_for_verification";
  automaticInboundProcessing: false;
  automaticOperationalInsertion: false;
  webhookPath: string;
  missingRequirements: string[];
  reviewerApprovalRequired: true;
};

export type ParsedWhatsAppInboundEvent = {
  providerMessageId: string;
  whatsappBusinessAccountId?: string;
  phoneNumberId: string;
  senderWhatsAppId: string;
  senderName?: string;
  messageType: string;
  messageContent?: string;
  receivedAt: Date;
  rawPayload: Record<string, unknown>;
};

function configurationFromEnvironment(environment: WhatsAppEnvironment = process.env): WhatsAppConfiguration {
  return {
    verifyToken: environment.WHATSAPP_VERIFY_TOKEN,
    appSecret: environment.WHATSAPP_APP_SECRET,
    phoneNumberId: environment.WHATSAPP_PHONE_NUMBER_ID,
    businessAccountId: environment.WHATSAPP_BUSINESS_ACCOUNT_ID,
  };
}

function missingRequirements(configuration: WhatsAppConfiguration) {
  const missing: string[] = [];
  if (!configuration.verifyToken) missing.push("WHATSAPP_VERIFY_TOKEN محفوظ في بيئة الخادم فقط");
  if (!configuration.appSecret) missing.push("WHATSAPP_APP_SECRET محفوظ في بيئة الخادم فقط");
  if (!configuration.phoneNumberId) missing.push("WHATSAPP_PHONE_NUMBER_ID لحساب الأعمال الرسمي");
  if (!configuration.businessAccountId) missing.push("WHATSAPP_BUSINESS_ACCOUNT_ID لحساب Meta Business الرسمي");
  if (missing.length > 0) missing.unshift("حساب Meta Business وتفويض WhatsApp Business وموافقة وسياسة احتفاظ بالرسائل");
  return missing;
}

export function getWhatsAppConnectionStatus(environment: WhatsAppEnvironment = process.env): WhatsAppConnectionStatus {
  const configuration = configurationFromEnvironment(environment);
  const missing = missingRequirements(configuration);
  return {
    provider: "meta_whatsapp_business_platform",
    status: missing.length === 0 ? "ready_for_verification" : "not_configured",
    automaticInboundProcessing: false,
    automaticOperationalInsertion: false,
    webhookPath: WEBHOOK_PATH,
    missingRequirements: missing,
    reviewerApprovalRequired: true,
  };
}

export function canReviewWhatsAppInbound(role: string | null | undefined) {
  return role === "admin" || role === "manager";
}

function hasWebhookConfiguration(configuration: WhatsAppConfiguration): configuration is Required<WhatsAppConfiguration> {
  return Boolean(configuration.verifyToken && configuration.appSecret && configuration.phoneNumberId && configuration.businessAccountId);
}

export function verifyWhatsAppSignature(rawBody: Buffer, receivedSignature: string | undefined, appSecret: string | undefined): boolean {
  if (!appSecret || !receivedSignature?.startsWith("sha256=")) return false;
  const supplied = receivedSignature.slice("sha256=".length);
  if (!/^[a-f0-9]{64}$/i.test(supplied)) return false;
  const expected = createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const suppliedBuffer = Buffer.from(supplied, "hex");
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
}

function messageContent(message: Record<string, unknown>, messageType: string): string | undefined {
  const typed = message[messageType];
  if (!typed || typeof typed !== "object") return undefined;
  const value = typed as Record<string, unknown>;
  if (typeof value.body === "string") return value.body;
  if (typeof value.caption === "string") return value.caption;
  return undefined;
}

function messageTimestamp(value: unknown) {
  const seconds = typeof value === "string" ? Number(value) : typeof value === "number" ? value : Number.NaN;
  return Number.isFinite(seconds) && seconds > 0 ? new Date(seconds * 1_000) : new Date();
}

export function parseWhatsAppInboundEvents(payload: unknown): ParsedWhatsAppInboundEvent[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  if (root.object !== "whatsapp_business_account" || !Array.isArray(root.entry)) return [];
  const events: ParsedWhatsAppInboundEvent[] = [];
  for (const entry of root.entry) {
    if (!entry || typeof entry !== "object") continue;
    const account = entry as Record<string, unknown>;
    if (!Array.isArray(account.changes)) continue;
    for (const change of account.changes) {
      if (!change || typeof change !== "object") continue;
      const value = (change as Record<string, unknown>).value;
      if (!value || typeof value !== "object") continue;
      const messageValue = value as Record<string, unknown>;
      const metadata = messageValue.metadata && typeof messageValue.metadata === "object" ? messageValue.metadata as Record<string, unknown> : {};
      const contacts = Array.isArray(messageValue.contacts) ? messageValue.contacts : [];
      const names = new Map<string, string>();
      for (const contact of contacts) {
        if (!contact || typeof contact !== "object") continue;
        const item = contact as Record<string, unknown>;
        const profile = item.profile && typeof item.profile === "object" ? item.profile as Record<string, unknown> : {};
        if (typeof item.wa_id === "string" && typeof profile.name === "string") names.set(item.wa_id, profile.name);
      }
      if (!Array.isArray(messageValue.messages) || typeof metadata.phone_number_id !== "string") continue;
      for (const message of messageValue.messages) {
        if (!message || typeof message !== "object") continue;
        const item = message as Record<string, unknown>;
        if (typeof item.id !== "string" || typeof item.from !== "string" || typeof item.type !== "string") continue;
        events.push({
          providerMessageId: item.id,
          whatsappBusinessAccountId: typeof account.id === "string" ? account.id : undefined,
          phoneNumberId: metadata.phone_number_id,
          senderWhatsAppId: item.from,
          senderName: names.get(item.from),
          messageType: item.type,
          messageContent: messageContent(item, item.type),
          receivedAt: messageTimestamp(item.timestamp),
          rawPayload: root,
        });
      }
    }
  }
  return events;
}

function isDuplicateKeyError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "ER_DUP_ENTRY";
}

export async function storeWhatsAppInboundEvents(events: ParsedWhatsAppInboundEvent[]) {
  const database = await db.getDb();
  if (!database) throw new Error("Database not available");
  let created = 0;
  let duplicates = 0;
  for (const event of events) {
    try {
      await database.insert(whatsappInboundEvents).values({
        providerMessageId: event.providerMessageId,
        whatsappBusinessAccountId: event.whatsappBusinessAccountId ?? null,
        phoneNumberId: event.phoneNumberId,
        senderWhatsAppId: event.senderWhatsAppId,
        senderName: event.senderName ?? null,
        messageType: event.messageType,
        messageContent: event.messageContent ?? null,
        receivedAt: event.receivedAt,
        signatureVerifiedAt: new Date(),
        status: "received",
        reviewUserId: null,
        conversationSessionId: null,
        rawPayload: event.rawPayload,
      });
      created += 1;
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        duplicates += 1;
        continue;
      }
      throw error;
    }
  }
  return { created, duplicates };
}

export async function claimWhatsAppInboundEventForReview(eventId: number, reviewerId: number) {
  const database = await db.getDb();
  if (!database) throw new Error("Database not available");
  const event = (await database.select().from(whatsappInboundEvents).where(eq(whatsappInboundEvents.id, eventId)).limit(1))[0];
  if (!event) throw new Error("WhatsApp inbound event was not found");
  if (event.status !== "received") throw new Error("WhatsApp inbound event is already reviewed or unavailable");
  if (!event.messageContent?.trim()) throw new Error("WhatsApp inbound event has no text content for a review conversation");
  const update = await database.update(whatsappInboundEvents).set({ status: "reviewed", reviewUserId: reviewerId, updatedAt: new Date() }).where(and(eq(whatsappInboundEvents.id, eventId), eq(whatsappInboundEvents.status, "received")));
  const affectedRows = Array.isArray(update) ? Number((update[0] as { affectedRows?: number } | undefined)?.affectedRows ?? 0) : Number((update as { affectedRows?: number }).affectedRows ?? 0);
  if (affectedRows !== 1) throw new Error("WhatsApp inbound event was claimed by another reviewer");
  return event;
}

export async function attachWhatsAppConversation(eventId: number, conversationSessionId: number) {
  const database = await db.getDb();
  if (!database) throw new Error("Database not available");
  await database.update(whatsappInboundEvents).set({ conversationSessionId, updatedAt: new Date() }).where(eq(whatsappInboundEvents.id, eventId));
}

export async function markWhatsAppInboundEventFailed(eventId: number) {
  const database = await db.getDb();
  if (!database) return;
  await database.update(whatsappInboundEvents).set({ status: "failed", updatedAt: new Date() }).where(eq(whatsappInboundEvents.id, eventId));
}

function requireConfiguredWebhook(res: Response) {
  const configuration = configurationFromEnvironment();
  if (hasWebhookConfiguration(configuration)) return configuration;
  res.status(503).json({ error: "WhatsApp Business webhook is not configured", status: getWhatsAppConnectionStatus() });
  return null;
}

export function registerWhatsAppBusinessWebhookRoutes(app: Express) {
  app.get(WEBHOOK_PATH, (req: Request, res: Response) => {
    const configuration = requireConfiguredWebhook(res);
    if (!configuration) return;
    const mode = typeof req.query["hub.mode"] === "string" ? req.query["hub.mode"] : "";
    const verifyToken = typeof req.query["hub.verify_token"] === "string" ? req.query["hub.verify_token"] : "";
    const challenge = typeof req.query["hub.challenge"] === "string" ? req.query["hub.challenge"] : "";
    if (mode !== "subscribe" || !challenge || verifyToken !== configuration.verifyToken) {
      res.status(403).json({ error: "Webhook verification failed" });
      return;
    }
    res.status(200).type("text/plain").send(challenge);
  });

  app.post(WEBHOOK_PATH, express.raw({ type: "application/json", limit: "2mb" }), async (req: Request, res: Response) => {
    const configuration = requireConfiguredWebhook(res);
    if (!configuration) return;
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    const signature = req.header("x-hub-signature-256") ?? undefined;
    if (!verifyWhatsAppSignature(rawBody, signature, configuration.appSecret)) {
      res.status(401).json({ error: "Invalid WhatsApp webhook signature" });
      return;
    }
    try {
      const payload = JSON.parse(rawBody.toString("utf8")) as unknown;
      const events = parseWhatsAppInboundEvents(payload);
      const result = await storeWhatsAppInboundEvents(events);
      res.status(200).json({ received: true, stored: result.created, duplicates: result.duplicates, operationalRecordsCreated: 0 });
    } catch (error) {
      console.error("[WhatsApp] Signed webhook processing failed", error);
      res.status(500).json({ error: "Unable to persist signed WhatsApp webhook payload" });
    }
  });
}

export const __whatsappBusinessTestUtils = { WEBHOOK_PATH, parseWhatsAppInboundEvents, verifyWhatsAppSignature, getWhatsAppConnectionStatus, canReviewWhatsAppInbound };
