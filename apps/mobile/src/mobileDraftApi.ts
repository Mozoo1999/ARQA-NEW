export type MobileDraftSource = "ocr" | "voice_command";

export type CreateMobileDraftInput = {
  apiBaseUrl: string;
  token: string;
  sourceType: MobileDraftSource;
  title: string;
  intent: string;
  vendorName?: string;
  amount?: string;
  currency: string;
  documentDate?: string;
  referenceNo?: string;
  taxNo?: string;
  rawContent: string;
  confidence?: string;
};

export type CreatedMobileDraft = { id: number; status: string };

export async function createAuthenticatedMobileDraft(input: CreateMobileDraftInput): Promise<CreatedMobileDraft> {
  const response = await fetch(`${input.apiBaseUrl.replace(/\/$/, "")}/api/mobile/drafts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({
      sourceType: input.sourceType,
      title: input.title,
      intent: input.intent,
      vendorName: input.vendorName,
      amount: input.amount,
      currency: input.currency,
      documentDate: input.documentDate,
      referenceNo: input.referenceNo,
      taxNo: input.taxNo,
      rawContent: input.rawContent,
      confidence: input.confidence,
    }),
  });
  const payload = await response.json().catch(() => ({})) as { id?: number; status?: string; error?: string };
  if (!response.ok) {
    if (response.status === 401) throw new Error("انتهت جلسة الجوال. سجّل الدخول مجدداً.");
    throw new Error(payload.error || "تعذر إرسال المسودة للمراجعة في قاعدة البيانات.");
  }
  if (typeof payload.id !== "number" || !Number.isInteger(payload.id) || !payload.status) throw new Error("أعاد الخادم نتيجة مسودة غير مكتملة.");
  return { id: payload.id, status: payload.status };
}
