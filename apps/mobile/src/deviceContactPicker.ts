import { Platform } from "react-native";
import { Contact, requestPermissionsAsync } from "expo-contacts";
import { toDeviceContactSelection, type DeviceContactSelection } from "./deviceContactSelection";
import { assertDeviceContactPickerAccess } from "./deviceContactPrivacy";

export type { DeviceContactSelection } from "./deviceContactSelection";

export async function pickSingleDeviceContact(): Promise<DeviceContactSelection | null> {
  assertDeviceContactPickerAccess(Platform.OS);
  const permission = await requestPermissionsAsync();
  assertDeviceContactPickerAccess(Platform.OS, permission.granted);
  const contact = await Contact.presentPicker();
  if (!contact) return null;
  const [name, phones] = await Promise.all([contact.getFullName(), contact.getPhones()]);
  return toDeviceContactSelection({ id: contact.id, name, phones });
}
