import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

describe("native in-app navigation policy", () => {
  it("does not keep browser-opening helpers for operational, voice, or OCR review actions", () => {
    expect(appSource).not.toContain("openBrowserAsync");
    expect(appSource).not.toContain("openOperationalModule");
    expect(appSource).not.toContain("Linking.openURL");
  });

  it("keeps OAuth browser use explicit and isolated to the sign-in flow", () => {
    expect(appSource).toContain("openAuthSessionAsync(authUrl, REDIRECT_URI)");
    expect(appSource).toContain("لن يفتح التطبيق مساحة العمل على الإنترنت تلقائياً");
  });
});
