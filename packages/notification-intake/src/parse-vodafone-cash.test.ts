import { buildNotificationSuggestion, parseVodafoneCashNotification } from "./index";

const inbound = parseVodafoneCashNotification({
  source: "android_notification",
  packageName: "com.example.wallet",
  body: "فودافون كاش: تم استلام مبلغ 20 ألف جنيه من رقم 0100000",
  occurredAt: "2026-08-16T10:00:00Z",
});
if (!inbound || inbound.direction !== "received" || inbound.amount !== 20000) {
  throw new Error("Expected a 20,000 EGP incoming wallet signal.");
}

const customerSuggestion = buildNotificationSuggestion(inbound, [{
  id: "contact-demo",
  kind: "customer",
  displayName: "عميل تجريبي",
  phone: "0100000",
  customerId: "customer-demo",
  relationshipLabel: "جهة اتصال مسجلة",
}]);
if (customerSuggestion.action !== "create_customer_payment_draft") {
  throw new Error("Expected a customer payment suggestion.");
}
if (!customerSuggestion.title.includes("عميل تجريبي")) throw new Error("Expected matched customer name.");

const outbound = parseVodafoneCashNotification({
  source: "android_notification",
  body: "فودافون كاش: تم ارسال 5 آلاف جنيه إلى رقم 0101111",
  occurredAt: "2026-08-16T10:05:00Z",
});
if (!outbound || outbound.direction !== "sent" || outbound.amount !== 5000) {
  throw new Error("Expected a 5,000 EGP outgoing wallet signal.");
}
const assetSuggestion = buildNotificationSuggestion(outbound, [{
  id: "asset-demo",
  kind: "asset",
  displayName: "سيارة تجريبية",
  phone: "0101111",
  assetId: "vehicle-demo",
}]);
if (assetSuggestion.action !== "create_asset_payment_draft") {
  throw new Error("Expected an asset payment suggestion.");
}
