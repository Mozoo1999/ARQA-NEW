import { FinancialSignal, KnownIdentity, NotificationEvent, NotificationSuggestion } from "./types";

const digits: Record<string, string> = {
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
};

const wordThousands: Record<string, number> = {
  "عشرة": 10, "عشر": 10, "عشرين": 20, "عشرون": 20,
  "ثلاثين": 30, "ثلاثون": 30,
};

function normalize(text: string) {
  return text
    .trim()
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/[٠-٩]/g, (digit) => digits[digit])
    .replace(/[إأآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ");
}

function amount(text: string): number | null {
  const value = normalize(text);
  const numeric = value.match(/(\d+(?:\.\d+)?)\s*(?:الف|الاف|جنيه|جنيها)/);
  if (numeric) return Number(numeric[1]) * (/(?:الف|الاف)/.test(numeric[0]) ? 1000 : 1);

  const word = value.match(/(عشرة|عشر|عشرين|عشرون|ثلاثين|ثلاثون)\s+(?:الف|الاف)/);
  return word ? wordThousands[word[1]] * 1000 : null;
}

function phone(text: string): string | undefined {
  const match = normalize(text).match(/(?:رقم|من|الى|إلى)\s*(01\d{5,10})/);
  return match?.[1];
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "").replace(/^20/, "0");
}

export function parseVodafoneCashNotification(event: NotificationEvent): FinancialSignal | null {
  const text = `${event.title ?? ""} ${event.body}`;
  const normalized = normalize(text);
  if (!normalized.includes("فودافون") && !normalized.includes("vodafone")) return null;

  const parsedAmount = amount(normalized);
  if (!parsedAmount) return null;

  const direction = /(?:تم استلام|استلمت|وارد)/.test(normalized)
    ? "received"
    : /(?:تم ارسال|تم تحويل|ارسلت|صادر)/.test(normalized)
      ? "sent"
      : null;
  if (!direction) return null;

  return {
    provider: "vodafone_cash",
    direction,
    amount: parsedAmount,
    currency: "EGP",
    counterpartyPhone: phone(normalized),
    confidence: 0.82,
    source: event,
  };
}

export function buildNotificationSuggestion(
  signal: FinancialSignal,
  identities: KnownIdentity[],
): NotificationSuggestion {
  const match = signal.counterpartyPhone
    ? identities.find((identity) => normalizePhone(identity.phone).endsWith(normalizePhone(signal.counterpartyPhone!)))
    : undefined;

  if (signal.direction === "received" && match?.kind === "customer") {
    return {
      action: "create_customer_payment_draft",
      title: `هل تم استلام ${signal.amount.toLocaleString("en-US")} جنيه من ${match.displayName}؟`,
      explanation: `تمت مطابقة الرقم مع ${match.relationshipLabel ?? "جهة اتصال العميل"}.`,
      confidence: 0.9,
      target: match,
      financialSignal: signal,
      requiresApproval: true,
    };
  }

  if (signal.direction === "sent" && match?.kind === "asset") {
    return {
      action: "create_asset_payment_draft",
      title: `هل أُرسلت دفعة ${signal.amount.toLocaleString("en-US")} جنيه إلى ${match.displayName}؟`,
      explanation: `تمت مطابقة الرقم مع ${match.relationshipLabel ?? "الأصل المسجل"}.`,
      confidence: 0.88,
      target: match,
      financialSignal: signal,
      requiresApproval: true,
    };
  }

  return {
    action: "review_unmatched_signal",
    title: `راجع عملية فودافون كاش بقيمة ${signal.amount.toLocaleString("en-US")} جنيه.`,
    explanation: "لم يمكن ربط الرقم بجهة واحدة موثوقة.",
    confidence: signal.confidence,
    target: null,
    financialSignal: signal,
    requiresApproval: true,
  };
}
