import { desc, eq } from "drizzle-orm";
import * as XLSX from "xlsx";
import * as db from "./db";
import {
  applyVoiceAnswer,
  buildVoiceSummary,
  canExecuteVoiceAction,
  detectVoiceAction,
  getNextRequiredField,
  initialVoiceFields,
  getVoiceFieldQuestion,
  supplyCategory as resolveSupplyCategory,
  voiceActionRegistry,
} from "./voiceActionRegistry";
import type { ConversationChannel as RegisteredConversationChannel, OperationalConversationContext, VoiceActionId, VoiceFields } from "./voiceActionRegistry";
import {
  approvedMessageImports,
  conversationSessions,
  conversationTurns,
  customers,
  operationalExcelExports,
  operationalInputEvents,
  vehicleTrips,
} from "../drizzle/schema";
import * as logistics from "./operationalLogistics";
import { DEFAULT_OPERATIONAL_PROFILE, getOperationalProfile } from "./operationalProfile";

export type ConversationChannel = RegisteredConversationChannel;
export type ConversationIntent = VoiceActionId;
export type ConversationFields = VoiceFields;

export interface ConversationProgress {
  intent: ConversationIntent;
  fields: ConversationFields;
  nextQuestion: string | null;
  summary: string;
  readyForReview: boolean;
}

const arabicDigits: Record<string, string> = { "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9" };

function normalizedText(value: string) {
  return value.replace(/[٠-٩]/g, digit => arabicDigits[digit] ?? digit).replace(/\s+/g, " ").trim();
}

function classifyIntent(text: string): ConversationIntent {
  return detectVoiceAction(text).id;
}

function supplyCategory(value: string) {
  return resolveSupplyCategory(value);
}

function supplierNameFrom(text: string) {
  const matched = normalizedText(text).match(/(?:مورد جديد|اضافة مورد|إضافة مورد|تسجيل مورد)\s+(.+)/i);
  return matched?.[1]?.trim() || undefined;
}

function initialFields(intent: ConversationIntent, source: string, context: OperationalConversationContext): ConversationFields {
  return initialVoiceFields(intent, source, context);
}

function firstMissing(intent: ConversationIntent, fields: ConversationFields, context: OperationalConversationContext) {
  return getNextRequiredField(intent, fields, context);
}

function buildSummary(intent: ConversationIntent, fields: ConversationFields) {
  return buildVoiceSummary(intent, fields);
}

export function deriveConversationProgress(source: string, existing?: { intent?: ConversationIntent; fields?: ConversationFields; awaiting?: string | null; context?: OperationalConversationContext }): ConversationProgress {
  const intent = existing?.intent ?? classifyIntent(source);
  const context = existing?.context ?? DEFAULT_OPERATIONAL_PROFILE;
  let fields = { ...(existing?.fields ?? initialFields(intent, source, context)) };
  if (existing?.awaiting) fields = applyVoiceAnswer(intent, fields, existing.awaiting, source);
  const missing = firstMissing(intent, fields, context);
  return { intent, fields, nextQuestion: missing ? getVoiceFieldQuestion(missing, context) : null, summary: buildSummary(intent, fields), readyForReview: !missing };
}

async function getSessionOrThrow(sessionId: number, userId: number) {
  const database = await db.getDb();
  if (!database) throw new Error("Database not available");
  const session = (await database.select().from(conversationSessions).where(eq(conversationSessions.id, sessionId)).limit(1))[0];
  if (!session || session.userId !== userId) throw new Error("Conversation session not found");
  return { database, session };
}

async function appendTurn(sessionId: number, speaker: "assistant" | "user" | "system", modality: ConversationChannel, content: string, normalizedFields?: ConversationFields) {
  const database = await db.getDb();
  if (!database) throw new Error("Database not available");
  const turns = await database.select().from(conversationTurns).where(eq(conversationTurns.conversationSessionId, sessionId)).orderBy(desc(conversationTurns.turnNumber));
  await database.insert(conversationTurns).values({ conversationSessionId: sessionId, turnNumber: (turns[0]?.turnNumber ?? 0) + 1, speaker, modality, content, normalizedFields: normalizedFields ?? null });
}

export async function startConversation(userId: number, input: { channel: ConversationChannel; content: string }) {
  const context = await getOperationalProfile(userId);
  const progress = deriveConversationProgress(input.content, { context });
  const database = await db.getDb();
  if (!database) throw new Error("Database not available");
  const result = await database.insert(conversationSessions).values({ userId, channel: input.channel, status: progress.readyForReview ? "ready_for_review" : "collecting", intent: progress.intent, sourceTranscript: input.content, collectedFields: progress.fields, contextSnapshot: context, nextQuestion: progress.nextQuestion, summary: progress.summary, analysisModel: "narqa-conversation-rules" });
  const sessionId = Number(result[0].insertId);
  await appendTurn(sessionId, "user", input.channel, input.content, progress.fields);
  if (progress.nextQuestion) await appendTurn(sessionId, "assistant", "text", progress.nextQuestion);
  await db.logActivity({ userId, module: "conversation", action: "session_started", entityType: "conversation_session", entityId: sessionId, entityLabel: progress.intent });
  return { sessionId, ...progress };
}

export async function answerConversation(userId: number, sessionId: number, input: { channel: ConversationChannel; content: string }) {
  const { database, session } = await getSessionOrThrow(sessionId, userId);
  if (session.status !== "collecting") throw new Error("Conversation is not collecting answers");
  const fields = (session.collectedFields ?? {}) as ConversationFields;
  const context = (session.contextSnapshot ?? DEFAULT_OPERATIONAL_PROFILE) as OperationalConversationContext;
  const progress = deriveConversationProgress(input.content, { intent: session.intent as ConversationIntent, fields, awaiting: session.nextQuestion ? firstMissing(session.intent as ConversationIntent, fields, context)?.key : null, context });
  await database.update(conversationSessions).set({ status: progress.readyForReview ? "ready_for_review" : "collecting", collectedFields: progress.fields, nextQuestion: progress.nextQuestion, summary: progress.summary }).where(eq(conversationSessions.id, sessionId));
  await appendTurn(sessionId, "user", input.channel, input.content, progress.fields);
  if (progress.nextQuestion) await appendTurn(sessionId, "assistant", "text", progress.nextQuestion);
  return { sessionId, ...progress };
}

function operationalDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new Error("Operational date is invalid");
  return date;
}

export async function confirmConversation(userId: number, role: string, sessionId: number) {
  const { database, session } = await getSessionOrThrow(sessionId, userId);
  if (session.status !== "ready_for_review") throw new Error("Conversation requires additional information before confirmation");
  const intent = session.intent as ConversationIntent;
  const action = voiceActionRegistry[intent];
  if (!action) throw new Error("Conversation action is not registered for execution");
  if (action.executionMode === "client_only") throw new Error("هذا الأمر ينفذ داخل التطبيق ولا يسمح بإنشاء سجل أو إدراج عبر واجهة الموافقة.");
  if (!canExecuteVoiceAction(intent, role)) {
    await database.update(conversationSessions).set({ status: "failed" }).where(eq(conversationSessions.id, sessionId));
    await appendTurn(sessionId, "system", "text", "تم منع التنفيذ: لا يملك المستخدم الدور المطلوب لهذه العملية.");
    await db.logActivity({ userId, module: "conversation", action: "blocked_unauthorized_execution", entityType: "conversation_session", entityId: sessionId, entityLabel: intent });
    throw new Error("ليس لديك تفويض لتنفيذ هذه العملية عبر الأوامر الصوتية.");
  }
  const fields = (session.collectedFields ?? {}) as ConversationFields;
  let outcome: { entityType: string; entityId: number; status: string };
  if (intent === "supplier_registration") {
    const categoryName = fields.supplyCategory;
    if (!fields.name || !categoryName) throw new Error("Supplier name and supply category are required");
    const categories = await db.getSupplierCategories();
    let categoryId = categories.find(category => category.name === categoryName)?.id;
    if (!categoryId) categoryId = await db.createSupplierCategory({ name: categoryName, description: "Created after confirmed conversational intake" });
    const supplierId = await db.createSupplier({ code: `SUP-CONV-${Date.now()}`, name: fields.name, categoryId, contactPerson: fields.contactPerson ?? null, phone: fields.phone ?? null, status: "active", country: "Saudi Arabia", notes: `Created from conversation session ${sessionId}` });
    await database.insert(operationalInputEvents).values({ userId, entryMethod: session.channel === "voice" ? "voice" : "manual", sourceType: "voice_command", sourceEntityId: supplierId, commandText: session.sourceTranscript ?? "", analysisModel: session.analysisModel ?? "narqa-conversation-rules", action: "supplier_confirmed", outcome: "confirmed", metadata: { conversationSessionId: sessionId, fields } });
    outcome = { entityType: "supplier", entityId: supplierId, status: "executed" };
  } else if (intent === "customer_registration") {
    if (!fields.name || !fields.taxNumber || !fields.phone) throw new Error("Customer fields are incomplete");
    const optional = (value: string) => /^(لا يوجد|غير متوفر)$/i.test(value.trim()) ? null : value.trim();
    const result = await database.insert(customers).values({ code: `CUS-CONV-${Date.now()}`, name: fields.name.trim(), taxNumber: optional(fields.taxNumber), phone: optional(fields.phone), status: "active" });
    const customerId = Number(result[0].insertId);
    await database.insert(operationalInputEvents).values({ userId, entryMethod: session.channel === "voice" ? "voice" : "manual", sourceType: "voice_command", sourceEntityId: customerId, commandText: session.sourceTranscript ?? "", analysisModel: session.analysisModel ?? "narqa-conversation-rules", action: "customer_confirmed", outcome: "confirmed", metadata: { conversationSessionId: sessionId, fields } });
    outcome = { entityType: "customer", entityId: customerId, status: "executed" };
  } else if (intent === "vehicle_trip") {
    const required = ["vehiclePlateNumber", "loadingLocation", "unloadingLocation", "customerName", "cubicCapacity", "tripCount", "notes"] as const;
    if (required.some(key => !fields[key])) throw new Error("Vehicle trip fields are incomplete");
    const cubicCapacity = Number(fields.cubicCapacity); const tripCount = Number(fields.tripCount);
    if (!(cubicCapacity > 0) || !Number.isInteger(tripCount) || tripCount <= 0) throw new Error("Vehicle trip cubic capacity and count must be positive");
    const resolved = await logistics.resolveCustomerAndVehicle({ customerName: fields.customerName, vehiclePlateNumber: fields.vehiclePlateNumber, createMissing: true });
    const now = new Date();
    const result = await database.insert(vehicleTrips).values({ tripNumber: `TRP-${Date.now()}`, vehicleId: resolved.vehicle.id, customerId: resolved.customer.id, conversationSessionId: sessionId, loadingLocation: fields.loadingLocation, unloadingLocation: fields.unloadingLocation, cubicCapacity: fields.cubicCapacity, tripCount, notes: fields.notes, entryMethod: session.channel === "voice" ? "voice" : "text", sourceTranscript: session.sourceTranscript ?? "", status: "confirmed", createdByUserId: userId, confirmedByUserId: userId, confirmedAt: now });
    const tripId = Number(result[0].insertId);
    await database.insert(operationalInputEvents).values({ userId, entryMethod: session.channel === "voice" ? "voice" : "manual", sourceType: "vehicle_trip", sourceEntityId: tripId, commandText: session.sourceTranscript ?? "", analysisModel: session.analysisModel ?? "narqa-conversation-rules", action: "vehicle_trip_confirmed", outcome: "confirmed", metadata: { conversationSessionId: sessionId, customerId: resolved.customer.id, vehicleId: resolved.vehicle.id, loadingLocation: fields.loadingLocation, unloadingLocation: fields.unloadingLocation, cubicCapacity, tripCount } });
    outcome = { entityType: "vehicle_trip", entityId: tripId, status: "executed" };
  } else if (intent === "vehicle_load" || intent === "receiving_note") {
    const required = ["customerName", "vehiclePlateNumber", "materialName", "quantity", "unit", "unitPrice", "operationalDate"] as const;
    if (required.some(key => fields[key] === undefined || fields[key] === "")) throw new Error("Operational load or receiving fields are incomplete");
    const quantity = Number(fields.quantity); const unitPrice = Number(fields.unitPrice);
    if (!(quantity > 0) || !Number.isFinite(unitPrice) || unitPrice < 0) throw new Error("Operational quantity and price are invalid");
    const resolved = await logistics.resolveCustomerAndVehicle({ customerName: fields.customerName, vehiclePlateNumber: fields.vehiclePlateNumber, createMissing: true });
    const entryMethod = session.channel === "voice" ? "voice" : "manual";
    const provenance = { conversationSessionId: sessionId, customerId: resolved.customer.id, vehicleId: resolved.vehicle.id, fields };
    if (intent === "vehicle_load") {
      const entityId = await logistics.createVehicleLoadDraft({ draftNumber: `LOAD-CONV-${Date.now()}`, customerId: resolved.customer.id, vehicleId: resolved.vehicle.id, smartIntakeDraftId: null, loadDate: operationalDate(fields.operationalDate), referenceNo: null, sourceDocumentUrl: null, sourceDocumentName: null, entryMethod, analysisModel: session.analysisModel ?? "narqa-conversation-rules", analysisConfidence: null, analysisPayload: provenance, rawContent: session.sourceTranscript ?? "", status: "pending_review", createdByUserId: userId, confirmedByUserId: null, confirmedAt: null, lines: [{ materialName: fields.materialName, quantity: fields.quantity, unit: fields.unit, unitPrice: fields.unitPrice, totalPrice: String(quantity * unitPrice) }] });
      await logistics.confirmVehicleLoadDraft(entityId, userId);
      await logistics.recordOperationalInputEvent({ userId, entryMethod, sourceType: "vehicle_load", sourceEntityId: entityId, commandText: session.sourceTranscript ?? "", analysisModel: session.analysisModel ?? "narqa-conversation-rules", action: "vehicle_load_confirmed", outcome: "confirmed", metadata: provenance });
      outcome = { entityType: "vehicle_load", entityId, status: "executed" };
    } else {
      const entityId = await logistics.createReceivingNote({ receiptNumber: `RCV-CONV-${Date.now()}`, customerId: resolved.customer.id, vehicleId: resolved.vehicle.id, vehicleLoadDraftId: null, receiptDate: operationalDate(fields.operationalDate), referenceNo: null, sourceDocumentUrl: null, sourceDocumentName: null, entryMethod, analysisModel: session.analysisModel ?? "narqa-conversation-rules", analysisConfidence: null, analysisPayload: provenance, status: "pending_review", createdByUserId: userId, confirmedByUserId: null, confirmedAt: null, lines: [{ materialName: fields.materialName, quantity: fields.quantity, unit: fields.unit, unitPrice: fields.unitPrice }] });
      await logistics.confirmReceivingNote(entityId, userId);
      await logistics.recordOperationalInputEvent({ userId, entryMethod, sourceType: "receiving_note", sourceEntityId: entityId, commandText: session.sourceTranscript ?? "", analysisModel: session.analysisModel ?? "narqa-conversation-rules", action: "receiving_note_confirmed", outcome: "confirmed", metadata: provenance });
      outcome = { entityType: "receiving_note", entityId, status: "executed" };
    }
  } else {
    const draftId = await db.createSmartIntakeDraft({ sourceType: session.channel === "voice" ? "voice_command" : "ocr", title: `مسودة محادثة: ${intent}`, intent, rawContent: session.sourceTranscript ?? "", status: "pending_review", metadata: { conversationSessionId: sessionId, fields } });
    await database.insert(operationalInputEvents).values({ userId, entryMethod: session.channel === "voice" ? "voice" : "manual", sourceType: "voice_command", sourceEntityId: draftId, smartIntakeDraftId: draftId, commandText: session.sourceTranscript ?? "", analysisModel: session.analysisModel ?? "narqa-conversation-rules", action: `${intent}_draft_confirmed`, outcome: "pending_review", metadata: { conversationSessionId: sessionId, fields } });
    outcome = { entityType: "smart_intake_draft", entityId: draftId, status: "pending_review" };
  }
  await database.update(conversationSessions).set({ status: outcome.status === "executed" ? "executed" : "confirmed", confirmationAt: new Date(), executedAt: outcome.status === "executed" ? new Date() : null }).where(eq(conversationSessions.id, sessionId));
  await appendTurn(sessionId, "system", "text", `تمت الموافقة: ${outcome.entityType} #${outcome.entityId}`);
  await db.logActivity({ userId, module: "conversation", action: "confirmed_execution", entityType: outcome.entityType, entityId: outcome.entityId, entityLabel: `conversation-${sessionId}` });
  return outcome;
}

export async function rejectConversation(userId: number, sessionId: number) {
  const { database, session } = await getSessionOrThrow(sessionId, userId);
  if (session.status !== "collecting" && session.status !== "ready_for_review") throw new Error("Conversation cannot be rejected in its current state");
  await database.update(conversationSessions).set({ status: "cancelled", updatedAt: new Date() }).where(eq(conversationSessions.id, sessionId));
  await appendTurn(sessionId, "system", "text", "رفض المستخدم المسودة صراحةً. لم يتم إنشاء أو تعديل أي سجل تشغيلي.");
  await db.logActivity({ userId, module: "conversation", action: "rejected_without_execution", entityType: "conversation_session", entityId: sessionId, entityLabel: session.intent ?? "unknown" });
  return { entityType: "conversation_session", entityId: sessionId, status: "cancelled" };
}

export async function importApprovedMessage(userId: number, input: { contactName: string; contactPhone?: string; sourceChannel: "manual_message" | "whatsapp" | "sms"; content: string; consentConfirmed: boolean }) {
  if (!input.consentConfirmed) throw new Error("User consent confirmation is required before importing message content");
  const started = await startConversation(userId, { channel: "message", content: input.content });
  const database = await db.getDb();
  if (!database) throw new Error("Database not available");
  const result = await database.insert(approvedMessageImports).values({ conversationSessionId: started.sessionId, userId, contactName: input.contactName, contactPhone: input.contactPhone ?? null, sourceChannel: input.sourceChannel, consentConfirmedAt: new Date(), messageContent: input.content, status: "imported" });
  await db.logActivity({ userId, module: "messaging", action: "approved_message_imported", entityType: "approved_message_import", entityId: Number(result[0].insertId), entityLabel: input.contactName });
  return { importId: Number(result[0].insertId), conversation: started };
}

export function buildOperationalWorkbookBuffer(input: { operationalRows: Record<string, unknown>[]; auditRows: Record<string, unknown>[]; turnRows: Record<string, unknown>[]; exceptionRows: Record<string, unknown>[] }) {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(input.operationalRows), "Operational Records");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(input.auditRows), "Conversation Audit");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(input.turnRows), "Conversation Turns");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(input.exceptionRows), "Exceptions");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export async function buildOperationalWorkbook(userId: number) {
  const database = await db.getDb();
  if (!database) throw new Error("Database not available");
  const [events, sessions, turns] = await Promise.all([
    database.select().from(operationalInputEvents).where(eq(operationalInputEvents.userId, userId)).orderBy(desc(operationalInputEvents.createdAt)),
    database.select().from(conversationSessions).where(eq(conversationSessions.userId, userId)).orderBy(desc(conversationSessions.createdAt)),
    database.select().from(conversationTurns).orderBy(desc(conversationTurns.createdAt)),
  ]);
  const sessionIds = new Set(sessions.map(session => session.id));
  const buffer = buildOperationalWorkbookBuffer({
    operationalRows: events.map(event => ({ id: event.id, date: event.createdAt, method: event.entryMethod, source: event.sourceType, action: event.action, outcome: event.outcome, entityId: event.sourceEntityId, analysisModel: event.analysisModel, command: event.commandText })),
    auditRows: sessions.map(session => ({ id: session.id, date: session.createdAt, channel: session.channel, intent: session.intent, status: session.status, summary: session.summary, confirmationAt: session.confirmationAt, executedAt: session.executedAt })),
    turnRows: turns.filter(turn => sessionIds.has(turn.conversationSessionId)).map(turn => ({ sessionId: turn.conversationSessionId, turn: turn.turnNumber, date: turn.createdAt, speaker: turn.speaker, modality: turn.modality, content: turn.content })),
    exceptionRows: sessions.filter(session => session.status === "failed" || session.status === "cancelled").map(session => ({ sessionId: session.id, status: session.status, intent: session.intent, summary: session.summary, updatedAt: session.updatedAt })),
  });
  const exportRow = await database.insert(operationalExcelExports).values({ userId, recordCount: events.length, status: "created" });
  return { buffer, filename: `narqa-operational-records-${Date.now()}.xlsx`, exportId: Number(exportRow[0].insertId), recordCount: events.length };
}

export const __conversationTestUtils = { classifyIntent, deriveConversationProgress, supplyCategory };
