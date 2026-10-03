import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { createMobileSessionStore, type SecureStoreLike } from "./mobileSessionStorageCore";

// Native builds persist the token only through the operating system's secure key store.
export const mobileSessionStore = createMobileSessionStore(Platform.OS, SecureStore as unknown as SecureStoreLike);
