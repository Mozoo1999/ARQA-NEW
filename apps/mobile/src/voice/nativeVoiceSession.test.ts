import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("native launcher voice session policy", () => {
  const moduleSource = readFileSync(new URL("./nativeVoiceSession.ts", import.meta.url), "utf8");
  const appSource = readFileSync(new URL("../../App.tsx", import.meta.url), "utf8");

  it("requests explicit permissions before starting native recognition", () => {
    expect(moduleSource).toContain("requestPermissionsAsync");
    expect(moduleSource.indexOf("requestPermissionsAsync")).toBeLessThan(moduleSource.indexOf("ExpoSpeechRecognitionModule.start"));
  });

  it("keeps launcher activation inside the app and labels its source", () => {
    expect(appSource).toContain('action?.id !== "start-voice-command"');
    expect(appSource).toContain('startListening("launcher_quick_action")');
    expect(appSource).not.toContain("startActivityAsync");
  });

  it("provides a twenty-second minimum window and a visible extension path", () => {
    expect(moduleSource).toContain("EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: 20_000");
    expect(appSource).toContain("أحتاج وقتاً إضافياً (20 ثانية)");
  });
});
