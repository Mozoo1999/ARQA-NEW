import { describe, expect, it } from "vitest";
import { calculateCostChain, rankSourceOptions } from "./index";

const base = {
  deliveredQuantity: 1,
  wasteRate: 0,
  adminRate: 0,
  profitMarkupRate: 0,
  components: [
    { id: "purchase", kind: "purchase" as const, label: "شراء", amount: 126, basis: "per-unit" as const },
    { id: "transport", kind: "transport" as const, label: "نقل", amount: 28, basis: "per-unit" as const },
  ],
};

describe("cost-chain engine", () => {
  it("calculates transparent unit and total prices from unit, trip, waste, administration, and markup inputs", () => {
    const result = calculateCostChain({
      deliveredQuantity: 100,
      payloadPerTrip: 25,
      wasteRate: 0.02,
      adminRate: 0.03,
      profitMarkupRate: 0.15,
      components: [
        { id: "purchase", kind: "purchase", label: "شراء", amount: 126, basis: "per-unit" },
        { id: "transport", kind: "transport", label: "نقل", amount: 250, basis: "per-trip" },
      ],
    });

    expect(result).toMatchObject({
      requiredSourceQuantity: 102.04,
      estimatedTrips: 5,
      landedUnitCost: 138.78,
      totalCost: 14293.88,
      totalPrice: 16437.96,
      recommendedUnitPrice: 164.38,
    });
    expect(result.lines).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "purchase", unitAmount: 126, totalAmount: 12600 }),
      expect.objectContaining({ id: "transport", unitAmount: 10, totalAmount: 1000 }),
      expect.objectContaining({ id: "waste-adjustment", label: "أثر الهالك" }),
      expect.objectContaining({ id: "administration", label: "مصروف إداري" }),
      expect.objectContaining({ id: "profit", label: "هامش الربح" }),
    ]));
  });

  it("ranks eligible sources by landed cost while retaining quality, delivery, capacity, and transit evidence", () => {
    const ranked = rankSourceOptions([
      {
        sourceId: "A", sourceName: "كسارة أ", supplierName: "المورد أ", qualityScore: 80, onTimeRate: 80,
        availableQuantity: 100, dailyCapacity: 100, transitHours: 2,
        costInput: { ...base, deliveredQuantity: 100, components: [{ ...base.components[0], amount: 120 }, { ...base.components[1], amount: 45 }] },
      },
      {
        sourceId: "B", sourceName: "كسارة ب", supplierName: "المورد ب", qualityScore: 80, onTimeRate: 80,
        availableQuantity: 100, dailyCapacity: 100, transitHours: 2, costInput: { ...base, deliveredQuantity: 100 },
      },
    ]);

    expect(ranked.map(option => option.sourceId)).toEqual(["B", "A"]);
    expect(ranked[0]).toMatchObject({ score: expect.any(Number), reasons: expect.arrayContaining([expect.stringContaining("تكلفة هابطة")]) });
  });

  it("rejects non-positive quantity, invalid rates, and per-trip costs with no positive payload instead of inventing a result", () => {
    expect(() => calculateCostChain({ ...base, deliveredQuantity: 0 })).toThrow("deliveredQuantity");
    expect(() => calculateCostChain({ ...base, wasteRate: 1 })).toThrow("wasteRate");
    expect(() => calculateCostChain({ ...base, components: [{ id: "transport", kind: "transport", label: "نقل", amount: 250, basis: "per-trip" }] })).toThrow("payloadPerTrip");
  });
});
