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

const result = calculateCostChain(base);
if (result.landedUnitCost !== 154) throw new Error("Expected B landed cost to equal 154.");

const ranked = rankSourceOptions([
  { sourceId: "A", sourceName: "كسارة A", supplierName: "A", qualityScore: 80, onTimeRate: 80, availableQuantity: 1, dailyCapacity: 100, transitHours: 2, costInput: { ...base, components: [{ ...base.components[0], amount: 120 }, { ...base.components[1], amount: 45 }] } },
  { sourceId: "B", sourceName: "كسارة B", supplierName: "B", qualityScore: 80, onTimeRate: 80, availableQuantity: 1, dailyCapacity: 100, transitHours: 2, costInput: base },
]);
if (ranked[0].sourceId !== "B") throw new Error("Expected B to rank above A by landed cost.");
