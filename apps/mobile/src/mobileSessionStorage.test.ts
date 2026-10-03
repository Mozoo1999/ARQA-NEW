import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { createMobileSessionStore } from "./mobileSessionStorageCore";

describe("mobile secure session storage", () => {
  it("does not call unsupported SecureStore functions in Expo Web", async () => {
    const secureStore = { getItemAsync: vi.fn(), setItemAsync: vi.fn(), deleteItemAsync: vi.fn() };
    const store = createMobileSessionStore("web", secureStore);
    await expect(store.get("token")).resolves.toBeNull();
    await store.set("token", "secret");
    await store.remove("token");
    expect(secureStore.getItemAsync).not.toHaveBeenCalled();
    expect(secureStore.setItemAsync).not.toHaveBeenCalled();
    expect(secureStore.deleteItemAsync).not.toHaveBeenCalled();
  });

  it("uses the platform secure store on Android and iOS", async () => {
    const secureStore = { getItemAsync: vi.fn().mockResolvedValue("token"), setItemAsync: vi.fn().mockResolvedValue(undefined), deleteItemAsync: vi.fn().mockResolvedValue(undefined) };
    const store = createMobileSessionStore("android", secureStore);
    await expect(store.get("token")).resolves.toBe("token");
    await store.set("token", "new-token");
    await store.remove("token");
    expect(secureStore.setItemAsync).toHaveBeenCalledWith("token", "new-token");
    expect(secureStore.deleteItemAsync).toHaveBeenCalledWith("token");
  });

  it("keeps the native resolver free of a self-import cycle", () => {
    const nativeSource = readFileSync(new URL("./mobileSessionStorage.native.ts", import.meta.url), "utf8");
    expect(nativeSource).toContain('from "./mobileSessionStorageCore"');
    expect(nativeSource).not.toContain('from "./mobileSessionStorage"');
  });
});
