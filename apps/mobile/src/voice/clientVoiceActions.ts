export type ClientVoiceDestination = "home" | "cost" | "commands" | "intake" | "invoice" | "sources" | "suppliers" | "customers" | "projects" | "reports" | "messages" | "design";

export interface ClientNavigationAction {
  kind: "navigate";
  destination: ClientVoiceDestination;
  spokenConfirmation: string;
}

export interface ClientDesignAction {
  kind: "select_design";
  design: "command_center" | "operational_canvas" | "adaptive_orbit";
  spokenConfirmation: string;
}

export type ClientVoiceAction = ClientNavigationAction | ClientDesignAction;

function normalizeForMatching(value: string) {
  return value.replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/\s+/g, " ").trim().toLowerCase();
}

export function parseClientVoiceAction(source: string): ClientVoiceAction | null {
  const text = normalizeForMatching(source);
  const requestsDesignChange = /(اختر|فعل|طبق|غير).*(تصميم|شكل|واجه)/.test(text);
  if (requestsDesignChange && /(مركز العمليات|command center)/.test(text)) return { kind: "select_design", design: "command_center", spokenConfirmation: "تم اختيار تصميم مركز العمليات على هذا الجهاز." };
  if (requestsDesignChange && /(مساحة الاعمال|operational canvas)/.test(text)) return { kind: "select_design", design: "operational_canvas", spokenConfirmation: "تم اختيار تصميم مساحة الأعمال على هذا الجهاز." };
  if (requestsDesignChange && /(المساعد التكيفي|adaptive orbit)/.test(text)) return { kind: "select_design", design: "adaptive_orbit", spokenConfirmation: "تم اختيار تصميم المساعد التكيفي على هذا الجهاز." };

  const hasNavigationVerb = /(افتح|انتقل|اذهب|اعرض|ارجع)/.test(text);
  const directRoutes: Array<{ test: RegExp; destination: ClientVoiceDestination; label: string; direct?: boolean }> = [
    { test: /(الرئيسية|مركز التشغيل)/, destination: "home", label: "الصفحة الرئيسية" },
    { test: /(الموردين|الموردون)/, destination: "suppliers", label: "الموردين" },
    { test: /(مصادر التوريد|المصادر)/, destination: "sources", label: "مصادر التوريد" },
    { test: /(العملاء|جهات الاتصال)/, destination: "customers", label: "العملاء" },
    { test: /(المشاريع|المشروع)/, destination: "projects", label: "المشاريع" },
    { test: /(التقارير|التقرير المالي|كشف حساب)/, destination: "reports", label: "التقارير" },
    { test: /(الرسائل|واتساب|sms)/, destination: "messages", label: "الرسائل المعتمدة" },
    { test: /(التصميم|شكل التطبيق|تنسيق التطبيق)/, destination: "design", label: "اختيار التصميم" },
    { test: /(حاسبة التكلفة|حساب التكلفة)/, destination: "cost", label: "حاسبة التكلفة" },
    { test: /(الاوامر الصوتية|الادخال الصوتي)/, destination: "commands", label: "الأوامر الصوتية" },
    { test: /(الصور|المستندات|تحليل مستند|تحليل صورة|ocr|pdf)/, destination: "intake", label: "تحليل الصور والمستندات", direct: true },
    { test: /(اصدار فاتورة)/, destination: "invoice", label: "مسودة الفاتورة", direct: true },
  ];
  const matched = directRoutes.find((route) => route.test.test(text) && (hasNavigationVerb || route.direct));
  return matched ? { kind: "navigate", destination: matched.destination, spokenConfirmation: `تم فتح ${matched.label} داخل التطبيق.` } : null;
}
