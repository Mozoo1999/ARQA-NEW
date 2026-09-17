export interface DeviceContactSelection {
  selectionId: string;
  name: string;
  phone?: string;
  source: "device";
}

export function toDeviceContactSelection(input: { id: string; name?: string | null; phones?: Array<{ number?: string | null }> }): DeviceContactSelection {
  const phone = input.phones?.map(item => item.number?.trim()).find(Boolean);
  return { selectionId: `device:${input.id}`, name: input.name?.trim() || phone || "جهة اتصال من الجهاز", phone: phone || undefined, source: "device" };
}
