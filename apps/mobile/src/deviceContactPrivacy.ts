export const DEVICE_CONTACT_PICKER_WEB_UNAVAILABLE = "منتقي جهات الاتصال متاح في تطبيق Android أو iOS فقط. لا يقرأ إصدار الويب دفتر العناوين.";
export const DEVICE_CONTACT_PERMISSION_DENIED = "لم يتم منح إذن جهات الاتصال. لن يقرأ التطبيق أي جهة اتصال حتى تمنح الإذن وتختارها بنفسك.";

/**
 * Keeps the device-picker boundary explicit and testable without importing
 * Expo's native contact implementation into the web/unit-test bundle.
 */
export function assertDeviceContactPickerAccess(platform: string, granted?: boolean): void {
  if (platform === "web") throw new Error(DEVICE_CONTACT_PICKER_WEB_UNAVAILABLE);
  if (granted === false) throw new Error(DEVICE_CONTACT_PERMISSION_DENIED);
}
