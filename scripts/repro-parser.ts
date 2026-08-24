import { normalizeArabic, parseArabicVoiceCommand, extractEgpAmount } from "../packages/command-intake/src/parse-arabic-command";
const source = "قسط عشرة آلاف جنيه على سيارة مصطفى فتحي";
console.log("normalized:", normalizeArabic(source));
console.log("amount:", extractEgpAmount(source));
console.log("parsed:", parseArabicVoiceCommand(source));
