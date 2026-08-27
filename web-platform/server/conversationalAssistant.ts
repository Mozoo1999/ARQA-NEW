import { desc, eq } from "drizzle-orm";
import * as XLSX from "xlsx";
import * as db from "./db";
import {
  approvedMessageImports,
  conversationSessions,
  conversationTurns,
  operationalExcelExports,
  operationalInputEvents,
  vehicleTrips,
} from "../drizzle/schema";
import * as logistics from "./operationalLogistics";

export type ConversationChannel = "voice" | "text" | "image" | "document" | "message";
export type ConversationIntent = "supplier_registration" | "vehicle_trip" | "vehicle_load" | "receiving_note" | "payment_draft" | "invoice_draft" | "account_statement" | "approval" | "general_draft";
export type ConversationFields = Record<string, string>;

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
  const value = normalizedText(text).toLowerCase();
  if (/(مورد جديد|اضافة مورد|إضافة مورد|تسجيل مورد)/.test(value)) return "supplier_registration";
  if (/(?:اضافة|إضافة|ادراج|إدراج|تسجيل)?\s*(?:نقلة|رحلة)(?:\s+سيارة)?/.test(value)) return "vehicle_trip";
  if (/(حمولة|شحنة|سيارة)/.test(value)) return "vehicle_load";
  if (/(اذن استلام|إذن استلام|استلام)/.test(value)) return "receiving_note";
  if (/(دفعة|دفع|سداد)/.test(value)) return "payment_draft";
  if (/(فاتورة|اصدار فاتورة|إصدار فاتورة)/.test(value)) return "invoice_draft";
  if (/(كشف حساب)/.test(value)) return "account_statement";
  if (/(اعتماد|موافقة)/.test(value)) return "approval";
  return "general_draft";
}

function supplyCategory(value: string) {
  const text = normalizedText(value).toLowerCase();
  if (/(خامات|خام|مواد)/.test(text)) return "خامات";
  if (/(معدات|معدة)/.test(text)) return "معدات";
  if (/(سيارات|سيارة|نقل)/.test(text)) return "سيارات";
  if (/(فنيين|فني|عمالة)/.test(text)) return "فنيين";
  if (/(اخرى|أخرى|اخر|آخر)/.test(text)) return "أخرى";
  return undefined;
}

function supplierNameFrom(text: string) {
  const matched = normalizedText(text).match(/(?:مورد جديد|اضافة مورد|إضافة مورد|تسجيل مورد)\s+(.+)/i);
  return matched?.[1]?.trim() || undefined;
}

function initialFields(intent: ConversationIntent, source: string): ConversationFields {
  const fields: ConversationFields = {};
  if (intent === "supplier_registration") {
    const name = supplierNameFrom(source);
    if (name) fields.name = name;
  }
  return fields;
}

function firstMissing(intent: ConversationIntent, fields: ConversationFields) {
  if (intent === "supplier_registration") {
    if (!fields.name) return { key: "name", question: "ما اسم المورد الذي تريد تسجيله؟" };
    if (!fields.supplyCategory) return { key: "supplyCategory", question: "هل التوريد خامات، معدات، سيارات، فنيين، أم أخرى؟" };
    return null;
  }
  const requirements: Record<Exclude<ConversationIntent, "supplier_registration">, Array<{ key: string; question: string }>> = {
    vehicle_trip: [
      { key: "vehiclePlateNumber", question: "ما رقم السيارة أو رقم اللوحة؟" },
      { key: "loadingLocation", question: "ما مكان الحمولة؟" },
      { key: "unloadingLocation", question: "ما مكان التفريغ؟" },
      { key: "customerName", question: "ما اسم العميل؟" },
      { key: "cubicCapacity", question: "ما تكعيب السيارة؟ اذكر رقماً أكبر من صفر." },
      { key: "tripCount", question: "ما عدد النقلات؟ اذكر عدداً صحيحاً أكبر من صفر." },
      { key: "notes", question: "ما الملاحظات؟ قل لا توجد إذا لم تكن هناك ملاحظات." },
    ],
    vehicle_load: [
      { key: "customerName", question: "ما اسم العميل المرتبط بالحمولة؟" },
      { key: "vehiclePlateNumber", question: "ما رقم لوحة السيارة؟" },
      { key: "materialName", question: "ما نوع الخام أو المادة؟" },
      { key: "quantity", question: "ما كمية الحمولة ووحدتها؟" },
      { key: "unitPrice", question: "ما سعر الوحدة أو اكتب 0 إن لم يتوفر؟" },
      { key: "operationalDate", question: "ما تاريخ الحمولة؟" },
    ],
    receiving_note: [
      { key: "customerName", question: "ما اسم العميل أو الجهة المستلمة؟" },
      { key: "vehiclePlateNumber", question: "ما رقم لوحة السيارة؟" },
      { key: "materialName", question: "ما نوع الخام أو المادة المستلمة؟" },
      { key: "quantity", question: "ما الكمية ووحدتها؟" },
      { key: "operationalDate", question: "ما تاريخ إذن الاستلام؟" },
    ],
    payment_draft: [
      { key: "beneficiary", question: "لمن هذه الدفعة؟" },
      { key: "amount", question: "ما قيمة الدفعة؟" },
      { key: "paymentDate", question: "ما تاريخ الدفعة؟" },
    ],
    invoice_draft: [
      { key: "customerName", question: "لمن ستصدر الفاتورة؟" },
      { key: "amount", question: "ما إجمالي قيمة الفاتورة؟" },
      { key: "invoiceDate", question: "ما تاريخ الفاتورة؟" },
    ],
    account_statement: [
      { key: "customerName", question: "لأي عميل تريد كشف الحساب؟" },
      { key: "period", question: "ما الفترة المطلوبة لكشف الحساب؟" },
    ],
    approval: [{ key: "subject", question: "ما البيانات أو المسودة التي تريد اعتمادها؟" }],
    general_draft: [{ key: "purpose", question: "ما العملية التي تريد تنفيذها: مورد، دفعة، إذن استلام، فاتورة، كشف حساب، أم اعتماد؟" }],
  };
  return requirements[intent].find(requirement => !fields[requirement.key]) ?? null;
}

function buildSummary(intent: ConversationIntent, fields: ConversationFields) {
  if (intent === "supplier_registration") return `مسودة مورد: ${fields.name ?? "غير محدد"} — فئة التوريد: ${fields.supplyCategory ?? "غير محددة"}.`;
  if (intent === "vehicle_trip") return `مسودة نقلة سيارة: السيارة ${fields.vehiclePlateNumber ?? "غير محددة"}، من ${fields.loadingLocation ?? "مكان حمولة غير محدد"} إلى ${fields.unloadingLocation ?? "مكان تفريغ غير محدد"}، العميل ${fields.customerName ?? "غير محدد"}، التكعيب ${fields.cubicCapacity ?? "غير محدد"}، عدد النقلات ${fields.tripCount ?? "غير محدد"}، الملاحظات ${fields.notes ?? "غير محددة"}.`;
  if (intent === "vehicle_load") return `مسودة حمولة: ${fields.customerName ?? "عميل غير محدد"}، سيارة ${fields.vehiclePlateNumber ?? "غير محددة"}، ${fields.materialName ?? "مادة غير محددة"}، كمية ${fields.quantity ?? "غير محددة"}.`;
  if (intent === "receiving_note") return `مسودة إذن استلام: ${fields.customerName ?? "جهة غير محددة"}، سيارة ${fields.vehiclePlateNumber ?? "غير محددة"}، كمية ${fields.quantity ?? "غير محددة"}.`;
  return `مسودة ${intent}: ${Object.entries(fields).map(([key, value]) => `${key}: ${value}`).join("، ") || "بانتظار استكمال المعلومات"}.`;
}

export function deriveConversationProgress(source: string, existing?: { intent?: ConversationIntent; fields?: ConversationFields; awaiting?: string | null }): ConversationProgress {
  const intent = existing?.intent ?? classifyIntent(source);
  const fields = { ...(existing?.fields ?? initialFields(intent, source)) };
  if (existing?.awaiting) {
    if (existing.awaiting === "supplyCategory") fields.supplyCategory = supplyCategory(source) ?? source;
    else if (existing.awaiting === "cubicCapacity") { const value = Number(normalizedText(source).match(/\d+(?:\.\d+)?/)?.[0]); if (Number.isFinite(value) && value > 0) fields.cubicCapacity = String(value); }
    else if (existing.awaiting === "tripCount") { const value = Number(normalizedText(source).match(/\d+/)?.[0]); if (Number.isInteger(value) && value > 0) fields.tripCount = String(value); }
    else fields[existing.awaiting] = normalizedText(source);
  }
  const missing = firstMissing(intent, fields);
  return { intent, fields, nextQuestion: missing?.question ?? null, summary: buildSummary(intent, fields), readyForReview: !missing };
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
  const progress = deriveConversationProgress(input.content);
  const database = await db.getDb();
  if (!database) throw new Error("Database not available");
  const result = await database.insert(conversationSessions).values({ userId, channel: input.channel, status: progress.readyForReview ? "ready_for_review" : "collecting", intent: progress.intent, sourceTranscript: input.content, collectedFields: progress.fields, nextQuestion: progress.nextQuestion, summary: progress.summary, analysisModel: "narqa-conversation-rules" });
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
  const progress = deriveConversationProgress(input.content, { intent: session.intent as ConversationIntent, fields, awaiting: session.nextQuestion ? firstMissing(session.intent as ConversationIntent, fields)?.key : null });
  await database.update(conversationSessions).set({ status: progress.readyForReview ? "ready_for_review" : "collecting", collectedFields: progress.fields, nextQuestion: progress.nextQuestion, summary: progress.summary }).where(eq(conversationSessions.id, sessionId));
  await appendTurn(sessionId, "user", input.channel, input.content, progress.fields);
  if (progress.nextQuestion) await appendTurn(sessionId, "assistant", "text", progress.nextQuestion);
  return { sessionId, ...progress };
}

export async function confirmConversation(userId: number, sessionId: number) {
  const { database, session } = await getSessionOrThrow(sessionId, userId);
  if (session.status !== "ready_for_review") throw new Error("Conversation requires additional information before confirmation");
  const intent = session.intent as ConversationIntent;
  const fields = (session.collectedFields ?? {}) as ConversationFields;
  let outcome: { entityType: string; entityId: number; status: string };
  if (intent === "supplier_registration") {
    const categoryName = fields.supplyCategory;
    if (!fields.name || !categoryName) throw new Error("Supplier name and supply category are required");
    const categories = await db.getSupplierCategories();
    let categoryId = categories.find(category => category.name === categoryName)?.id;
    if (!categoryId) categoryId = await db.createSupplierCategory({ name: categoryName, description: "Created after confirmed conversational intake" });
    const supplierId = await db.createSupplier({ code: `SUP-CONV-${Date.now()}`, name: fields.name, categoryId, contactPerson: fields.contactPerson ?? null, phone: fields.phone ?? null, status: "active", country: "Saudi Arabia", notes: `Created from conversation session ${sessionId}` });
    outcome = { entityType: "supplier", entityId: supplierId, status: "executed" };
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
  } else {
    const draftId = await db.createSmartIntakeDraft({ sourceType: session.channel === "voice" ? "voice_command" : "ocr", title: `مسودة محادثة: ${intent}`, intent, rawContent: session.sourceTranscript ?? "", status: "pending_review", metadata: { conversationSessionId: sessionId, fields } });
    outcome = { entityType: "smart_intake_draft", entityId: draftId, status: "pending_review" };
  }
  await database.update(conversationSessions).set({ status: outcome.status === "executed" ? "executed" : "confirmed", confirmationAt: new Date(), executedAt: outcome.status === "executed" ? new Date() : null }).where(eq(conversationSessions.id, sessionId));
  await appendTurn(sessionId, "system", "text", `تمت الموافقة: ${outcome.entityType} #${outcome.entityId}`);
  await db.logActivity({ userId, module: "conversation", action: "confirmed_execution", entityType: outcome.entityType, entityId: outcome.entityId, entityLabel: `conversation-${sessionId}` });
  return outcome;
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
