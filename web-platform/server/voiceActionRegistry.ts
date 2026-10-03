export type ConversationChannel = "voice" | "text" | "image" | "document" | "message";
export type VoiceRole = "admin" | "manager" | "user";
export type VoiceActionId =
  | "supplier_registration"
  | "customer_registration"
  | "project_registration"
  | "vehicle_trip"
  | "vehicle_load"
  | "receiving_note"
  | "payment_draft"
  | "invoice_draft"
  | "account_statement"
  | "approval"
  | "navigation"
  | "document_analysis"
  | "report_export"
  | "settings_update"
  | "formatting_update"
  | "approved_message_intake"
  | "general_draft";

export type VoiceExecutionMode = "server_entity" | "review_draft" | "client_only";
export type VoiceFieldKind = "text" | "supply_category" | "positive_decimal" | "non_negative_decimal" | "positive_integer" | "date";
export type VoiceFields = Record<string, string>;

export type OperationalConversationContext = {
  primaryLanguage: "ar" | "en";
  dialect: string;
  sector: "construction" | "supply" | "logistics" | "general";
  businessLevel: "construction_company" | "supply_office" | "logistics_operator" | "general";
  defaultUnit: string;
  materialVocabulary: string[];
  configured: boolean;
};

export interface VoiceFieldDefinition {
  key: string;
  question: string;
  kind: VoiceFieldKind;
  requiredWhen?: (context: OperationalConversationContext) => boolean;
}

export interface VoiceActionDefinition {
  id: VoiceActionId;
  label: string;
  aliases: RegExp[];
  fields: VoiceFieldDefinition[];
  allowedRoles: VoiceRole[];
  requiresExplicitApproval: boolean;
  executionMode: VoiceExecutionMode;
  summary: (fields: VoiceFields) => string;
}

const arabicDigits: Record<string, string> = {
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
};

/** Preserves Arabic spelling for stored answers and spoken summaries. */
export function normalizeArabicInput(value: string): string {
  return value
    .replace(/[٠-٩٫]/g, (character) => character === "٫" ? "." : arabicDigits[character] ?? character)
    .replace(/\s+/g, " ")
    .trim();
}

function normalizedForMatching(value: string): string {
  return normalizeArabicInput(value)
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .toLowerCase();
}

export function supplyCategory(value: string): string | undefined {
  const text = normalizedForMatching(value);
  if (/(خامات|خام|مواد)/.test(text)) return "خامات";
  if (/(معدات|معدة)/.test(text)) return "معدات";
  if (/(سيارات|سيارة|نقل)/.test(text)) return "سيارات";
  if (/(فنيين|فني|عمالة)/.test(text)) return "فنيين";
  if (/(اخرى|اخر)/.test(text)) return "أخرى";
  return undefined;
}

function supplierNameFrom(source: string): string | undefined {
  const name = normalizeArabicInput(source).match(/(?:مورد جديد|اضافة مورد|إضافة مورد|تسجيل مورد)\s+(.+)/i)?.[1]?.trim();
  return name || undefined;
}

function entityNameFrom(source: string, pattern: RegExp): string | undefined {
  const name = normalizeArabicInput(source).match(pattern)?.[1]?.trim();
  return name || undefined;
}

const everyRole: VoiceRole[] = ["admin", "manager", "user"];
const managerOrAdmin: VoiceRole[] = ["admin", "manager"];
const field = (key: string, question: string, kind: VoiceFieldKind = "text", requiredWhen?: VoiceFieldDefinition["requiredWhen"]): VoiceFieldDefinition => ({ key, question, kind, requiredWhen });
const action = (definition: VoiceActionDefinition) => definition;
const supplyOfficeOnly = (context: OperationalConversationContext) => context.businessLevel === "supply_office";
const vehicleLoadPricingFields = [
  field("quarryOrCrusher", "ما اسم المحجر أو الكسارة؟ قل لا يوجد إذا لم ترتبط الحمولة بمحجر أو كسارة."),
  field("quarryDeductionQuantity", "ما كمية خصم المحجر أو الكسارة؟ قل صفراً إذا لا يوجد خصم.", "non_negative_decimal"),
  field("transportPrice", "ما سعر النقل للعملية؟ قل صفراً إذا لم يتوفر.", "non_negative_decimal"),
  field("quarryPrice", "ما تكلفة الحجر أو المحجر للعملية؟ قل صفراً إذا لم يتوفر.", "non_negative_decimal"),
  field("expenseAmount", "ما المصاريف الإضافية للعملية؟ قل صفراً إذا لا توجد مصاريف.", "non_negative_decimal"),
  field("totalOperationPrice", "ما إجمالي سعر النقل والحجر والمصاريف للعملية؟", "non_negative_decimal"),
] as const;

export const voiceActionRegistry: Record<VoiceActionId, VoiceActionDefinition> = {
  supplier_registration: action({
    id: "supplier_registration", label: "تسجيل مورد", aliases: [/(مورد جديد|اضافة مورد|تسجيل مورد)/i],
    fields: [field("name", "ما اسم المورد الذي تريد تسجيله؟"), field("supplyCategory", "هل التوريد خامات، معدات، سيارات، فنيين، أم أخرى؟", "supply_category")],
    allowedRoles: everyRole, requiresExplicitApproval: true, executionMode: "server_entity",
    summary: (fields) => `مسودة مورد: ${fields.name ?? "غير محدد"} — فئة التوريد: ${fields.supplyCategory ?? "غير محددة"}.`,
  }),
  customer_registration: action({
    id: "customer_registration", label: "تسجيل عميل", aliases: [/(عميل جديد|اضافة عميل|تسجيل عميل)/i],
    fields: [field("name", "ما اسم العميل الذي تريد تسجيله؟"), field("taxNumber", "ما الرقم الضريبي؟ قل لا يوجد إذا لم يتوفر."), field("phone", "ما رقم الهاتف؟ قل لا يوجد إذا لم يتوفر.")],
    allowedRoles: everyRole, requiresExplicitApproval: true, executionMode: "server_entity",
    summary: (fields) => `مسودة عميل: ${fields.name ?? "غير محدد"}، الرقم الضريبي ${fields.taxNumber ?? "غير محدد"}، الهاتف ${fields.phone ?? "غير محدد"}.`,
  }),
  project_registration: action({
    id: "project_registration", label: "مسودة مشروع", aliases: [/(مشروع جديد|اضافة مشروع|تسجيل مشروع)/i],
    fields: [field("name", "ما اسم المشروع؟"), field("branchName", "ما الفرع المرتبط بالمشروع؟"), field("description", "ما وصف المشروع أو هدفه؟")],
    allowedRoles: managerOrAdmin, requiresExplicitApproval: true, executionMode: "review_draft",
    summary: (fields) => `مسودة مشروع: ${fields.name ?? "غير محدد"}، الفرع ${fields.branchName ?? "غير محدد"}، الوصف ${fields.description ?? "غير محدد"}.`,
  }),
  vehicle_trip: action({
    id: "vehicle_trip", label: "نقلة سيارة", aliases: [/(?:اضافة|ادراج|تسجيل)?\s*(?:نقلة|رحلة)(?:\s+سيارة)?/i],
    fields: [field("vehiclePlateNumber", "ما رقم السيارة أو رقم اللوحة؟"), field("loadingLocation", "ما مكان الحمولة؟"), field("unloadingLocation", "ما مكان التفريغ؟"), field("customerName", "ما اسم العميل؟"), field("cubicCapacity", "ما تكعيب السيارة؟ اذكر رقماً أكبر من صفر.", "positive_decimal"), field("tripCount", "ما عدد النقلات؟ اذكر عدداً صحيحاً أكبر من صفر.", "positive_integer"), field("notes", "ما الملاحظات؟ قل لا توجد إذا لم تكن هناك ملاحظات.")],
    allowedRoles: everyRole, requiresExplicitApproval: true, executionMode: "server_entity",
    summary: (fields) => `مسودة نقلة سيارة: السيارة ${fields.vehiclePlateNumber ?? "غير محددة"}، من ${fields.loadingLocation ?? "مكان حمولة غير محدد"} إلى ${fields.unloadingLocation ?? "مكان تفريغ غير محدد"}، العميل ${fields.customerName ?? "غير محدد"}، التكعيب ${fields.cubicCapacity ?? "غير محدد"}، عدد النقلات ${fields.tripCount ?? "غير محدد"}، الملاحظات ${fields.notes ?? "غير محددة"}.`,
  }),
  vehicle_load: action({
    id: "vehicle_load", label: "حمولة سيارة", aliases: [/(حمولة|شحنة|سيارة)/i],
    fields: [field("customerName", "ما اسم العميل المرتبط بالحمولة؟"), field("vehiclePlateNumber", "ما رقم لوحة السيارة؟"), field("materialName", "ما نوع الخام أو المادة؟"), field("quantity", "ما كمية الحمولة؟ اذكر رقماً أكبر من صفر.", "positive_decimal"), field("unit", "ما وحدة القياس، مثل طن أو متر مكعب؟"), field("unitPrice", "ما سعر الوحدة؟ قل صفراً إذا لم يتوفر.", "non_negative_decimal"), field("operationalDate", "ما تاريخ الحمولة؟ قل اليوم أو اذكر التاريخ بصيغة سنة-شهر-يوم.", "date"), ...vehicleLoadPricingFields.map(item => ({ ...item, requiredWhen: supplyOfficeOnly }))],
    allowedRoles: everyRole, requiresExplicitApproval: true, executionMode: "review_draft",
    summary: (fields) => `مسودة حمولة: ${fields.customerName ?? "عميل غير محدد"}، سيارة ${fields.vehiclePlateNumber ?? "غير محددة"}، ${fields.materialName ?? "مادة غير محددة"}، كمية ${fields.quantity ?? "غير محددة"}.${fields.totalOperationPrice !== undefined ? ` إجمالي العملية ${fields.totalOperationPrice}.` : ""}`,
  }),
  receiving_note: action({
    id: "receiving_note", label: "إذن استلام", aliases: [/(اذن استلام|استلام)/i],
    fields: [field("customerName", "ما اسم العميل أو الجهة المستلمة؟"), field("vehiclePlateNumber", "ما رقم لوحة السيارة؟"), field("materialName", "ما نوع الخام أو المادة المستلمة؟"), field("quantity", "ما الكمية المستلمة؟ اذكر رقماً أكبر من صفر.", "positive_decimal"), field("unit", "ما وحدة القياس، مثل طن أو متر مكعب؟"), field("unitPrice", "ما سعر الوحدة؟ قل صفراً إذا لم يتوفر.", "non_negative_decimal"), field("operationalDate", "ما تاريخ إذن الاستلام؟ قل اليوم أو اذكر التاريخ بصيغة سنة-شهر-يوم.", "date")],
    allowedRoles: everyRole, requiresExplicitApproval: true, executionMode: "review_draft",
    summary: (fields) => `مسودة إذن استلام: ${fields.customerName ?? "جهة غير محددة"}، سيارة ${fields.vehiclePlateNumber ?? "غير محددة"}، كمية ${fields.quantity ?? "غير محددة"}.`,
  }),
  payment_draft: action({
    id: "payment_draft", label: "مسودة دفعة", aliases: [/(دفعة|دفع|سداد)/i],
    fields: [field("beneficiary", "لمن هذه الدفعة؟"), field("amount", "ما قيمة الدفعة؟", "positive_decimal"), field("paymentDate", "ما تاريخ الدفعة؟")],
    allowedRoles: managerOrAdmin, requiresExplicitApproval: true, executionMode: "review_draft",
    summary: (fields) => `مسودة دفعة: ${fields.beneficiary ?? "مستفيد غير محدد"}، قيمة ${fields.amount ?? "غير محددة"}، تاريخ ${fields.paymentDate ?? "غير محدد"}.`,
  }),
  invoice_draft: action({
    id: "invoice_draft", label: "مسودة فاتورة", aliases: [/(فاتورة|اصدار فاتورة)/i],
    fields: [field("customerName", "لمن ستصدر الفاتورة؟"), field("amount", "ما إجمالي قيمة الفاتورة؟", "positive_decimal"), field("invoiceDate", "ما تاريخ الفاتورة؟")],
    allowedRoles: managerOrAdmin, requiresExplicitApproval: true, executionMode: "review_draft",
    summary: (fields) => `مسودة فاتورة: العميل ${fields.customerName ?? "غير محدد"}، القيمة ${fields.amount ?? "غير محددة"}، التاريخ ${fields.invoiceDate ?? "غير محدد"}.`,
  }),
  account_statement: action({ id: "account_statement", label: "كشف حساب", aliases: [/(كشف حساب)/i], fields: [field("customerName", "لأي عميل تريد كشف الحساب؟"), field("period", "ما الفترة المطلوبة لكشف الحساب؟")], allowedRoles: managerOrAdmin, requiresExplicitApproval: true, executionMode: "review_draft", summary: (fields) => `مسودة كشف حساب: العميل ${fields.customerName ?? "غير محدد"}، الفترة ${fields.period ?? "غير محددة"}.` }),
  approval: action({ id: "approval", label: "اعتماد", aliases: [/(اعتماد|موافقة)/i], fields: [field("subject", "ما البيانات أو المسودة التي تريد اعتمادها؟")], allowedRoles: managerOrAdmin, requiresExplicitApproval: true, executionMode: "review_draft", summary: (fields) => `مسودة اعتماد: ${fields.subject ?? "غير محددة"}.` }),
  navigation: action({ id: "navigation", label: "تنقل داخل التطبيق", aliases: [/(افتح|انتقل|اذهب).*(المورد|العميل|المشروع|التقرير|المستند|الاعداد)/i], fields: [field("destination", "إلى أي مساحة تريد الانتقال: الموردون، العملاء، المشاريع، التقارير أم المستندات؟")], allowedRoles: everyRole, requiresExplicitApproval: false, executionMode: "client_only", summary: (fields) => `طلب تنقل داخل التطبيق إلى: ${fields.destination ?? "غير محدد"}.` }),
  document_analysis: action({ id: "document_analysis", label: "تحليل مستند", aliases: [/(حلل|تحليل).*(صورة|مستند|pdf|فاتورة|ايصال)/i], fields: [field("source", "هل تريد التقاط صورة أو اختيار ملف أو مستند PDF للتحليل؟")], allowedRoles: everyRole, requiresExplicitApproval: false, executionMode: "client_only", summary: (fields) => `طلب تحليل مستند: ${fields.source ?? "بانتظار اختيار المصدر"}.` }),
  report_export: action({ id: "report_export", label: "تقرير وتصدير", aliases: [/(تقرير|تصدير|اكسل|excel)/i], fields: [field("reportPeriod", "ما الفترة التي تريدها في التقرير؟")], allowedRoles: everyRole, requiresExplicitApproval: true, executionMode: "review_draft", summary: (fields) => `طلب تقرير للفترة: ${fields.reportPeriod ?? "غير محددة"}.` }),
  settings_update: action({ id: "settings_update", label: "تعديل الإعدادات", aliases: [/(اعدادات|غير|عدل).*(شعار|اسم الشركة|الصلاح|اعداد)/i], fields: [field("change", "ما الإعداد الذي تريد تعديله؟")], allowedRoles: ["admin"], requiresExplicitApproval: true, executionMode: "review_draft", summary: (fields) => `طلب تعديل إعداد: ${fields.change ?? "غير محدد"}.` }),
  formatting_update: action({ id: "formatting_update", label: "تعديل التنسيق", aliases: [/(تنسيق|الوان|تصميم|شكل الشاشة)/i], fields: [field("change", "ما تنسيق الشاشة أو التقرير الذي تريد تغييره؟")], allowedRoles: managerOrAdmin, requiresExplicitApproval: true, executionMode: "review_draft", summary: (fields) => `طلب تعديل تنسيق: ${fields.change ?? "غير محدد"}.` }),
  approved_message_intake: action({ id: "approved_message_intake", label: "إدخال رسالة معتمدة", aliases: [/(رسالة|واتساب|whatsapp|sms)/i], fields: [field("contact", "ما جهة الاتصال التي وافقت على استخدام رسالتها؟")], allowedRoles: everyRole, requiresExplicitApproval: true, executionMode: "review_draft", summary: (fields) => `مسودة رسالة معتمدة من: ${fields.contact ?? "جهة اتصال غير محددة"}.` }),
  general_draft: action({ id: "general_draft", label: "مسودة عامة", aliases: [], fields: [field("purpose", "ما العملية التي تريد تنفيذها: مورد، دفعة، إذن استلام، فاتورة، كشف حساب، أم اعتماد؟")], allowedRoles: everyRole, requiresExplicitApproval: true, executionMode: "review_draft", summary: (fields) => `مسودة عامة: ${fields.purpose ?? "بانتظار استكمال العملية"}.` }),
};

const detectionOrder: VoiceActionId[] = ["supplier_registration", "customer_registration", "project_registration", "vehicle_trip", "receiving_note", "invoice_draft", "account_statement", "payment_draft", "settings_update", "formatting_update", "navigation", "document_analysis", "report_export", "approved_message_intake", "approval", "vehicle_load", "general_draft"];

export function detectVoiceAction(source: string): VoiceActionDefinition {
  const text = normalizedForMatching(source);
  return detectionOrder.map((id) => voiceActionRegistry[id]).find((item) => item.aliases.some((alias) => alias.test(text))) ?? voiceActionRegistry.general_draft;
}

export function initialVoiceFields(actionId: VoiceActionId, source: string, context?: OperationalConversationContext): VoiceFields {
  const name = actionId === "supplier_registration"
    ? supplierNameFrom(source)
    : actionId === "customer_registration"
      ? entityNameFrom(source, /(?:عميل جديد|اضافة عميل|إضافة عميل|تسجيل عميل)\s+(.+)/i)
      : actionId === "project_registration"
        ? entityNameFrom(source, /(?:مشروع جديد|اضافة مشروع|إضافة مشروع|تسجيل مشروع)\s+(.+)/i)
        : undefined;
  const defaults: VoiceFields = name ? { name } : {};
  if ((actionId === "vehicle_load" || actionId === "receiving_note") && context?.defaultUnit) defaults.unit = context.defaultUnit;
  return defaults;
}

export function normalizeVoiceField(kind: VoiceFieldKind, source: string): string | undefined {
  const value = normalizeArabicInput(source);
  if (!value) return undefined;
  if (kind === "supply_category") return supplyCategory(value) ?? value;
  if (kind === "positive_decimal") {
    const number = Number(value.match(/\d+(?:\.\d+)?/)?.[0]);
    return Number.isFinite(number) && number > 0 ? String(number) : undefined;
  }
  if (kind === "non_negative_decimal") {
    if (/^(صفر|لا يوجد|غير متوفر)$/.test(normalizedForMatching(value))) return "0";
    const number = Number(value.match(/\d+(?:\.\d+)?/)?.[0]);
    return Number.isFinite(number) && number >= 0 ? String(number) : undefined;
  }
  if (kind === "positive_integer") {
    const number = Number(value.match(/\d+/)?.[0]);
    return Number.isInteger(number) && number > 0 ? String(number) : undefined;
  }
  if (kind === "date") {
    if (/اليوم/.test(value)) return new Date().toISOString().slice(0, 10);
    const dateMatch = value.match(/(\d{4})[-\/]([01]?\d)[-\/]([0-3]?\d)/);
    if (!dateMatch) return undefined;
    const date = new Date(`${dateMatch[1]}-${dateMatch[2].padStart(2, "0")}-${dateMatch[3].padStart(2, "0")}T00:00:00.000Z`);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString().slice(0, 10);
  }
  return value;
}

export function getNextRequiredField(actionId: VoiceActionId, fields: VoiceFields, context: OperationalConversationContext = { primaryLanguage: "ar", dialect: "ar-SA", sector: "general", businessLevel: "general", defaultUnit: "", materialVocabulary: [], configured: false }): VoiceFieldDefinition | null {
  return voiceActionRegistry[actionId].fields.find((item) => (item.requiredWhen?.(context) ?? true) && !fields[item.key]) ?? null;
}

export function applyVoiceAnswer(actionId: VoiceActionId, fields: VoiceFields, fieldKey: string, source: string): VoiceFields {
  const definition = voiceActionRegistry[actionId].fields.find((item) => item.key === fieldKey);
  const value = definition ? normalizeVoiceField(definition.kind, source) : undefined;
  return value && definition ? { ...fields, [definition.key]: value } : fields;
}

export function getVoiceFieldQuestion(field: VoiceFieldDefinition, context: OperationalConversationContext): string {
  if (field.key === "unit" && context.businessLevel === "construction_company") return "في ملف شركة المقاولات، ما وحدة كمية الخام؟ استخدم متر مكعب لسن الزلط أو الرمل، أو صحح الوحدة إذا اختلفت المادة.";
  if (field.key === "materialName" && context.materialVocabulary.length) return `${field.question} المواد الشائعة في ملفك: ${context.materialVocabulary.join("، ")}.`;
  return field.question;
}

export function buildVoiceSummary(actionId: VoiceActionId, fields: VoiceFields): string { return voiceActionRegistry[actionId].summary(fields); }
export function canExecuteVoiceAction(actionId: VoiceActionId, role: string): boolean { return voiceActionRegistry[actionId].allowedRoles.includes(role as VoiceRole); }
