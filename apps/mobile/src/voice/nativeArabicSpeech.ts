export type NativeSpeechEngine = {
  stop?: () => void;
  speak: (text: string, options: { language: string; rate: number; pitch: number }) => void;
};

/**
 * Expo Speech receives only the spoken script. Do not pass a generative-TTS
 * director prompt here because native engines would read it aloud.
 */
export function resolveArabicSpeechLanguage(dialect?: string): string {
  return /^ar-(?:SA|EG|AE|001)$/i.test(dialect ?? "") ? (dialect as string) : "ar-SA";
}

export function normalizeArabicSpeechScript(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function getArabicSpeechOptions(dialect?: string) {
  return { language: resolveArabicSpeechLanguage(dialect), rate: 0.9, pitch: 1 };
}

export function speakArabicOperationalFeedback(engine: NativeSpeechEngine, text: string, dialect?: string): boolean {
  const script = normalizeArabicSpeechScript(text);
  if (!script) return false;
  engine.stop?.();
  engine.speak(script, getArabicSpeechOptions(dialect));
  return true;
}
