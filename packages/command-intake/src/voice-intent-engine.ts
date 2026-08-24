export interface VoiceIntentResult {
  intent: "create_purchase_request" | "log_collection" | "update_cost" | "query_status" | "unknown";
  confidence: number;
  summary: string;
  extractedData: Record<string, any>;
  requiresConfirmation: boolean;
  actionMessage: string;
}

export function parseAndExecuteVoiceIntent(rawTranscript: string): VoiceIntentResult {
  const text = rawTranscript.trim().toLowerCase();

  if (text.includes("دفعة") || text.includes("تحويل") || text.includes("قبض") || text.includes("فودافون كاش")) {
    const amountMatch = text.match(/(\d+[\d,]*)\s*(الف|ألف|جنيه|جنية|ريال|دولار)?/);
    const amount = amountMatch ? Number(amountMatch[1].replace(/,/g, "")) * (text.includes("الف") || text.includes("ألف") ? 1000 : 1) : 10000;
    return {
      intent: "log_collection",
      confidence: 0.95,
      summary: `تسجيل تحصيل مالي بمبلغ ${amount.toLocaleString("en-US")} جنيه`,
      extractedData: { amount, currency: "EGP", channel: "Vodafone Cash" },
      requiresConfirmation: true,
      actionMessage: "تم رصد نية تسجيل تحصيل مالي. يرجى مراجعة التفاصيل وتأكيد العملية قبل الحفظ.",
    };
  }

  if (text.includes("شراء") || text.includes("طلب") || text.includes("توريد مواد")) {
    return {
      intent: "create_purchase_request",
      confidence: 0.92,
      summary: "إصدار مسودة طلب شراء جديدة للمشروع النشط",
      extractedData: { category: "موال بناء / تشغيل", urgency: "عادي" },
      requiresConfirmation: true,
      actionMessage: "تم رصد نية إصدار طلب شراء. جاري تحضير المسودة للمراجعة والاعتماد.",
    };
  }

  if (text.includes("تكلفة") || text.includes("سعر") || text.includes("حاسبة")) {
    return {
      intent: "update_cost",
      confidence: 0.9,
      summary: "فتح حاسبة سلسلة التكلفة وتحديث المعاملات",
      extractedData: { scope: "Cost Chain Calculation" },
      requiresConfirmation: false,
      actionMessage: "تم الانتقال إلى حاسبة سلسلة التكلفة الفورية.",
    };
  }

  return {
    intent: "unknown",
    confidence: 0.4,
    summary: `الأمر الوارد: "${rawTranscript}"`,
    extractedData: { raw: rawTranscript },
    requiresConfirmation: true,
    actionMessage: "لم يتعرف المحرك على نية قاطعة لهذا الأمر. يرجى إعادة الصياغة أو اختيار العملية يدويًا.",
  };
}
