import { CommandActionPlan, ParsedCommand } from "./types";

const arabicDigits: Record<string, string> = {
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
};

const wordThousands: Record<string, number> = {
  "واحد": 1, "واحدة": 1, "اثنين": 2, "اثنان": 2, "ثلاثة": 3,
  "ثلاث": 3, "اربعة": 4, "أربعة": 4, "خمسة": 5, "ستة": 6,
  "سبعة": 7, "ثمانية": 8, "تسعة": 9, "عشرة": 10, "عشر": 10,
  "عشرين": 20, "عشرون": 20, "ثلاثين": 30, "ثلاثون": 30,
  "اربعين": 40, "أربعين": 40, "خمسين": 50, "خمسون": 50,
};

export function normalizeArabic(text: string) {
  return text
    .trim()
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/[٠-٩]/g, (digit) => arabicDigits[digit])
    .replace(/[إأآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ");
}

export function extractEgpAmount(text: string): number | null {
  const normalized = normalizeArabic(text);
  const numeric = normalized.match(/(\d+(?:\.\d+)?)\s*(?:الف|الاف|جنيه|جنيها)/);
  if (numeric) {
    const raw = Number(numeric[1]);
    return /(?:الف|الاف)/.test(numeric[0]) ? raw * 1000 : raw;
  }

  const wordMatch = normalized.match(/([\u0621-\u064Aa-zA-Z ]+)\s+(?:الف|الاف)\s*(?:جنيه|جنيها)?/);
  if (!wordMatch) return null;
  const words = wordMatch[1].trim().split(" ");
  const thousandPart = words.map((word) => wordThousands[word] ?? 0).reduce((sum, value) => sum + value, 0);
  return thousandPart > 0 ? thousandPart * 1000 : null;
}

function notRecognized(originalText: string): ParsedCommand {
  return {
    originalText,
    normalizedText: normalizeArabic(originalText),
    intent: "unknown",
    confidence: 0,
    status: "rejected",
    summary: "لم يتم التعرف على أمر قابل للتنفيذ.",
    data: {},
    requiredConfirmation: false,
    reasons: ["النية أو المبلغ أو الجهة غير واضحة."],
  };
}

export function parseArabicVoiceCommand(originalText: string): ParsedCommand {
  const text = normalizeArabic(originalText);
  const money = extractEgpAmount(text);
  const installment = text.match(/قسط.*?(?:على|علي)\s+(?:سيارة|مركبة)\s+(.+)$/);
  if (installment && money) {
    const originalInstallment = originalText.trim().match(/قسط.*?(?:على|علي)\s+(?:سيارة|مركبة)\s+(.+)$/);
    const assetName = (originalInstallment?.[1] ?? installment[1]).trim();
    return {
      originalText,
      normalizedText: text,
      intent: "create_installment",
      confidence: 0.84,
      status: "needs_entity_resolution",
      summary: `إنشاء مسودة قسط بقيمة ${money.toLocaleString("en-US")} جنيه على ${assetName}.`,
      data: { money: { amount: money, currency: "EGP" }, assetName },
      requiredConfirmation: true,
      reasons: ["يلزم مطابقة اسم السيارة أو العميل بسجل قائم قبل الحفظ."],
    };
  }

  const payment = text.match(/(?:استلام|تسجيل) دفعة.*?(?:من)\s+(.+)$/);
  if (payment && money) {
    const customerName = payment[1].trim();
    const paymentMethod = text.includes("فودافون كاش") ? "vodafone_cash" : undefined;
    return {
      originalText,
      normalizedText: text,
      intent: "record_customer_payment",
      confidence: paymentMethod ? 0.9 : 0.78,
      status: "needs_entity_resolution",
      summary: `تسجيل مسودة دفعة بقيمة ${money.toLocaleString("en-US")} جنيه من ${customerName}.`,
      data: { money: { amount: money, currency: "EGP" }, customerName, paymentMethod },
      requiredConfirmation: true,
      reasons: ["يلزم مطابقة العميل والتحقق من مرجع التحويل قبل اعتماد التحصيل."],
    };
  }

  return notRecognized(originalText);
}

export function buildCommandActionPlan(text: string): CommandActionPlan {
  const parsed = parseArabicVoiceCommand(text);
  if (parsed.intent === "create_installment") {
    return {
      intent: parsed.intent,
      status: parsed.status,
      targetEntity: "asset",
      action: "create_draft_installment",
      requiredConfirmation: true,
      parsed,
    };
  }
  if (parsed.intent === "record_customer_payment") {
    return {
      intent: parsed.intent,
      status: parsed.status,
      targetEntity: "customer",
      action: "create_draft_payment",
      requiredConfirmation: true,
      parsed,
    };
  }
  return { intent: "unknown", status: "rejected", targetEntity: null, action: "none", requiredConfirmation: false, parsed };
}
