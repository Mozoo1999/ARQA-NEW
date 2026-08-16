export type FinancialDirection = "received" | "sent";
export type SuggestedAction =
  | "create_customer_payment_draft"
  | "create_asset_payment_draft"
  | "review_unmatched_signal";

export interface NotificationEvent {
  source: "android_notification" | "whatsapp_business_webhook" | "manual_import";
  packageName?: string;
  title?: string;
  body: string;
  occurredAt: string;
}

export interface FinancialSignal {
  provider: "vodafone_cash";
  direction: FinancialDirection;
  amount: number;
  currency: "EGP";
  counterpartyPhone?: string;
  confidence: number;
  source: NotificationEvent;
}

export interface KnownIdentity {
  id: string;
  kind: "customer" | "supplier" | "asset";
  displayName: string;
  phone: string;
  customerId?: string;
  assetId?: string;
  relationshipLabel?: string;
}

export interface NotificationSuggestion {
  action: SuggestedAction;
  title: string;
  explanation: string;
  confidence: number;
  target: KnownIdentity | null;
  financialSignal: FinancialSignal;
  requiresApproval: true;
}
