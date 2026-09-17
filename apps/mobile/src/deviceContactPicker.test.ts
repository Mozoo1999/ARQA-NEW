import { describe, expect, it } from "vitest";
import { toDeviceContactSelection } from "./deviceContactSelection";

describe("single device contact selection", () => {
  it("keeps only the explicitly selected contact name and first usable phone", () => {
    expect(toDeviceContactSelection({ id: "42", name: " شركة العالمية ", phones: [{ number: " 01001234567 " }, { number: "011" }] })).toEqual({ selectionId: "device:42", source: "device", name: "شركة العالمية", phone: "01001234567" });
  });

  it("falls back to a privacy-safe label when the selected contact has no details", () => {
    expect(toDeviceContactSelection({ id: "empty", name: "", phones: [] })).toEqual({ selectionId: "device:empty", source: "device", name: "جهة اتصال من الجهاز", phone: undefined });
  });

  it("does not retain a full device contact record or unselected phone numbers", () => {
    const selection = toDeviceContactSelection({ id: "only-one", name: "جهة محددة", phones: [{ number: "0100" }, { number: "0200" }] });
    expect(selection).toEqual({ selectionId: "device:only-one", source: "device", name: "جهة محددة", phone: "0100" });
    expect(Object.keys(selection)).toEqual(["selectionId", "name", "phone", "source"]);
  });
});
