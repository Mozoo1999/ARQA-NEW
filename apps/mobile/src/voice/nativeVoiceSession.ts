import { ExpoSpeechRecognitionModule } from "expo-speech-recognition";

export type VoiceEntrySource = "screen" | "launcher_quick_action" | "follow_up";

export type VoiceSessionStartResult =
  | { started: true }
  | { started: false; reason: string };

export const arabicRecognitionContext = [
  "NARQA", "EBOS", "إضافة مورد", "إضافة عميل", "إضافة مشروع", "إضافة نقلة سيارة",
  "رقم السيارة", "مكان الحمولة", "مكان التفريغ", "اسم العميل", "تكعيب السيارة",
  "عدد النقلات", "ملاحظات", "فاتورة", "إذن استلام", "كشف حساب", "إعدادات",
  "تحليل مستند", "تصدير Excel", "موافق", "رفض", "إلغاء",
];

export async function getArabicVoicePermissionState() {
  try {
    const permission = await ExpoSpeechRecognitionModule.getPermissionsAsync();
    return { granted: permission.granted, status: permission.status };
  } catch {
    return { granted: false, status: "unavailable" };
  }
}

export async function requestArabicVoicePermission() {
  try {
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    return { granted: permission.granted, status: permission.status };
  } catch {
    return { granted: false, status: "unavailable" };
  }
}

export async function beginArabicVoiceSession(): Promise<VoiceSessionStartResult> {
  try {
    const permission = await requestArabicVoicePermission();
    if (!permission.granted) {
      return { started: false, reason: "لم يتم منح إذن الميكروفون أو التعرف على الكلام. فعّل الإذن من إعدادات الجهاز ثم أعد المحاولة." };
    }
    if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
      return { started: false, reason: "خدمة التعرف على الكلام غير متاحة. فعّل خدمة التعرف الافتراضية في الجهاز." };
    }
    ExpoSpeechRecognitionModule.start({
      lang: "ar-SA",
      interimResults: true,
      maxAlternatives: 1,
      continuous: false,
      addsPunctuation: true,
      contextualStrings: arabicRecognitionContext,
      androidIntentOptions: {
        EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 10_000,
        EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 10_000,
        EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: 20_000,
      },
    });
    return { started: true };
  } catch (error) {
    return { started: false, reason: error instanceof Error ? error.message : "تعذر بدء جلسة الصوت الأصلية." };
  }
}

export function stopVoiceSession() {
  try { ExpoSpeechRecognitionModule.stop(); } catch { /* Native service can already be stopped. */ }
}

export function abortVoiceSession() {
  try { ExpoSpeechRecognitionModule.abort(); } catch { /* Native service can already be released. */ }
}
