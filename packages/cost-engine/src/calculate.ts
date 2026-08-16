import {
  CostChainInput,
  CostChainResult,
  CostComponent,
  CostLine,
  RankedSourceOption,
  SourceOption,
} from "./types";

const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

function assertRate(label: string, value: number, upperExclusive = true) {
  if (!Number.isFinite(value) || value < 0 || (upperExclusive && value >= 1)) {
    throw new Error(`${label} must be between 0 and ${upperExclusive ? "1 (exclusive)" : "infinity"}.`);
  }
}

function unitAmount(component: CostComponent, payloadPerTrip?: number) {
  if (!Number.isFinite(component.amount) || component.amount < 0) {
    throw new Error(`${component.label} must be a non-negative amount.`);
  }
  if (component.basis === "per-unit") return component.amount;
  if (!payloadPerTrip || payloadPerTrip <= 0) {
    throw new Error(`A positive payloadPerTrip is required for ${component.label}.`);
  }
  return component.amount / payloadPerTrip;
}

/**
 * Calculates a transparent, auditable price using per-unit and per-trip costs.
 * Profit is modeled as markup on cost; a sales-margin policy can be added later.
 */
export function calculateCostChain(input: CostChainInput): CostChainResult {
  if (!Number.isFinite(input.deliveredQuantity) || input.deliveredQuantity <= 0) {
    throw new Error("deliveredQuantity must be greater than zero.");
  }
  assertRate("wasteRate", input.wasteRate);
  assertRate("adminRate", input.adminRate, false);
  assertRate("profitMarkupRate", input.profitMarkupRate, false);

  const requiredSourceQuantity = input.deliveredQuantity / (1 - input.wasteRate);
  const lines: CostLine[] = input.components.map((component) => {
    const perSourceUnit = unitAmount(component, input.payloadPerTrip);
    const total = perSourceUnit * requiredSourceQuantity;
    return {
      id: component.id,
      kind: component.kind,
      label: component.label,
      unitAmount: round(total / input.deliveredQuantity),
      totalAmount: round(total),
    };
  });

  const directCost = lines.reduce((sum, line) => sum + line.totalAmount, 0);
  const directUnitCost = directCost / input.deliveredQuantity;
  const wasteTotal = directCost - directCost * (1 - input.wasteRate);
  lines.push({
    id: "waste-adjustment",
    kind: "waste",
    label: "أثر الهالك",
    unitAmount: round(wasteTotal / input.deliveredQuantity),
    totalAmount: round(wasteTotal),
  });

  const landedTotal = directCost;
  const adminTotal = landedTotal * input.adminRate;
  lines.push({
    id: "administration",
    kind: "administration",
    label: "مصروف إداري",
    unitAmount: round(adminTotal / input.deliveredQuantity),
    totalAmount: round(adminTotal),
  });

  const costBeforeProfit = landedTotal + adminTotal;
  const profitTotal = costBeforeProfit * input.profitMarkupRate;
  lines.push({
    id: "profit",
    kind: "profit",
    label: "هامش الربح",
    unitAmount: round(profitTotal / input.deliveredQuantity),
    totalAmount: round(profitTotal),
  });

  const totalPrice = costBeforeProfit + profitTotal;
  return {
    requiredSourceQuantity: round(requiredSourceQuantity),
    estimatedTrips: input.payloadPerTrip
      ? Math.ceil(requiredSourceQuantity / input.payloadPerTrip)
      : null,
    landedUnitCost: round(directUnitCost),
    recommendedUnitPrice: round(totalPrice / input.deliveredQuantity),
    totalCost: round(costBeforeProfit),
    totalPrice: round(totalPrice),
    lines,
  };
}

const normalize = (value: number, min: number, max: number) =>
  max === min ? 1 : Math.max(0, Math.min(1, (value - min) / (max - min)));

/** Ranks eligible sources; lower cost and transit time improve the score. */
export function rankSourceOptions(options: SourceOption[]): RankedSourceOption[] {
  if (options.length === 0) return [];

  const calculated = options.map((option) => ({ option, result: calculateCostChain(option.costInput) }));
  const costs = calculated.map(({ result }) => result.landedUnitCost);
  const transitHours = calculated.map(({ option }) => option.transitHours);
  const minCost = Math.min(...costs);
  const maxCost = Math.max(...costs);
  const minTransit = Math.min(...transitHours);
  const maxTransit = Math.max(...transitHours);

  return calculated
    .map(({ option, result }) => {
      const costScore = 1 - normalize(result.landedUnitCost, minCost, maxCost);
      const speedScore = 1 - normalize(option.transitHours, minTransit, maxTransit);
      const score =
        costScore * 55 +
        (option.qualityScore / 100) * 15 +
        (option.onTimeRate / 100) * 15 +
        (option.availableQuantity >= option.costInput.deliveredQuantity ? 1 : 0) * 10 +
        speedScore * 5;

      const reasons = [
        `تكلفة هابطة ${result.landedUnitCost.toFixed(2)} للوحدة`,
        `جودة ${option.qualityScore}% والتزام ${option.onTimeRate}%`,
        `زمن رحلة تقديري ${option.transitHours} ساعة`,
      ];
      return { ...option, result, score: round(score), reasons };
    })
    .sort((a, b) => b.score - a.score);
}
