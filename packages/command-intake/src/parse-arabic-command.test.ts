import { buildCommandActionPlan, extractEgpAmount, parseArabicVoiceCommand } from "./index";

const installment = parseArabicVoiceCommand("قسط عشرة آلاف جنيه على سيارة مصطفى فتحي");
if (installment.intent !== "create_installment") throw new Error("Expected an installment command.");
if (installment.data.money?.amount !== 10000) throw new Error("Expected 10,000 EGP.");
if (installment.data.assetName !== "مصطفى فتحي") throw new Error("Expected the asset name.");

const payment = buildCommandActionPlan("استلام دفعة تحويل فودافون كاش 30 ألف جنيه من شركة العالمية");
if (payment.action !== "create_draft_payment") throw new Error("Expected a payment draft.");
if (payment.parsed.data.money?.amount !== 30000) throw new Error("Expected 30,000 EGP.");
if (payment.parsed.data.customerName !== "شركة العالمية") throw new Error("Expected customer name.");
if (!payment.requiredConfirmation) throw new Error("Financial actions must require confirmation.");

if (extractEgpAmount("سجل ١٥ ألف جنيه") !== 15000) throw new Error("Expected Arabic numerals to be parsed.");
