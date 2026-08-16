export type CostKind =
  | "purchase"
  | "loading"
  | "transport"
  | "waiting"
  | "fees"
  | "gratuities"
  | "other";

export type ChargeBasis = "per-unit" | "per-trip";

export interface CostComponent {
  id: string;
  kind: CostKind;
  label: string;
  amount: number;
  basis: ChargeBasis;
}

export interface CostChainInput {
  /** Quantity promised to the customer in the product's base unit. */
  deliveredQuantity: number;
  /** Net payload of one trip in the same unit. Required for per-trip costs. */
  payloadPerTrip?: number;
  /** Fraction of material expected to be lost, e.g. 0.02 for 2%. */
  wasteRate: number;
  /** Fraction added to landed cost for administrative overhead. */
  adminRate: number;
  /** Fraction added to cost as profit markup. */
  profitMarkupRate: number;
  components: CostComponent[];
}

export interface CostLine {
  id: string;
  kind: CostKind | "waste" | "administration" | "profit";
  label: string;
  unitAmount: number;
  totalAmount: number;
}

export interface CostChainResult {
  requiredSourceQuantity: number;
  estimatedTrips: number | null;
  landedUnitCost: number;
  recommendedUnitPrice: number;
  totalCost: number;
  totalPrice: number;
  lines: CostLine[];
}

export interface SourceOption {
  sourceId: string;
  sourceName: string;
  supplierName: string;
  qualityScore: number;
  onTimeRate: number;
  availableQuantity: number;
  dailyCapacity: number;
  transitHours: number;
  costInput: CostChainInput;
}

export interface RankedSourceOption extends SourceOption {
  result: CostChainResult;
  score: number;
  reasons: string[];
}
