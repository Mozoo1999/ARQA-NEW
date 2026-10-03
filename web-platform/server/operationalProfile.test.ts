import { describe, expect, it } from "vitest";
import { DEFAULT_OPERATIONAL_PROFILE, normalizeOperationalProfile } from "./operationalProfile";

describe("operational profile normalization", () => {
  it("uses a safe unconfigured default until the user selects an operational context", () => {
    expect(DEFAULT_OPERATIONAL_PROFILE).toMatchObject({ sector: "general", businessLevel: "general", configured: false });
  });

  it("keeps only bounded, unique material vocabulary chosen by the user", () => {
    const profile = normalizeOperationalProfile({ primaryLanguage: "ar", dialect: "ar-EG", sector: "construction", businessLevel: "construction_company", defaultUnit: " متر مكعب ", materialVocabulary: ["سن", "رمل", "سن", " "] });
    expect(profile).toMatchObject({ dialect: "ar-EG", sector: "construction", businessLevel: "construction_company", defaultUnit: "متر مكعب", materialVocabulary: ["سن", "رمل"] });
  });

  it("does not accept a forged sector or business level", () => {
    expect(normalizeOperationalProfile({ sector: "banking" as never, businessLevel: "root" as never })).toMatchObject({ sector: "general", businessLevel: "general" });
  });
});
