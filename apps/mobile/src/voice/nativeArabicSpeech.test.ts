import { describe, expect, it, vi } from "vitest";
import { normalizeArabicSpeechScript, resolveArabicSpeechLanguage, speakArabicOperationalFeedback } from "./nativeArabicSpeech";

describe("native Arabic speech feedback", () => {
  it("uses only a normalized spoken script and a supported Arabic dialect", () => {
    const stop = vi.fn();
    const speak = vi.fn();
    expect(speakArabicOperationalFeedback({ stop, speak }, "  تمت العملية بنجاح.  راجع المسودة. ", "ar-EG")).toBe(true);
    expect(stop).toHaveBeenCalledTimes(1);
    expect(speak).toHaveBeenCalledWith("تمت العملية بنجاح. راجع المسودة.", { language: "ar-EG", rate: 0.9, pitch: 1 });
  });

  it("does not request native speech for an empty message and safely falls back to ar-SA", () => {
    const speak = vi.fn();
    expect(speakArabicOperationalFeedback({ speak }, "   ", "en-US")).toBe(false);
    expect(speak).not.toHaveBeenCalled();
    expect(resolveArabicSpeechLanguage("ar-001")).toBe("ar-001");
    expect(resolveArabicSpeechLanguage("invalid")).toBe("ar-SA");
    expect(normalizeArabicSpeechScript("سطر\n   آخر")).toBe("سطر آخر");
  });
});
