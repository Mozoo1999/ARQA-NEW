import { describe, expect, it } from "vitest";
import { assertDeviceContactPickerAccess, DEVICE_CONTACT_PERMISSION_DENIED, DEVICE_CONTACT_PICKER_WEB_UNAVAILABLE } from "./deviceContactPrivacy";

describe("device contact privacy boundary", () => {
  it("blocks web contact selection before any address-book access", () => {
    expect(() => assertDeviceContactPickerAccess("web")).toThrow(DEVICE_CONTACT_PICKER_WEB_UNAVAILABLE);
  });

  it("blocks the picker when the user denies contacts permission", () => {
    expect(() => assertDeviceContactPickerAccess("android", false)).toThrow(DEVICE_CONTACT_PERMISSION_DENIED);
    expect(() => assertDeviceContactPickerAccess("ios", false)).toThrow(DEVICE_CONTACT_PERMISSION_DENIED);
  });

  it("allows a native picker only after permission is granted", () => {
    expect(() => assertDeviceContactPickerAccess("android", true)).not.toThrow();
    expect(() => assertDeviceContactPickerAccess("ios", true)).not.toThrow();
  });
});
