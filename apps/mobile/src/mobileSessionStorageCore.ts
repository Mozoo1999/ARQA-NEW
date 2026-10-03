export type SecureStoreLike = {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
};

export function createMobileSessionStore(platform: string, secureStore: SecureStoreLike) {
  const isNative = platform !== "web";
  return {
    async get(key: string) { return isNative ? secureStore.getItemAsync(key) : null; },
    async set(key: string, value: string) { if (isNative) await secureStore.setItemAsync(key, value); },
    async remove(key: string) { if (isNative) await secureStore.deleteItemAsync(key); },
  };
}
