import { z } from "zod";
import type { Express, Request, Response } from "express";
import * as db from "./db";
import * as logistics from "./operationalLogistics";
import * as conversation from "./conversationalAssistant";
import { invokeLLM } from "./_core/llm";
import { sdk } from "./_core/sdk";

const decimalString = z.string().regex(/^\d+(?:\.\d{1,3})?$/);
const entryMethodSchema = z.enum(["voice", "camera", "image", "pdf", "manual"]);

const mobileDraftSchema = z.object({
  sourceType: z.enum(["ocr", "voice_command", "whatsapp"]),
  title: z.string().min(1).max(255),
  intent: z.string().min(1).max(100),
  vendorName: z.string().max(255).optional(),
  amount: z.string().regex(/^\d+(?:\.\d{1,2})?$/).optional(),
  currency: z.string().min(3).max(10).default("EGP"),
  documentDate: z.string().max(40).optional(),
  referenceNo: z.string().max(100).optional(),
  taxNo: z.string().max(100).optional(),
  rawContent: z.string().min(1).max(100_000),
  confidence: z.string().regex(/^(?:0(?:\.\d+)?|1(?:\.0+)?)$/).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const mobileAnalysisSchema = z.object({
  sourceType: z.enum(["ocr", "voice_command", "pdf"]),
  rawContent: z.string().min(1).max(100_000),
});

const operationAnalysisSchema = z.object({
  sourceType: z.enum(["vehicle_load", "receiving_note", "voice_command"]),
  rawContent: z.string().min(1).max(100_000),
});

const conversationStartSchema = z.object({
  channel: z.enum(["voice", "text", "image", "document", "message"]),
  content: z.string().min(1).max(100_000),
});

const conversationAnswerSchema = z.object({
  channel: z.enum(["voice", "text", "image", "document", "message"]),
  content: z.string().min(1).max(100_000),
});

const approvedMessageImportSchema = z.object({
  contactName: z.string().min(1).max(256),
  contactPhone: z.string().max(48).optional(),
  sourceChannel: z.enum(["manual_message", "whatsapp", "sms"]),
  content: z.string().min(1).max(100_000),
  consentConfirmed: z.literal(true),
});

const operationalLineSchema = z.object({
  materialTypeId: z.number().int().positive().optional(),
  materialName: z.string().min(1).max(256),
  quantity: decimalString,
  unit: z.string().min(1).max(32),
  unitPrice: z.string().regex(/^\d+(?:\.\d{1,2})?$/).optional(),
  totalPrice: z.string().regex(/^\d+(?:\.\d{1,2})?$/).optional(),
});

const vehicleLoadSubmissionSchema = z.object({
  customerName: z.string().min(1).max(256),
  customerTaxNumber: z.string().max(64).optional(),
  vehiclePlateNumber: z.string().min(2).max(64),
  createMissingReferences: z.boolean().default(false),
  loadDate: z.string().datetime(),
  referenceNo: z.string().max(100).optional(),
  entryMethod: entryMethodSchema,
  rawContent: z.string().min(1).max(100_000),
  sourceDocumentUrl: z.string().url().optional(),
  sourceDocumentName: z.string().max(256).optional(),
  analysisModel: z.string().max(128).optional(),
  analysisConfidence: z.string().regex(/^(?:0(?:\.\d+)?|1(?:\.0+)?)$/).optional(),
  analysisPayload: z.record(z.string(), z.unknown()).optional(),
  lines: z.array(operationalLineSchema).min(1).max(50),
  confirmed: z.literal(true),
});

const receivingNoteSubmissionSchema = vehicleLoadSubmissionSchema.extend({
  receiptDate: z.string().datetime(),
  vehicleLoadDraftId: z.number().int().positive().optional(),
}).omit({ loadDate: true });

const analysisOutputSchema = {
  type: "json_schema" as const,
  json_schema: {
    name: "narqa_mobile_intake_analysis",
    strict: true,
    schema: {
      type: "object",
      properties: {
        intent: { type: "string" }, title: { type: "string" }, vendorName: { type: "string" }, amount: { type: "string" }, currency: { type: "string" }, documentDate: { type: "string" }, referenceNo: { type: "string" }, taxNo: { type: "string" }, confidence: { type: "number", minimum: 0, maximum: 1 }, reviewSummary: { type: "string" },
      },
      required: ["intent", "title", "vendorName", "amount", "currency", "documentDate", "referenceNo", "taxNo", "confidence", "reviewSummary"],
      additionalProperties: false,
    },
  },
};

const operationAnalysisOutputSchema = {
  type: "json_schema" as const,
  json_schema: {
    name: "narqa_operational_logistics_analysis",
    strict: true,
    schema: {
      type: "object",
      properties: {
        operationType: { type: "string" }, customerName: { type: "string" }, customerTaxNumber: { type: "string" }, vehiclePlateNumber: { type: "string" }, referenceNo: { type: "string" }, operationalDate: { type: "string" }, materialName: { type: "string" }, quantity: { type: "string" }, unit: { type: "string" }, unitPrice: { type: "string" }, totalPrice: { type: "string" }, confidence: { type: "number", minimum: 0, maximum: 1 }, reviewSummary: { type: "string" },
      },
      required: ["operationType", "customerName", "customerTaxNumber", "vehiclePlateNumber", "referenceNo", "operationalDate", "materialName", "quantity", "unit", "unitPrice", "totalPrice", "confidence", "reviewSummary"],
      additionalProperties: false,
    },
  },
};

function sendUnauthorized(res: Response) { res.status(401).json({ error: "Unauthorized mobile session" }); }

async function getAuthenticatedMobileUser(req: Request, res: Response) {
  try { return await sdk.authenticateRequest(req); } catch { sendUnauthorized(res); return null; }
}

function numericAmount(line: { quantity: string; unitPrice?: string; totalPrice?: string }) {
  if (line.totalPrice) return line.totalPrice;
  if (!line.unitPrice) return undefined;
  return (Number(line.quantity) * Number(line.unitPrice)).toFixed(2);
}

async function createGenericIntakeDraft(userId: number, input: { sourceType: "ocr" | "voice_command"; title: string; intent: string; rawContent: string; confidence?: string; metadata?: Record<string, unknown> }) {
  const id = await db.createSmartIntakeDraft({ sourceType: input.sourceType, title: input.title, intent: input.intent, rawContent: input.rawContent, confidence: input.confidence ?? null, status: "pending_review", metadata: input.metadata ?? null });
  await db.logActivity({ userId, module: "smart_intake", action: "operational_draft_created", entityType: "smart_intake_draft", entityId: id, entityLabel: input.title });
  return id;
}

export function registerMobileRoutes(app: Express) {
  app.post("/api/mobile/conversations", async (req, res) => {
    const user = await getAuthenticatedMobileUser(req, res); if (!user) return;
    const parsed = conversationStartSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid conversation start", issues: parsed.error.issues }); return; }
    try { res.status(201).json(await conversation.startConversation(user.id, parsed.data)); }
    catch (error) { console.error("[Mobile] Conversation start failed", error); res.status(422).json({ error: error instanceof Error ? error.message : "Failed to start conversation" }); }
  });

  app.post("/api/mobile/conversations/:id/answers", async (req, res) => {
    const user = await getAuthenticatedMobileUser(req, res); if (!user) return;
    const id = z.coerce.number().int().positive().safeParse(req.params.id);
    const parsed = conversationAnswerSchema.safeParse(req.body);
    if (!id.success || !parsed.success) { res.status(400).json({ error: "Invalid conversation answer" }); return; }
    try { res.json(await conversation.answerConversation(user.id, id.data, parsed.data)); }
    catch (error) { console.error("[Mobile] Conversation answer failed", error); res.status(422).json({ error: error instanceof Error ? error.message : "Failed to save answer" }); }
  });

  app.post("/api/mobile/conversations/:id/confirm", async (req, res) => {
    const user = await getAuthenticatedMobileUser(req, res); if (!user) return;
    const id = z.coerce.number().int().positive().safeParse(req.params.id);
    if (!id.success) { res.status(400).json({ error: "Invalid conversation ID" }); return; }
    try { res.json(await conversation.confirmConversation(user.id, id.data)); }
    catch (error) { console.error("[Mobile] Conversation confirmation failed", error); res.status(422).json({ error: error instanceof Error ? error.message : "Failed to confirm conversation" }); }
  });

  app.post("/api/mobile/messages/import", async (req, res) => {
    const user = await getAuthenticatedMobileUser(req, res); if (!user) return;
    const parsed = approvedMessageImportSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid approved message import", issues: parsed.error.issues }); return; }
    try { res.status(201).json(await conversation.importApprovedMessage(user.id, parsed.data)); }
    catch (error) { console.error("[Mobile] Approved message import failed", error); res.status(422).json({ error: error instanceof Error ? error.message : "Failed to import message" }); }
  });

  app.get("/api/mobile/exports/operational.xlsx", async (req, res) => {
    const user = await getAuthenticatedMobileUser(req, res); if (!user) return;
    try {
      const workbook = await conversation.buildOperationalWorkbook(user.id);
      res.status(200).setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${workbook.filename}"`);
      res.setHeader("X-NARQA-Export-Id", String(workbook.exportId));
      res.send(workbook.buffer);
    } catch (error) { console.error("[Mobile] Excel export failed", error); res.status(500).json({ error: "Failed to generate operational workbook" }); }
  });

  app.get("/api/mobile/dashboard", async (req, res) => {
    const user = await getAuthenticatedMobileUser(req, res); if (!user) return;
    try {
      const [suppliers, projects, contacts, controlTower, drafts, references] = await Promise.all([db.getSuppliers(), db.getProjects(), db.getAllUsers(), db.getControlTowerStats(), db.getSmartIntakeDrafts(), logistics.getOperationalReferenceData()]);
      res.json({ user: { id: user.id, name: user.name, role: user.role }, suppliers: suppliers.slice(0, 20), projects: projects.slice(0, 20), contacts: contacts.slice(0, 20).map(contact => ({ id: contact.id, name: contact.name, email: contact.email, phone: contact.phone, role: contact.role })), controlTower, drafts: drafts.slice(0, 20), operationalReferences: references });
    } catch (error) { console.error("[Mobile] Dashboard query failed", error); res.status(500).json({ error: "Failed to load mobile dashboard" }); }
  });

  app.get("/api/mobile/operations/references", async (req, res) => {
    const user = await getAuthenticatedMobileUser(req, res); if (!user) return;
    try { res.json(await logistics.getOperationalReferenceData()); } catch (error) { console.error("[Mobile] Reference data query failed", error); res.status(500).json({ error: "Failed to load operational references" }); }
  });

  app.get("/api/mobile/operations/match", async (req, res) => {
    const user = await getAuthenticatedMobileUser(req, res); if (!user) return;
    const parsed = z.object({ customerId: z.coerce.number().int().positive(), vehicleId: z.coerce.number().int().positive() }).safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ error: "customerId and vehicleId are required" }); return; }
    try { res.json({ lines: await logistics.getVehicleQuantityMatch(parsed.data.customerId, parsed.data.vehicleId) }); } catch (error) { console.error("[Mobile] Quantity match failed", error); res.status(500).json({ error: "Failed to calculate unentered quantities" }); }
  });

  app.post("/api/mobile/drafts", async (req, res) => {
    const user = await getAuthenticatedMobileUser(req, res); if (!user) return;
    const parsed = mobileDraftSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid mobile draft", issues: parsed.error.issues }); return; }
    try {
      const input = parsed.data;
      const id = await db.createSmartIntakeDraft({ sourceType: input.sourceType, title: input.title, intent: input.intent, vendorName: input.vendorName ?? null, amount: input.amount ?? null, currency: input.currency, documentDate: input.documentDate ?? null, referenceNo: input.referenceNo ?? null, taxNo: input.taxNo ?? null, rawContent: input.rawContent, confidence: input.confidence ?? null, status: "pending_review", metadata: input.metadata ?? null });
      await db.logActivity({ userId: user.id, module: "smart_intake", action: "mobile_draft_created", entityType: "smart_intake_draft", entityId: id, entityLabel: input.title });
      res.status(201).json({ id, status: "pending_review" });
    } catch (error) { console.error("[Mobile] Draft creation failed", error); res.status(500).json({ error: "Failed to create mobile draft" }); }
  });

  app.post("/api/mobile/operations/vehicle-loads", async (req, res) => {
    const user = await getAuthenticatedMobileUser(req, res); if (!user) return;
    const parsed = vehicleLoadSubmissionSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid vehicle load", issues: parsed.error.issues }); return; }
    try {
      const input = parsed.data;
      const resolved = await logistics.resolveCustomerAndVehicle({ customerName: input.customerName, customerTaxNumber: input.customerTaxNumber, vehiclePlateNumber: input.vehiclePlateNumber, createMissing: input.createMissingReferences });
      const smartIntakeDraftId = await createGenericIntakeDraft(user.id, { sourceType: input.entryMethod === "voice" ? "voice_command" : "ocr", title: `حمولة ${resolved.vehicle.plateNumber}`, intent: "vehicle_load", rawContent: input.rawContent, confidence: input.analysisConfidence, metadata: { entryMethod: input.entryMethod, customerId: resolved.customer.id, vehicleId: resolved.vehicle.id, sourceDocumentUrl: input.sourceDocumentUrl ?? null } });
      const id = await logistics.createVehicleLoadDraft({ draftNumber: `VLD-${Date.now()}`, customerId: resolved.customer.id, vehicleId: resolved.vehicle.id, smartIntakeDraftId, loadDate: new Date(input.loadDate), referenceNo: input.referenceNo ?? null, sourceDocumentUrl: input.sourceDocumentUrl ?? null, sourceDocumentName: input.sourceDocumentName ?? null, entryMethod: input.entryMethod, analysisModel: input.analysisModel ?? null, analysisConfidence: input.analysisConfidence ?? null, analysisPayload: input.analysisPayload ?? null, rawContent: input.rawContent, status: "pending_review", createdByUserId: user.id, confirmedByUserId: null, confirmedAt: null, lines: input.lines.map(line => ({ ...line, totalPrice: numericAmount(line) ?? null })) });
      await logistics.confirmVehicleLoadDraft(id, user.id);
      await logistics.recordOperationalInputEvent({ userId: user.id, entryMethod: input.entryMethod, sourceType: "vehicle_load", sourceEntityId: id, smartIntakeDraftId, commandText: input.entryMethod === "voice" ? input.rawContent : null, analysisModel: input.analysisModel ?? null, analysisConfidence: input.analysisConfidence ?? null, action: "vehicle_load_confirmed", outcome: "confirmed", metadata: { customerId: resolved.customer.id, vehicleId: resolved.vehicle.id, createdCustomer: resolved.createdCustomer, createdVehicle: resolved.createdVehicle } });
      const match = await logistics.getVehicleQuantityMatch(resolved.customer.id, resolved.vehicle.id);
      res.status(201).json({ id, status: "confirmed", customer: resolved.customer, vehicle: resolved.vehicle, match, createdCustomer: resolved.createdCustomer, createdVehicle: resolved.createdVehicle });
    } catch (error) { console.error("[Mobile] Vehicle load creation failed", error); res.status(422).json({ error: error instanceof Error ? error.message : "Failed to create vehicle load" }); }
  });

  app.post("/api/mobile/operations/receiving-notes", async (req, res) => {
    const user = await getAuthenticatedMobileUser(req, res); if (!user) return;
    const parsed = receivingNoteSubmissionSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid receiving note", issues: parsed.error.issues }); return; }
    try {
      const input = parsed.data;
      const resolved = await logistics.resolveCustomerAndVehicle({ customerName: input.customerName, customerTaxNumber: input.customerTaxNumber, vehiclePlateNumber: input.vehiclePlateNumber, createMissing: input.createMissingReferences });
      const smartIntakeDraftId = await createGenericIntakeDraft(user.id, { sourceType: input.entryMethod === "voice" ? "voice_command" : "ocr", title: `إذن استلام ${resolved.vehicle.plateNumber}`, intent: "receiving_note", rawContent: input.rawContent, confidence: input.analysisConfidence, metadata: { entryMethod: input.entryMethod, customerId: resolved.customer.id, vehicleId: resolved.vehicle.id, sourceDocumentUrl: input.sourceDocumentUrl ?? null } });
      const id = await logistics.createReceivingNote({ receiptNumber: `RN-${Date.now()}`, customerId: resolved.customer.id, vehicleId: resolved.vehicle.id, vehicleLoadDraftId: input.vehicleLoadDraftId ?? null, receiptDate: new Date(input.receiptDate), referenceNo: input.referenceNo ?? null, sourceDocumentUrl: input.sourceDocumentUrl ?? null, sourceDocumentName: input.sourceDocumentName ?? null, entryMethod: input.entryMethod, analysisModel: input.analysisModel ?? null, analysisConfidence: input.analysisConfidence ?? null, analysisPayload: input.analysisPayload ?? null, status: "pending_review", createdByUserId: user.id, confirmedByUserId: null, confirmedAt: null, lines: input.lines.map(line => ({ materialTypeId: line.materialTypeId, materialName: line.materialName, quantity: line.quantity, unit: line.unit, unitPrice: line.unitPrice })) });
      await logistics.confirmReceivingNote(id, user.id);
      await logistics.recordOperationalInputEvent({ userId: user.id, entryMethod: input.entryMethod, sourceType: "receiving_note", sourceEntityId: id, smartIntakeDraftId, commandText: input.entryMethod === "voice" ? input.rawContent : null, analysisModel: input.analysisModel ?? null, analysisConfidence: input.analysisConfidence ?? null, action: "receiving_note_confirmed", outcome: "confirmed", metadata: { customerId: resolved.customer.id, vehicleId: resolved.vehicle.id, createdCustomer: resolved.createdCustomer, createdVehicle: resolved.createdVehicle } });
      const match = await logistics.getVehicleQuantityMatch(resolved.customer.id, resolved.vehicle.id);
      res.status(201).json({ id, status: "confirmed", customer: resolved.customer, vehicle: resolved.vehicle, match, createdCustomer: resolved.createdCustomer, createdVehicle: resolved.createdVehicle });
    } catch (error) { console.error("[Mobile] Receiving note creation failed", error); res.status(422).json({ error: error instanceof Error ? error.message : "Failed to create receiving note" }); }
  });

  app.post("/api/mobile/ai/analyze", async (req, res) => {
    const user = await getAuthenticatedMobileUser(req, res); if (!user) return;
    const parsed = mobileAnalysisSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid mobile analysis input", issues: parsed.error.issues }); return; }
    try {
      const { sourceType, rawContent } = parsed.data;
      const result = await invokeLLM({ model: "gpt-5-mini", messages: [{ role: "system", content: "You are NARQA EBOS intake analysis. Extract only evidence present in Arabic or English input. Never invent values. Return empty strings for unknown fields. This is a review draft, not an accounting posting. Classify intent with a short lower_snake_case label." }, { role: "user", content: `Source: ${sourceType}\nContent:\n${rawContent}` }], response_format: analysisOutputSchema });
      const content = result.choices[0]?.message.content; if (typeof content !== "string") throw new Error("AI response was not text");
      const analysis = JSON.parse(content) as Record<string, unknown>;
      await db.logActivity({ userId: user.id, module: "smart_intake", action: "mobile_ai_analysis_requested", entityType: "mobile_analysis", entityId: 0, entityLabel: sourceType });
      res.json({ analysis, model: result.model, requiresReview: true });
    } catch (error) { console.error("[Mobile] AI analysis failed", error); res.status(502).json({ error: "Project AI analysis is temporarily unavailable" }); }
  });

  app.post("/api/mobile/ai/analyze-operation", async (req, res) => {
    const user = await getAuthenticatedMobileUser(req, res); if (!user) return;
    const parsed = operationAnalysisSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid operational analysis input", issues: parsed.error.issues }); return; }
    try {
      const result = await invokeLLM({ model: "gpt-5", messages: [{ role: "system", content: "You are NARQA EBOS operational logistics analysis. Extract only evidence in the supplied Arabic or English document/voice text. Identify a vehicle load, a receiving note, or an unsupported command. Never invent values. Return ISO datetime when explicit; otherwise empty string. Quantity and prices must be plain decimal strings or empty strings. This is an editable review proposal only and never posts automatically." }, { role: "user", content: `Source: ${parsed.data.sourceType}\nContent:\n${parsed.data.rawContent}` }], response_format: operationAnalysisOutputSchema, reasoning: { effort: "low" } });
      const content = result.choices[0]?.message.content; if (typeof content !== "string") throw new Error("AI response was not text");
      const analysis = JSON.parse(content) as Record<string, unknown>;
      await db.logActivity({ userId: user.id, module: "operational_logistics", action: "mobile_operational_analysis_requested", entityType: "mobile_analysis", entityId: 0, entityLabel: parsed.data.sourceType });
      res.json({ analysis, model: result.model, requiresReview: true });
    } catch (error) { console.error("[Mobile] Operational AI analysis failed", error); res.status(502).json({ error: "Operational AI analysis is temporarily unavailable" }); }
  });
}

export const __mobileRouteTestUtils = { mobileDraftSchema, mobileAnalysisSchema, operationAnalysisSchema, vehicleLoadSubmissionSchema, receivingNoteSubmissionSchema };
