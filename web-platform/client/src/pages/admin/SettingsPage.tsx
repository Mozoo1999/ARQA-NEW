import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Settings, Sliders, Mic, Shield, Building, Palette, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    orgName: "مجموعة المؤسسة الهندسية (ARQA EBOS)",
    orgCode: "ARQA-HQ-01",
    themeMode: "light",
    currency: "EGP",
    cfoName: "م. طارق العتيبي (المدير المالي)",
    voiceCommandEnabled: true,
    autoAuditLog: true,
    whatsappWebhookActive: true,
  });

  const [saving, setSaving] = useState(false);

  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("تم حفظ إعدادات المؤسسة وتحديث الهوية والنظام بنجاح");
    }, 600);
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <Settings className="h-4 w-4" />
            System Configuration & Voice Control · إعدادات النظام والهوية والتحكم الصوتي
          </div>
          <h1 className="text-3xl font-bold tracking-tight">إعدادات المنظومة والمؤسسة</h1>
          <p className="text-muted-foreground text-sm max-w-2xl mt-1">
            تخصيص الهوية البصرية، بيانات التقارير الرسمية، وتفعيل الأوامر الصوتية وتحكم الذكاء الاصطناعي.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2 bg-primary text-primary-foreground">
          <CheckCircle2 className="h-4 w-4" />
          {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              بيانات الهوية والمؤسسة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">اسم المؤسسة / الشركة</Label>
                <Input
                  id="orgName"
                  value={settings.orgName}
                  onChange={(e) => setSettings({ ...settings, orgName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgCode">رمز المقر الرئيسي</Label>
                <Input
                  id="orgCode"
                  value={settings.orgCode}
                  onChange={(e) => setSettings({ ...settings, orgCode: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">العملة الأساسية للمعاملات</Label>
                <Input
                  id="currency"
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cfoName">اعتماد المدير المالي (لتقارير PDF)</Label>
                <Input
                  id="cfoName"
                  value={settings.cfoName}
                  onChange={(e) => setSettings({ ...settings, cfoName: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              المظهر والهوية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>شعار المؤسسة المعتمد</Label>
              <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border">
                <div className="w-12 h-12 bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center rounded-lg">
                  AQ
                </div>
                <div>
                  <div className="font-semibold text-sm">ARQA-EBOS-LOGO.svg</div>
                  <div className="text-xs text-muted-foreground">نشط في ترويسة التقارير وتطبيق الهاتف</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-xl border">
              <div>
                <div className="font-medium text-sm">الوضع الداكن (Dark Mode)</div>
                <div className="text-xs text-muted-foreground">تبديل السمة العامة للمنصة</div>
              </div>
              <Switch
                checked={settings.themeMode === "dark"}
                onCheckedChange={(checked) => setSettings({ ...settings, themeMode: checked ? "dark" : "light" })}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            إدارة التحكم الصوتي والأوامر الذكية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 bg-card rounded-xl border">
              <div className="space-y-0.5">
                <div className="font-medium text-sm">محرك الأوامر الصوتية</div>
                <div className="text-xs text-muted-foreground">تلقي وتحليل الأوامر باللغة العربية</div>
              </div>
              <Switch
                checked={settings.voiceCommandEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, voiceCommandEnabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-card rounded-xl border">
              <div className="space-y-0.5">
                <div className="font-medium text-sm">سجل التدقيق التلقائي</div>
                <div className="text-xs text-muted-foreground">حفظ كل عملية تعديل إعدادات</div>
              </div>
              <Switch
                checked={settings.autoAuditLog}
                onCheckedChange={(checked) => setSettings({ ...settings, autoAuditLog: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-card rounded-xl border">
              <div className="space-y-0.5">
                <div className="font-medium text-sm">تكامل WhatsApp Webhook</div>
                <div className="text-xs text-muted-foreground">استقبال إيصالات التحصيل فوريًا</div>
              </div>
              <Switch
                checked={settings.whatsappWebhookActive}
                onCheckedChange={(checked) => setSettings({ ...settings, whatsappWebhookActive: checked })}
              />
            </div>
          </div>

          <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-2">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <Sliders className="h-4 w-4" />
              أمثلة على الأوامر الصوتية لضبط الإعدادات:
            </div>
            <p className="text-xs text-muted-foreground">
              يمكنك استخدام الأوامر الصوتية في صفحة الأوامر أو المساعد الصوتي لتعديل النظام فوراً، مثل:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge variant="outline" className="bg-card">«غيّر اسم الشركة إلى مجموعة أرقة الكبرى»</Badge>
              <Badge variant="outline" className="bg-card">«فعّل الوضع الداكن»</Badge>
              <Badge variant="outline" className="bg-card">«اعرض إعدادات الهوية»</Badge>
              <Badge variant="outline" className="bg-card">«حدّث اسم المدير المالي»</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
