export type ConversationChannel = "voice" | "text" | "image" | "document" | "message";

export type ConversationProgress = {
  sessionId: number;
  intent: string;
  fields: Record<string, string>;
  nextQuestion: string | null;
  summary: string;
  readyForReview: boolean;
};

export type ConversationOutcome = { entityType: string; entityId: number; status: string };

type AuthenticatedMobileRequest = { apiBaseUrl: string; token: string };

function apiError(fallback: string, response: Response, body: unknown) {
  const message = body && typeof body === "object" && "error" in body && typeof (body as { error?: unknown }).error === "string"
    ? (body as { error: string }).error
    : fallback;
  return new Error(response.status === 401 ? "انتهت جلسة الجوال. سجّل الدخول مجدداً." : message);
}

async function readJson<T>(response: Response, fallback: string): Promise<T> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw apiError(fallback, response, body);
  return body as T;
}

function headers(token: string, includeJson = true): Record<string, string> {
  if (includeJson) return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  return { Authorization: `Bearer ${token}` };
}

export async function startMobileConversation(input: AuthenticatedMobileRequest & { channel: ConversationChannel; content: string }): Promise<ConversationProgress> {
  const response = await fetch(`${input.apiBaseUrl}/api/mobile/conversations`, { method: "POST", headers: headers(input.token), body: JSON.stringify({ channel: input.channel, content: input.content }) });
  return readJson<ConversationProgress>(response, "تعذر بدء جلسة المساعد التشغيلي.");
}

export async function answerMobileConversation(input: AuthenticatedMobileRequest & { sessionId: number; channel: ConversationChannel; content: string }): Promise<ConversationProgress> {
  const response = await fetch(`${input.apiBaseUrl}/api/mobile/conversations/${input.sessionId}/answers`, { method: "POST", headers: headers(input.token), body: JSON.stringify({ channel: input.channel, content: input.content }) });
  return readJson<ConversationProgress>(response, "تعذر حفظ إجابة المستخدم.");
}

export async function confirmMobileConversation(input: AuthenticatedMobileRequest & { sessionId: number }): Promise<ConversationOutcome> {
  const response = await fetch(`${input.apiBaseUrl}/api/mobile/conversations/${input.sessionId}/confirm`, { method: "POST", headers: headers(input.token, false) });
  return readJson<ConversationOutcome>(response, "تعذر تأكيد تنفيذ المسودة.");
}

export async function rejectMobileConversation(input: AuthenticatedMobileRequest & { sessionId: number }): Promise<ConversationOutcome> {
  const response = await fetch(`${input.apiBaseUrl}/api/mobile/conversations/${input.sessionId}/reject`, { method: "POST", headers: headers(input.token, false) });
  return readJson<ConversationOutcome>(response, "تعذر تسجيل رفض المسودة.");
}

export async function importApprovedMobileMessage(input: AuthenticatedMobileRequest & { contactName: string; contactPhone?: string; sourceChannel: "manual_message" | "whatsapp" | "sms"; content: string }): Promise<{ importId: number; conversation: ConversationProgress }> {
  const response = await fetch(`${input.apiBaseUrl}/api/mobile/messages/import`, { method: "POST", headers: headers(input.token), body: JSON.stringify({ contactName: input.contactName, contactPhone: input.contactPhone, sourceChannel: input.sourceChannel, content: input.content, consentConfirmed: true }) });
  return readJson<{ importId: number; conversation: ConversationProgress }>(response, "تعذر إنشاء مسودة الرسالة.");
}
