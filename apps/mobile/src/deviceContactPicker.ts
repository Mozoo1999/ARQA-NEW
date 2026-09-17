import { Platform } from "react-native";
import { Contact, requestPermissionsAsync } from "expo-contacts";
import { toDeviceContactSelection, type DeviceContactSelection } from "./deviceContactSelection";

export type { DeviceContactSelection } from "./deviceContactSelection";

export async function pickSingleDeviceContact(): Promise<DeviceContactSelection | null> {
  if (Platform.OS === "web") throw new Error("منتقي جهات الاتصال متاح في تطبيق Android أو iOS فقط. لا يقرأ إصدار الويب دفتر العناوين.");
  const permission = await requestPermissionsAsync();
  if (!permission.granted) throw new Error("لم يتم منح إذن جهات الاتصال. لن يقرأ التطبيق أي جهة اتصال حتى تمنح الإذن وتختارها بنفسك.");
  const contact = await Contact.presentPicker();
  if (!contact) return null;
  const [name, phones] = await Promise.all([contact.getFullName(), contact.getPhones()]);
  return toDeviceContactSelection({ id: contact.id, name, phones });
}
