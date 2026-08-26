import { describe, expect, it } from "vitest";
import { __mobileRouteTestUtils } from "./mobileRoutes";
import { calculateUnenteredQuantities } from "./operationalLogistics";

describe("vehicle load quantity matching", () => {
  it("reports quantities loaded for a vehicle that have not been entered in receiving notes", () => {
    const result = calculateUnenteredQuantities(
      [
        { materialName: "رمل خام", unit: "طن", quantity: "12.500", status: "confirmed" },
        { materialName: "رمل خام", unit: "طن", quantity: "2.500", status: "rejected" },
      ],
      [{ materialName: "رمل خام", unit: "طن", quantity: "7.250", status: "confirmed" }],
    );
    expect(result).toEqual([{ materialName: "رمل خام", unit: "طن", loaded: 12.5, received: 7.25, unenteredQuantity: 5.25 }]);
  });
});

describe("operational mobile submissions", () => {
  const validLoad = {
    customerName: "عميل اختبار", vehiclePlateNumber: "ABC-123", loadDate: "2026-08-26T12:00:00.000Z", entryMethod: "voice", rawContent: "حمولة رمل خام", lines: [{ materialName: "رمل خام", quantity: "10.000", unit: "طن", unitPrice: "25.50" }], confirmed: true,
  };

  it("accepts a confirmed vehicle load with traceable entry metadata", () => {
    expect(__mobileRouteTestUtils.vehicleLoadSubmissionSchema.safeParse(validLoad).success).toBe(true);
  });

  it("rejects an operational submission that was not explicitly confirmed", () => {
    const { confirmed, ...unconfirmed } = validLoad;
    expect(__mobileRouteTestUtils.vehicleLoadSubmissionSchema.safeParse(unconfirmed).success).toBe(false);
  });

  it("accepts a confirmed receiving note with a receipt date and lines", () => {
    const receipt = { ...validLoad, receiptDate: validLoad.loadDate };
    delete (receipt as { loadDate?: string }).loadDate;
    expect(__mobileRouteTestUtils.receivingNoteSubmissionSchema.safeParse(receipt).success).toBe(true);
  });
});
