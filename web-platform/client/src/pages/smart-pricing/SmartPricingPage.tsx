import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calculator, CheckCircle2, TrendingUp, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CostLine {
  label: string;
  perUnit: number;
  total: number;
}

export default function SmartPricingPage() {
  const [quantity, setQuantity] = useState(3000);
  const [purchase, setPurchase] = useState(126);
  const [transport, setTransport] = useState(28);
  const [loading, setLoading] = useState(0);
  const [extras, setExtras] = useState(0);
  const [payload, setPayload] = useState(20);
  const [waste, setWaste] = useState(0); // percentage
  const [admin, setAdmin] = useState(3); // percentage
  const [profit, setProfit] = useState(15); // percentage

  const wasteRate = waste / 100;
  const adminRate = admin / 100;
  const profitRate = profit / 100;

  const validQuantity = quantity > 0 ? quantity : 1;
  const validPayload = payload > 0 ? payload : 1;
  const requiredSourceQuantity = validQuantity / (1 - wasteRate);
  const estimatedTrips = Math.ceil(requiredSourceQuantity / validPayload);

  const baseTotal = (purchase + transport + loading + extras) * validQuantity;
  const wasteTotal = baseTotal * (requiredSourceQuantity / validQuantity - 1);
  const landedTotal = baseTotal + wasteTotal;
  const adminTotal = landedTotal * adminRate;
  const costBeforeProfit = landedTotal + adminTotal;
  const profitTotal = costBeforeProfit * profitRate;
  const totalPrice = costBeforeProfit + profitTotal;

  const recommendedUnitPrice = totalPrice / validQuantity;
  const landedUnitCost = landedTotal / validQuantity;

  const costLines: CostLine[] = [
    { label: "شراء المادة", perUnit: purchase, total: purchase * validQuantity },
    { label: "النقل", perUnit: transport, total: transport * validQuantity },
    { label: "التحميل", perUnit: loading, total: loading * validQuantity },
    { label: "رسوم ومصروفات إضافية", perUnit: extras, total: extras * validQuantity },
    { label: "أثر الهالك", perUnit: wasteTotal / validQuantity, total: wasteTotal },
    { label: "مصروف إداري", perUnit: adminTotal / validQuantity, total: adminTotal },
    { label: "هامش الربح", perUnit: profitTotal / validQuantity, total: profitTotal },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-primary font-semibold text-sm">
          <Calculator className="h-4 w-4" />
          ARQA Supply Core · محرك التكلفة وسلسلة القيمة
        </div>
        <h1 className="text-3xl font-bold tracking-tight">حاسبة التسعير الذكي وسلسلة التكلفة الهابطة</h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          احسب التكلفة الهابطة الكاملة لمواد البناء والتوريد (شراء، تحميل، نقل، انتظار، هالك، مصاريف إدارية) لتوليد سعر بيع دقيق وموثوق قبل اتخاذ القرار.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-primary/20 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              مدخلات سلسلة التكلفة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">الكمية المطلوبة (طن)</label>
                <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">سعر الشراء / طن (جنيه)</label>
                <Input type="number" min="0" value={purchase} onChange={(e) => setPurchase(Number(e.target.value))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">النقل / طن (جنيه)</label>
                <Input type="number" min="0" value={transport} onChange={(e) => setTransport(Number(e.target.value))} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">التحميل / طن (جنيه)</label>
                <Input type="number" min="0" value={loading} onChange={(e) => setLoading(Number(e.target.value))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">رسوم ومصروفات / طن</label>
                <Input type="number" min="0" value={extras} onChange={(e) => setExtras(Number(e.target.value))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">الحمولة الصافية للنقلة (طن)</label>
                <Input type="number" min="1" value={payload} onChange={(e) => setPayload(Number(e.target.value))} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">هالك متوقع (%)</label>
                <Input type="number" min="0" max="99" value={waste} onChange={(e) => setWaste(Number(e.target.value))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">مصروف إداري (%)</label>
                <Input type="number" min="0" value={admin} onChange={(e) => setAdmin(Number(e.target.value))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">هامش الربح (%)</label>
                <Input type="number" min="0" value={profit} onChange={(e) => setProfit(Number(e.target.value))} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="bg-primary text-primary-foreground shadow-md">
            <CardContent className="p-6 space-y-2">
              <p className="text-xs uppercase tracking-wider text-primary-foreground/80 font-semibold">سعر البيع المقترح</p>
              <p className="text-4xl font-extrabold">{recommendedUnitPrice.toLocaleString("en-US", { maximumFractionDigits: 2 })} جنيه</p>
              <p className="text-xs text-primary-foreground/80">للكل طن مسلّم بالموقع</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">التكلفة الهابطة / طن</span>
                <span className="font-semibold">{landedUnitCost.toLocaleString("en-US", { maximumFractionDigits: 2 })} جنيه</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">إجمالي العرض المالي</span>
                <span className="font-semibold">{totalPrice.toLocaleString("en-US", { maximumFractionDigits: 2 })} جنيه</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="text-muted-foreground">عدد النقلات التقديري</span>
                <span className="font-semibold">{estimatedTrips} نقلة ({Math.round(requiredSourceQuantity).toLocaleString()} طن مصدر)</span>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full gap-2" onClick={() => toast.success("تم حفظ لقطة التسعير بنجاح في السجل التاريخي")}>
            <CheckCircle2 className="h-4 w-4" />
            اعتماد وحفظ لقطة التسعير
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">تفاصيل سلسلة التكلفة لكل طن والإجمالي</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-right p-3 font-medium">البند</th>
                    <th className="text-right p-3 font-medium">للطّن</th>
                    <th className="text-right p-3 font-medium">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {costLines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-muted/30">
                      <td className="p-3 font-medium">{line.label}</td>
                      <td className="p-3 text-muted-foreground">{line.perUnit.toLocaleString("en-US", { maximumFractionDigits: 2 })} ج</td>
                      <td className="p-3 font-mono">{line.total.toLocaleString("en-US", { maximumFractionDigits: 2 })} ج</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              مقارنة بدائل التوريد (سن 1 نموذج)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-lg border bg-primary/5 border-primary/20 space-y-1">
              <div className="flex justify-between font-semibold">
                <span>كسارة B (الأفضل حالياً)</span>
                <span className="text-primary">154 ج/طن</span>
              </div>
              <p className="text-xs text-muted-foreground">126 شراء + 28 نقل — أقل تكلفة هابطة والتزام زمني مرتفع.</p>
            </div>
            <div className="p-3 rounded-lg border space-y-1">
              <div className="flex justify-between font-semibold">
                <span>كسارة A</span>
                <span>165 ج/طن</span>
              </div>
              <p className="text-xs text-muted-foreground">120 شراء + 45 نقل — سعر شراء منخفض لكن تكلفة النقل ترفع الإجمالي.</p>
            </div>
            <div className="p-3 rounded-lg border space-y-1">
              <div className="flex justify-between font-semibold">
                <span>كسارة C</span>
                <span>178 ج/طن</span>
              </div>
              <p className="text-xs text-muted-foreground">118 شراء + 60 نقل — غير مفضلة بسبب بعد المسافة وارتفاع تكلفة النقل.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
