import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, FileText, Image as ImageIcon, MessageSquare, Mic, PhoneCall, Send, ShieldAlert, Sparkles, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function WhatsAppIntegrationPage() {
  const [phone, setPhone] = useState("+201012345678");
  const [template, setTemplate] = useState("payment_reminder_ar");
  const [amount, setAmount] = useState("30000");
  const [customerName, setCustomerName] = useState("شركة العالمية للتوريد");
  const [inboundText, setInboundText] = useState("تم تحويل دفعة 30 ألف جنيه على فودافون كاش ومرفق الإيصال");

  const [simulatedInbound, setSimulatedInbound] = useState<{
    id: string;
    from: string;
    text: string;
    receivedAt: string;
    status: string;
  } | null>({
    id: "wamid.HBgLOTE...",
    from: "+201012345678",
    text: "تم تحويل دفعة 30 ألف جنيه على فودافون كاش ومرفق الإيصال",
    receivedAt: "2026-08-20 10:30 AM",
    status: "تم استخراج مسودة تحصيل (في انتظار المطابقة البشرية)",
  });

  function handleSendReminder(e: React.FormEvent) {
    e.preventDefault();
    toast.success(`تم إرسال قالب المطالبة (${template}) إلى الرقم ${phone} عبر قناة WhatsApp Business المعتمدة`);
  }

  function handleSimulateWebhook(e: React.FormEvent) {
    e.preventDefault();
    if (!inboundText.trim()) return;
    setSimulatedInbound({
      id: `wamid.${Math.random().toString(36).substring(7)}`,
      from: phone,
      text: inboundText,
      receivedAt: new Date().toLocaleString("ar-EG"),
      status: "تم تحليل الوارد وإنشاء مسودة تدقيق مرتبطة بالمورد أو العميل",
    });
    toast.success("تم استقبال رسالة عبر Webhook ومطابقتها بقاعدة الكيانات بنجاح");
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-primary font-semibold text-sm">
          <MessageSquare className="h-4 w-4" />
          ARQA Multi-modal & WhatsApp Integration · قنوات الإدخال والتكامل الخارجي
        </div>
        <h1 className="text-3xl font-bold tracking-tight">إدارة قناة WhatsApp Business والإدخال المتعدد (صوت، صورة، مستند)</h1>
        <p className="text-muted-foreground text-sm max-w-3xl">
          إدارة قنوات التواصل المعتمدة وفق وثائق ARQA-NEW. يتيح النظام محاكاة Webhook لرسائل واتساب الواردة، واستقبال المستندات والصور والملاحظات الصوتية، وتجهيز مسودات التحصيل والمطالبات دون افتراض إتمام التحصيل الآلي.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              محاكي رسائل Webhook وواتساب الواردة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              محاكاة استلام رسالة عبر WhatsApp Webhook مع مرفق أو إيصال سداد، وتحليلها آليًا لإنشاء مسودة تدقيق مالية.
            </p>

            <form onSubmit={handleSimulateWebhook} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">رقم المرسل (WhatsApp)</label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">اسم الجهة المطابقة</label>
                  <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">محتوى الرسالة الواردة</label>
                <Input value={inboundText} onChange={(e) => setInboundText(e.target.value)} />
              </div>

              <div className="flex items-center gap-4 pt-2">
                <Button type="submit" className="gap-2">
                  <Send className="h-4 w-4" />
                  محاكاة وصول Webhook
                </Button>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                  يتطلب مفتاح توقيع HMAC ورقم أعمال رسمي عند التشغيل الإنتاجي.
                </span>
              </div>
            </form>

            {simulatedInbound && (
              <div className="rounded-xl border bg-muted/20 p-4 space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">حالة الـ Webhook: نشط</Badge>
                    <span className="text-xs text-muted-foreground">{simulatedInbound.receivedAt}</span>
                  </div>
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">تم التعرف على الكيان</Badge>
                </div>
                <div className="text-sm space-y-1">
                  <p><strong>المرسل:</strong> {simulatedInbound.from} ({customerName})</p>
                  <p><strong>النص المستلم:</strong> "{simulatedInbound.text}"</p>
                  <p className="text-xs text-primary font-medium pt-1"><strong>النتيجة التشغيلية:</strong> {simulatedInbound.status}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">طرق الإدخال المتعددة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <Mic className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <strong className="block text-xs font-semibold">الأوامر الصوتية</strong>
                <p className="text-xs text-muted-foreground mt-0.5">تفريغ الصوت وتحويله إلى مسودة قسط أو دفعة مع درجة ثقة موثقة.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <ImageIcon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <strong className="block text-xs font-semibold">الصور والإيصالات (OCR)</strong>
                <p className="text-xs text-muted-foreground mt-0.5">قراءة إيصالات التحويل أو الأوزان وربطها التلقائي بمستندات الشحن.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <strong className="block text-xs font-semibold">المستندات والعقود (PDF)</strong>
                <p className="text-xs text-muted-foreground mt-0.5">استخراج بنود العقود وجداول الكميات (BOQ) واقتراح ربطها بالمشروع.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            إرسال المطالبات والتذكيرات عبر واتساب
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendReminder} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">رقم المستلم</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">قالب الرسالة المعتمد</label>
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
              >
                <option value="payment_reminder_ar">تذكير سداد ذمم (payment_reminder_ar)</option>
                <option value="supply_dispatch_ar">تأكيد أمر توريد (supply_dispatch_ar)</option>
                <option value="quote_approval_ar">اعتماد عرض سعر (quote_approval_ar)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">المبلغ المستحق (جنيه)</label>
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <Button type="submit" className="gap-2">
              <Send className="h-4 w-4" />
              إرسال عبر WhatsApp
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
