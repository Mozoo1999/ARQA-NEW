import { createMobileSessionStore, type SecureStoreLike } from "./mobileSessionStorageCore";

export { createMobileSessionStore, type SecureStoreLike } from "./mobileSessionStorageCore";

// Browser builds never persist a mobile Bearer token. Metro selects mobileSessionStorage.native.ts for Android and iOS.
const unavailableSecureStore: SecureStoreLike = {
  async getItemAsync() { return null; },
  async setItemAsync() { return; },
  async deleteItemAsync() { return; },
};
export const mobileSessionStore = createMobileSessionStore("web", unavailableSecureStore);
