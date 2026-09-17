import { AlertTriangle, CheckCircle2, FileText, LockKeyhole, MessageSquare, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const requirements = [
  "حساب Meta Business وحساب WhatsApp Business رسميان مع التفويض والموافقات اللازمة.",
  "عنوان Webhook عام يعمل عبر TLS، وVerify Token وApp Secret محفوظان في بيئة الخادم فقط.",
  "سياسة موافقة واحتفاظ وحذف للرسائل الواردة، مع تحديد مراجعين مخولين.",
  "تحقق عملي من توقيع HMAC-SHA256، التحقق GET، التكرار، والرفض قبل إعلان الاتصال.",
];

const boundaries = [
  { title: "لا اتصال رسمي في هذا الإصدار", detail: "لم تُهيأ بيانات اعتماد Meta أو حساب أعمال في بيئة الخادم الحالية؛ لا تستقبل هذه الواجهة رسائل WhatsApp." },
  { title: "لا محاكاة ولا بيانات مصطنعة", detail: "أزيلت واجهة المحاكاة التي كانت قد توحي بوصول Webhook أو إرسال رسالة. لا توجد رسالة واردة أو مطالبة أو تحصيل تم إنشاؤه هنا." },
  { title: "مراجعة بشرية إلزامية", detail: "عند الإعداد الرسمي لاحقاً، تحفظ الرسالة الموقعة كحدث مراجعة فقط؛ لا تنشئ حمولة أو إذن استلام أو فاتورة أو قيداً مالياً تلقائياً." },
];

export default function WhatsAppIntegrationPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6" dir="rtl">
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-primary text-sm font-semibold"><MessageSquare className="h-4 w-4" />تكامل الرسائل الرسمي</div>
        <div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-bold tracking-tight">WhatsApp Business</h1><Badge variant="outline" className="border-amber-500/50 text-amber-700 dark:text-amber-300">غير مهيأ</Badge></div>
        <p className="max-w-3xl text-sm leading-7 text-muted-foreground">هذه صفحة حالة وحدود تشغيلية، وليست محاكياً للتكامل. لا يبدأ الاستقبال التلقائي حتى اكتمال إعداد Meta الرسمي والتحقق الأمني والموافقة وسياسة الاحتفاظ.</p>
      </section>

      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="flex gap-3 p-5 text-sm leading-6"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" /><div><strong>الحالة الحالية: غير متصل.</strong><br />لا توجد بيانات اعتماد أو endpoint متحقق أو حساب WhatsApp Business مفعّل في بيئة الخادم. لا ترسل هذه الصفحة رسائل ولا تنشئ سجلات تجارية.</div></CardContent>
      </Card>

      <div className="grid gap-5 md:grid-cols-3">
        {boundaries.map(item => <Card key={item.title}><CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4 text-primary" />{item.title}</CardTitle></CardHeader><CardContent className="text-sm leading-6 text-muted-foreground">{item.detail}</CardContent></Card>)}
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><LockKeyhole className="h-5 w-5 text-primary" />متطلبات التفعيل الرسمي</CardTitle></CardHeader>
        <CardContent className="space-y-3">{requirements.map(requirement => <div className="flex gap-3 text-sm leading-6" key={requirement}><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{requirement}</span></div>)}</CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />مسار الإدخال المتاح الآن</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground"><p>يمكن للمستخدم اختيار جهة اتصال واحدة من التطبيق الجوال، ثم لصق أو مشاركة محتوى يملك حق استخدامه، وتأكيد الموافقة. يُنشأ بعد ذلك <strong className="text-foreground">مسودة مراجعة</strong> فقط.</p><p>لا يقرأ النظام دفتر العناوين كاملاً، ولا يراقب SMS، ولا يستخدم WhatsApp Web أو أي واجهة غير رسمية.</p></CardContent>
      </Card>
    </div>
  );
}
