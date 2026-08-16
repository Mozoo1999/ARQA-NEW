export type CommandIntent =
  | "create_installment"
  | "record_customer_payment"
  | "search"
  | "unknown";

export type CommandStatus =
  | "recognized"
  | "needs_entity_resolution"
  | "needs_confirmation"
  | "ready_to_execute"
  | "rejected";

export interface Money {
  amount: number;
  currency: "EGP";
}

export interface ParsedCommand {
  originalText: string;
  normalizedText: string;
  intent: CommandIntent;
  confidence: number;
  status: CommandStatus;
  summary: string;
  data: {
    money?: Money;
    customerName?: string;
    assetName?: string;
    paymentMethod?: "vodafone_cash";
  };
  requiredConfirmation: boolean;
  reasons: string[];
}

/** The backend resolves names to IDs before any write is attempted. */
export interface CommandActionPlan {
  intent: CommandIntent;
  status: CommandStatus;
  targetEntity: "customer" | "asset" | null;
  action: "create_draft_installment" | "create_draft_payment" | "none";
  requiredConfirmation: boolean;
  parsed: ParsedCommand;
}
