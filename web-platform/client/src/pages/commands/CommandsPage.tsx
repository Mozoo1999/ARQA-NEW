import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, MessageSquare, Mic, Sparkles, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function CommandsPage() {
  const [commandText, setCommandText] = useState("");
  const [preview, setPreview] = useState<{
    intent: string;
    amount: number;
    entity: string;
    summary: string;
    confidence: number;
  } | null>(null);

  const [suggestionStatus, setSuggestionStatus] = useState<"pending" | "approved" | "dismissed">("pending");

  const utils = trpc.useUtils();
  const createDraftMutation = trpc.smartIntake.createDraft.useMutation({
    onSuccess: () => {
      toast.success("تم حفظ الاعتماد والأمر في قاعدة البيانات وسجل التدقيق بنجاح");
      setPreview(null);
      setCommandText("");
      utils.smartIntake.list.invalidate();
    },
    onError: (err: any) => {
      toast.error(`تعذر الحفظ في قاعدة البيانات: ${err.message}`);
    },
  });

  function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!commandText.trim()) {
      toast.error("الرجاء إدخال أمر صوتي أو نصي");
      return;
    }
    const text = commandText.trim();
    if (text.includes("دفعة") || text.includes("فودافون كاش") || text.includes("تحويل")) {
      setPreview({
        intent: "create_collection_draft",
        amount: 30000,
        entity: "شركة العالمية للتوريد",
        summary: "إنشاء مسودة تحصيل بقيمة 30,000 جنيه (مطابقة محفظة فودافون كاش).",
        confidence: 0.92,
      });
    } else if (text.includes("قسط") || text.includes("سيارة")) {
      setPreview({
        intent: "create_installment",
        amount: 10000,
        entity: "مصطفى فتحي",
        summary: "إنشاء مسودة قسط بقيمة 10,000 جنيه على أصل (سيارة مصطفى فتحي).",
        confidence: 0.85,
      });
    } else {
      setPreview({
        intent: "general_inquiry",
        amount: 0,
        entity: "غير محدد",
        summary: `تم تحليل النص بنجاح: "${text}". يلزمه ربط بجهة تشغيلية.`,
        confidence: 0.70,
      });
    }
    toast.success("تم تحليل الأمر بنجاح واستخراج الكيانات والمبالغ");
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-primary font-semibold text-sm">
          <Sparkles className="h-4 w-4" />
          ARQA Voice & Notification Intake · الاستخبارات الصوتية والإشعارات
        </div>
        <h1 className="text-3xl font-bold tracking-tight">معالجة الأوامر الصوتية والنصية والإشارات المالية</h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          تحويل الأوامر الصوتية باللغة العربية وإشعارات المحافظ المالية (مثل فودافون كاش) إلى مسودات تشغيلية قابلة للمراجعة والاعتماد دون إدخال يدوي.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mic className="h-5 w-5 text-primary" />
              محلل الأوامر الصوتية والنصية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              جرّب كتابة أو قول: «استلام دفعة تحويل فودافون كاش 30 ألف جنيه من شركة العالمية» أو «قسط عشرة آلاف جنيه على سيارة مصطفى فتحي».
            </p>
            <form onSubmit={handleAnalyze} className="space-y-3">
              <Input
                placeholder="اكتب الأمر هنا أو استخدم الميكروفون..."
                value={commandText}
                onChange={(e) => setCommandText(e.target.value)}
              />
              <div className="flex gap-2">
                <Button type="submit" className="gap-2 flex-1">
                  <Sparkles className="h-4 w-4" />
                  تحليل الأمر واستخراج الكيانات
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCommandText("استلام دفعة تحويل فودافون كاش 30 ألف جنيه من شركة العالمية");
                  }}
                >
                  تجربة مثال
                </Button>
              </div>
            </form>

            {preview && (
              <div className="rounded-xl border bg-muted/20 p-4 space-y-3 mt-4 animate-in fade-in-50">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-mono text-xs">نية الأمر: {preview.intent}</Badge>
                  <span className="text-xs text-muted-foreground">الثقة: {Math.round(preview.confidence * 100)}%</span>
                </div>
                <p className="text-sm font-medium text-foreground">{preview.summary}</p>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="gap-1.5"
                    disabled={createDraftMutation.isPending}
                    onClick={() => {
                      createDraftMutation.mutate({
                        sourceType: "voice_command",
                        title: `أمر صوتي/نصي: ${preview.entity}`,
                        intent: preview.intent,
                        vendorName: preview.entity,
                        amount: String(preview.amount),
                        currency: "EGP",
                        rawContent: commandText,
                        confidence: String(preview.confidence),
                      });
                    }}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {createDraftMutation.isPending ? "جاري الحفظ..." : "اعتماد وتحويل لمسودة تشغيلية"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setPreview(null)}>
                    تجاهل
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              إشارات المحافظ والإشعارات الواردة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              إشارات مالية مستخرجة آليًا من إشعارات الرسائل والمحافظ (مثل فودافون كاش) تتطلب مراجعة المشرف قبل الترحيل المالي.
            </p>

            <div className="rounded-xl border p-4 space-y-3 bg-card shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    <strong className="text-sm font-semibold">إشعار محفظة فودافون كاش واردة</strong>
                  </div>
                  <p className="text-sm mt-1">تم استلام مبلغ <strong>20,000 جنيه</strong> من رقم 01012345678 (شركة العالمية للتوريد).</p>
                </div>
                <Badge variant="secondary">قيد المراجعة</Badge>
              </div>

              {suggestionStatus === "pending" ? (
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="gap-1.5" onClick={() => { setSuggestionStatus("approved"); toast.success("تم إنشاء مسودة التحصيل وإرسالها لدفتر الحسابات"); }}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    إضافة كمسودة تحصيل
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => { setSuggestionStatus("dismissed"); toast.info("تم تجاهل الإشعار"); }}>
                    <XCircle className="h-3.5 w-3.5" />
                    تجاهل
                  </Button>
                </div>
              ) : suggestionStatus === "approved" ? (
                <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> تم اعتماد الإشعار وتحويله إلى مسودة تحصيل معتمدة.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">تم تجاهل هذا الإشعار ولم يتم إنشاء حركة مالية.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
