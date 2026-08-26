import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, FileText, Image as ImageIcon, ScanText, Sparkles, Upload, X, ZoomIn } from "lucide-react";
import { createWorker } from "tesseract.js";
import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface ExtractedFields {
  vendorName: string;
  amount: number;
  currency: string;
  date: string;
  referenceNo: string;
  taxNo: string;
  confidence: number;
}

interface UploadedDocument {
  file: File;
  previewUrl: string;
  type: "image" | "pdf";
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

function extractFieldsFromText(text: string, confidence: number): ExtractedFields {
  const amountMatch = text.match(/(?:المبلغ|الإجمالي|total|amount)[^\d٠-٩]*(\d[\d٠-٩,.]*)/i);
  const dateMatch = text.match(/(20\d{2}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]20\d{2})/);
  const referenceMatch = text.match(/(?:المرجع|رقم الفاتورة|invoice|reference|ref)[^A-Za-z0-9\u0600-\u06FF-]*([A-Za-z0-9-]{4,})/i);
  const taxMatch = text.match(/(?:الرقم الضريبي|tax|vat)[^A-Za-z0-9\u0600-\u06FF-]*([\d-]{6,})/i);
  const normalizedAmount = amountMatch?.[1]?.replace(/,/g, "").replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));

  return {
    vendorName: "يحتاج مطابقة الجهة",
    amount: normalizedAmount ? Number(normalizedAmount) || 0 : 0,
    currency: /جنيه|EGP|جنية/i.test(text) ? "EGP" : "غير محدد",
    date: dateMatch?.[1] ?? "غير محدد",
    referenceNo: referenceMatch?.[1] ?? "غير محدد",
    taxNo: taxMatch?.[1] ?? "غير محدد",
    confidence: Math.max(0, Math.min(1, confidence / 100)),
  };
}

export default function OcrIntakePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploaded, setUploaded] = useState<UploadedDocument | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>("receipt_vodafone_cash_30k.png");
  const [fileType, setFileType] = useState<"image" | "pdf">("image");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSample, setIsSample] = useState(true);
  const [extracted, setExtracted] = useState<ExtractedFields>({
    vendorName: "شركة العالمية للتوريد والمقاولات",
    amount: 30000,
    currency: "EGP",
    date: "2026-08-20",
    referenceNo: "VF-9842103",
    taxNo: "301-456-789",
    confidence: 0.94,
  });
  const [rawText, setRawText] = useState(
    "إيصال تحويل أموال - فودافون كاش\nتاريخ: 2026-08-20\nالمرسل: شركة العالمية للتوريد والمقاولات\nالمبلغ: 30,000.00 جنيه مصري\nرقم المرجع: VF-9842103\nالرقم الضريبي: 301-456-789\nحالة العملية: تم التحويل بنجاح"
  );
  const [reviewStatus, setReviewStatus] = useState<"pending" | "approved" | "rejected">("pending");

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function validateFile(file: File): string | null {
    if (!ACCEPTED_TYPES.includes(file.type)) return "نوع الملف غير مدعوم. ارفع صورة JPG أو PNG أو WEBP أو ملف PDF.";
    if (file.size > MAX_FILE_SIZE) return "حجم الملف يتجاوز 10MB، اختر ملفًا أصغر.";
    return null;
  }

  async function processImage(file: File, objectUrl: string) {
    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingMessage("تحميل محرك OCR واللغة العربية...");
    try {
      const worker = await createWorker("ara+eng", 1, {
        logger: (message) => {
          if (message.status) setProcessingMessage(message.status);
          if (typeof message.progress === "number") setProcessingProgress(Math.round(message.progress * 100));
        },
      });
      const result = await worker.recognize(objectUrl);
      await worker.terminate();
      const text = result.data.text.trim();
      setRawText(text || "لم يتم العثور على نص واضح في الصورة.");
      setExtracted(extractFieldsFromText(text, result.data.confidence));
      setProcessingMessage("اكتمل استخراج النص والحقول.");
      toast.success("تمت معالجة الملف المرفوع فعليًا بواسطة محرك OCR");
    } catch (error) {
      console.error(error);
      setErrorMessage("تعذر تشغيل OCR لهذا الملف. يمكنك مراجعة النص يدويًا أو إعادة رفع صورة أوضح.");
      setProcessingMessage("فشلت المعالجة");
      toast.error("تعذر معالجة الملف المرفوع");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleFile(file: File) {
    setErrorMessage(null);
    const validationError = validateFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      toast.error(validationError);
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const type = file.type === "application/pdf" ? "pdf" : "image";
    setUploaded({ file, previewUrl: nextPreviewUrl, type });
    setPreviewUrl(nextPreviewUrl);
    setSelectedFile(file.name);
    setFileType(type);
    setIsSample(false);
    setReviewStatus("pending");

    if (type === "image") {
      await processImage(file, nextPreviewUrl);
    } else {
      setRawText("تم رفع ملف PDF بنجاح. تمت تهيئته للمعالجة والمراجعة. يمكن تحويل صفحات PDF إلى صور في طبقة OCR الخادمية عند تفعيل المعالجة الإنتاجية.");
      setExtracted({
        vendorName: "يحتاج مطابقة الجهة",
        amount: 0,
        currency: "غير محدد",
        date: "غير محدد",
        referenceNo: "غير محدد",
        taxNo: "غير محدد",
        confidence: 0,
      });
      toast.success("تم رفع ملف PDF فعليًا وأصبح جاهزًا للمراجعة");
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void handleFile(file);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  function handleSample(fileName: string, type: "image" | "pdf") {
    setSelectedFile(fileName);
    setFileType(type);
    setIsSample(true);
    setUploaded(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setReviewStatus("pending");
    if (type === "pdf") {
      setExtracted({ vendorName: "مصنع أسمنت طرة", amount: 145000, currency: "EGP", date: "2026-08-19", referenceNo: "INV-2026-881", taxNo: "502-111-999", confidence: 0.91 });
      setRawText("فاتورة توريد مواد بناء\nالمورد: مصنع أسمنت طرة\nالتاريخ: 2026-08-19\nالمبلغ الإجمالي: 145,000 EGP\nرقم الفاتورة: INV-2026-881\nالرقم الضريبي: 502-111-999");
    } else {
      setExtracted({ vendorName: "شركة العالمية للتوريد والمقاولات", amount: 30000, currency: "EGP", date: "2026-08-20", referenceNo: "VF-9842103", taxNo: "301-456-789", confidence: 0.94 });
      setRawText("إيصال تحويل أموال - فودافون كاش\nتاريخ: 2026-08-20\nالمرسل: شركة العالمية للتوريد والمقاولات\nالمبلغ: 30,000.00 جنيه مصري\nرقم المرجع: VF-9842103\nالرقم الضريبي: 301-456-789");
    }
  }

  const createDraftMutation = trpc.smartIntake.createDraft.useMutation({
    onSuccess: () => {
      setReviewStatus("approved");
      toast.success("تم حفظ واعتماد مسودة المستند في قاعدة البيانات وسجل التدقيق المالي بنجاح");
      utils.smartIntake.list.invalidate();
    },
    onError: (err: any) => {
      toast.error(`تعذر الحفظ في قاعدة البيانات: ${err.message}`);
    },
  });

  const utils = trpc.useUtils();

  function handleApprove() {
    createDraftMutation.mutate({
      sourceType: "ocr",
      title: `مستند OCR: ${selectedFile || "document"}`,
      intent: "ocr_receipt_intake",
      vendorName: extracted.vendorName,
      amount: String(extracted.amount),
      currency: extracted.currency,
      documentDate: extracted.date,
      referenceNo: extracted.referenceNo,
      taxNo: extracted.taxNo,
      rawContent: rawText,
      confidence: String(extracted.confidence),
    });
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-primary font-semibold text-sm"><ScanText className="h-4 w-4" />ARQA OCR & Document Intelligence · رفع ومعالجة المستندات</div>
        <h1 className="text-3xl font-bold tracking-tight">رفع المستند بالسحب والإفلات ومعالجة OCR الفعلية</h1>
        <p className="text-muted-foreground text-sm max-w-3xl">اسحب إيصالًا أو فاتورة إلى منطقة الرفع، أو اختره من جهازك. تُعالج الصور فعليًا داخل المتصفح عبر Tesseract.js، وتبقى كل البيانات تحت المراجعة البشرية قبل اعتمادها ماليًا.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Upload className="h-5 w-5 text-primary" />رفع المستند</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <input ref={inputRef} type="file" accept={ACCEPTED_TYPES.join(",")} className="hidden" onChange={handleInputChange} />
              <div
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") inputRef.current?.click(); }}
                onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
                onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
                onDragLeave={(event) => { event.preventDefault(); setIsDragging(false); }}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-7 text-center space-y-3 cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary ${isDragging ? "border-primary bg-primary/10" : "bg-muted/20 hover:bg-muted/30"}`}
              >
                <Upload className={`h-10 w-10 mx-auto ${isDragging ? "text-primary animate-bounce" : "text-primary/80"}`} />
                <div className="space-y-1"><p className="text-sm font-semibold">{isDragging ? "أفلت الملف هنا لبدء المعالجة" : "اسحب الملف هنا أو انقر لاختياره"}</p><p className="text-xs text-muted-foreground">JPG, PNG, WEBP أو PDF · الحد الأقصى 10MB</p></div>
                <Button type="button" size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); inputRef.current?.click(); }}>اختيار ملف من الجهاز</Button>
              </div>

              {errorMessage && <div className="rounded-lg border border-destructive/30 bg-destructive/5 text-destructive text-xs p-3 flex items-start gap-2"><AlertCircle className="h-4 w-4 shrink-0" />{errorMessage}</div>}

              <div className="rounded-lg border p-3 space-y-2">
                <p className="text-xs font-semibold">عينات اختبار اختيارية</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant={selectedFile?.includes("vodafone") ? "default" : "outline"} onClick={() => handleSample("receipt_vodafone_cash_30k.png", "image")} className="gap-1.5"><ImageIcon className="h-3.5 w-3.5" />إيصال 30k</Button>
                  <Button size="sm" variant={selectedFile?.includes("cement") ? "default" : "outline"} onClick={() => handleSample("cement_invoice_145k.pdf", "pdf")} className="gap-1.5"><FileText className="h-3.5 w-3.5" />فاتورة PDF</Button>
                </div>
              </div>

              {selectedFile && <div className="rounded-xl border bg-card p-4 space-y-3 shadow-xs"><div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold flex items-center gap-1.5 min-w-0"><FileText className="h-4 w-4 text-primary shrink-0" /><span className="truncate">{selectedFile}</span></span><Badge variant="outline" className="text-xs shrink-0">{isSample ? "عينة" : fileType === "image" ? "صورة مرفوعة" : "PDF مرفوع"}</Badge></div><p className="text-xs text-muted-foreground">{uploaded ? `${(uploaded.file.size / 1024 / 1024).toFixed(2)} MB · ${uploaded.file.type}` : "بيانات تجريبية للمعاينة"}</p></div>}
            </CardContent>
          </Card>

          {selectedFile && <Card><CardHeader><CardTitle className="text-lg flex items-center justify-between"><span className="flex items-center gap-2"><ZoomIn className="h-5 w-5 text-primary" />معاينة الملف الأصلي</span><Badge variant="outline">{fileType === "image" ? "Image" : "PDF"}</Badge></CardTitle></CardHeader><CardContent><div className="rounded-lg border bg-muted/40 min-h-[300px] flex items-center justify-center overflow-hidden">{previewUrl && fileType === "image" ? <img src={previewUrl} alt="المستند المرفوع" className="max-h-[520px] w-full object-contain" /> : previewUrl && fileType === "pdf" ? <iframe src={previewUrl} title="معاينة ملف PDF المرفوع" className="w-full h-[520px]" /> : fileType === "image" ? <div className="w-full max-w-xs bg-card p-5 rounded-lg border shadow-sm text-xs space-y-3"><div className="flex justify-between border-b pb-2"><span>Vodafone Cash Receipt</span><span>Verified</span></div><p><strong>المرسل:</strong> شركة العالمية</p><p><strong>المبلغ:</strong> 30,000 EGP</p><p><strong>المرجع:</strong> VF-9842103</p></div> : <div className="w-full max-w-xs bg-card p-5 rounded-lg border shadow-sm text-xs space-y-3"><div className="flex justify-between border-b pb-2"><span>Tax Invoice #INV-881</span><span>PDF</span></div><p><strong>المورد:</strong> مصنع أسمنت طرة</p><p><strong>الإجمالي:</strong> 145,000 EGP</p><p><strong>الرقم الضريبي:</strong> 502-111-999</p></div>}</div></CardContent></Card>}
        </div>

        <div className="lg:col-span-7 space-y-6">
          <Card><CardHeader><CardTitle className="text-lg flex items-center justify-between"><span className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />الحقول المستخرجة والمراجعة</span><Badge variant="outline" className="font-mono text-xs">دقة: {Math.round(extracted.confidence * 100)}%</Badge></CardTitle></CardHeader><CardContent className="space-y-6">
            {isProcessing ? <div className="py-24 text-center space-y-4"><div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div><p className="text-sm text-muted-foreground">{processingMessage}</p><div className="max-w-sm mx-auto h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${processingProgress}%` }} /></div><p className="text-xs text-muted-foreground">{processingProgress}%</p></div> : <div className="space-y-6"><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="text-xs font-medium text-muted-foreground mb-1 block">المورد أو جهة التحصيل</label><Input value={extracted.vendorName} onChange={(e) => setExtracted({ ...extracted, vendorName: e.target.value })} /></div><div><label className="text-xs font-medium text-muted-foreground mb-1 block">المبلغ ({extracted.currency})</label><Input type="number" value={extracted.amount} onChange={(e) => setExtracted({ ...extracted, amount: Number(e.target.value) })} /></div><div><label className="text-xs font-medium text-muted-foreground mb-1 block">تاريخ المستند</label><Input value={extracted.date} onChange={(e) => setExtracted({ ...extracted, date: e.target.value })} /></div><div><label className="text-xs font-medium text-muted-foreground mb-1 block">رقم المرجع / العملية</label><Input value={extracted.referenceNo} onChange={(e) => setExtracted({ ...extracted, referenceNo: e.target.value })} /></div><div><label className="text-xs font-medium text-muted-foreground mb-1 block">الرقم الضريبي</label><Input value={extracted.taxNo} onChange={(e) => setExtracted({ ...extracted, taxNo: e.target.value })} /></div></div><div className="space-y-2"><label className="text-xs font-medium text-muted-foreground block">النص الخام المستخرج (OCR Raw Text)</label><textarea className="w-full h-36 p-3 rounded-md border border-input bg-muted/30 text-xs font-mono" value={rawText} onChange={(e) => setRawText(e.target.value)} /></div><div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t"><div>{reviewStatus === "approved" ? <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><CheckCircle2 className="h-4 w-4" />معتمد كمسودة تشغيلية</span> : <span className="text-xs text-amber-600 font-medium flex items-center gap-1"><AlertCircle className="h-4 w-4" />يتطلب اعتمادًا بشريًا قبل الترحيل النهائي</span>}</div><Button size="sm" onClick={handleApprove} disabled={reviewStatus === "approved"} className="gap-1.5"><CheckCircle2 className="h-4 w-4" />اعتماد المسودة بعد المراجعة</Button></div></div>}
          </CardContent></Card>
        </div>
      </div>
    </div>
  );
}
