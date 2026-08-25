export type DocumentFields = {
  vendorName: string;
  amount: string;
  documentDate: string;
  taxNo: string;
  referenceNo: string;
};

export type OcrReviewGuidance = {
  level: "high" | "medium" | "low";
  message: string;
};

export function toLatinDigits(value: string) {
  return value.replace(/[٠-٩]/g, digit => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

export function extractDocumentFields(rawText: string): DocumentFields {
  const text = toLatinDigits(rawText).replace(/\u066B/g, ".").replace(/\u066C/g, ",");
  const lines = rawText.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const amount = text.match(/(?:الإجمالي|المبلغ|اجمالي|total|amount)[^\d]{0,18}(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{1,2})?)/i)?.[1]
    ?? text.match(/\b(\d{1,3}(?:[,\s]\d{3})+(?:\.\d{1,2})?)\b/)?.[1] ?? "";
  const documentDate = text.match(/\b(\d{1,4}[\/-]\d{1,2}[\/-]\d{1,4})\b/)?.[1] ?? "";
  const taxNo = text.match(/(?:الضريبي|ضريبة|tax\s*(?:no|number|id)?)[^\d]{0,18}(\d{6,20})/i)?.[1] ?? "";
  const referenceNo = text.match(/(?:فاتورة|مرجع|invoice|ref(?:erence)?)[^\w\d]{0,18}([A-Z0-9\/-]{4,})/i)?.[1] ?? "";
  const vendorName = lines.find(line => !/فاتورة|ضريبة|tax|invoice|total|amount|تاريخ|date/i.test(line) && line.length > 2 && line.length < 70) ?? "";
  return { vendorName, amount: amount.replace(/[\s,]/g, ""), documentDate, taxNo, referenceNo };
}

export function getOcrReviewGuidance(rawText: string, fields: DocumentFields): OcrReviewGuidance {
  const populatedFields = Object.values(fields).filter(Boolean).length;
  const normalizedLength = rawText.replace(/\s/g, "").length;
  if (normalizedLength < 20 || populatedFields === 0) {
    return { level: "low", message: "الاستخراج ضعيف. أعد التصوير من قرب، بإضاءة متساوية، وراجع النص والخط اليدوي يدوياً." };
  }
  if (normalizedLength < 60 || populatedFields < 3) {
    return { level: "medium", message: "الاستخراج جزئي. راجع المبلغ والتاريخ والرقم المرجعي مقابل الصورة قبل الإرسال للمراجعة." };
  }
  return { level: "high", message: "النص والحقول الأولية متماسكة، لكنها مسودة فقط: طابق القيم مع الصورة قبل اعتمادها." };
}
