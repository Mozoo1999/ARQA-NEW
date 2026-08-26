import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, Eye, FileSpreadsheet, FileText, Filter, Printer, RefreshCw, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";

export default function ReportsExportPage() {
  const { data: drafts = [], isLoading, refetch } = trpc.smartIntake.list.useQuery();
  const approvedDrafts = drafts.filter((d: any) => d.status === "approved" || d.status === "posted_to_ledger");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  // Apply filters to approvedDrafts
  const filteredDrafts = approvedDrafts.filter((d: any) => {
    if (startDate && d.documentDate && d.documentDate < startDate) return false;
    if (endDate && d.documentDate && d.documentDate > endDate) return false;
    if (selectedMonth && d.documentDate && !d.documentDate.startsWith(selectedMonth)) return false;
    return true;
  });

  const queryParams = new URLSearchParams();
  if (startDate) queryParams.set("startDate", startDate);
  if (endDate) queryParams.set("endDate", endDate);
  if (selectedMonth) queryParams.set("month", selectedMonth);
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";

  function handleExportCsv() {
    window.open(`/api/reports/approved-drafts.csv${queryString}`, "_blank");
    toast.success("جاري تحميل تقرير Excel / CSV بالفلاتر المحددة...");
  }

  function handleExportPdf() {
    window.open(`/api/reports/approved-drafts.pdf${queryString}`, "_blank");
    toast.success("جاري تجهيز تقرير PDF بالفلاتر المحددة...");
  }

  function handleResetFilters() {
    setStartDate("");
    setEndDate("");
    setSelectedMonth("");
    toast.info("تم إعادة تعيين الفلاتر الزمنية");
  }

  const totalAmount = filteredDrafts.reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <FileSpreadsheet className="h-4 w-4" />
            ARQA Financial Ledger & Reports · تقارير وتصدير المعاملات المعتمدة
          </div>
          <h1 className="text-3xl font-bold tracking-tight">تصدير تقارير المسودات المالية (Excel & PDF)</h1>
          <p className="text-muted-foreground text-sm max-w-2xl mt-1">
            تصفية واستعراض ومعاينة وتصدير المسودات والمستندات المالية المعتمدة حسب النطاق الزمني أو الشهر.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            تحديث البيانات
          </Button>
          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 border-primary/40 text-primary hover:bg-primary/10">
                <Eye className="h-4 w-4" />
                معاينة التقرير المفلتر
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto" dir="rtl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />معاينة تقرير المسودات المالية المعتمدة</DialogTitle>
                <DialogDescription>
                  مراجعة المعاملات المطابقة للفلاتر الزمنية المحددة قبل التنزيل.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/30 p-4 rounded-xl border text-xs">
                  <div><span className="text-muted-foreground block">النطاق الزمني:</span><strong>{startDate || endDate ? `${startDate || 'البداية'} إلى ${endDate || 'النهاية'}` : selectedMonth ? `شهر ${selectedMonth}` : 'جميع الفترات'}</strong></div>
                  <div><span className="text-muted-foreground block">عدد المعاملات:</span><strong>{filteredDrafts.length} مستند</strong></div>
                  <div><span className="text-muted-foreground block">إجمالي المبالغ:</span><strong>{totalAmount.toLocaleString("en-US")} EGP</strong></div>
                  <div><span className="text-muted-foreground block">حالة التدقيق:</span><Badge className="bg-emerald-600 mt-1">معتمد وموثق</Badge></div>
                </div>

                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">المعرف</TableHead>
                        <TableHead className="text-right">المصدر</TableHead>
                        <TableHead className="text-right">العنوان / المورد</TableHead>
                        <TableHead className="text-right">المبلغ (EGP)</TableHead>
                        <TableHead className="text-right">التاريخ</TableHead>
                        <TableHead className="text-right">رقم المرجع</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDrafts.map((d: any) => (
                        <TableRow key={d.id}>
                          <TableCell className="font-mono">#{d.id}</TableCell>
                          <TableCell><Badge variant="outline">{d.sourceType}</Badge></TableCell>
                          <TableCell className="font-medium">{d.title} {d.vendorName ? `(${d.vendorName})` : ""}</TableCell>
                          <TableCell className="font-bold">{Number(d.amount || 0).toLocaleString("en-US")} {d.currency || "EGP"}</TableCell>
                          <TableCell>{d.documentDate || "—"}</TableCell>
                          <TableCell className="font-mono text-xs">{d.referenceNo || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setPreviewOpen(false)}>إغلاق المعاينة</Button>
                <Button variant="outline" onClick={() => { setPreviewOpen(false); handleExportCsv(); }} className="gap-1.5 border-emerald-600/40 text-emerald-600">
                  <FileSpreadsheet className="h-4 w-4" /> تنزيل Excel
                </Button>
                <Button onClick={() => { setPreviewOpen(false); handleExportPdf(); }} className="gap-1.5 bg-primary text-primary-foreground">
                  <FileText className="h-4 w-4" /> تنزيل PDF / طباعة
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" onClick={handleExportCsv} className="gap-2 border-emerald-600/40 text-emerald-600 hover:bg-emerald-50">
            <FileSpreadsheet className="h-4 w-4" />
            تصدير Excel (CSV)
          </Button>
          <Button size="sm" onClick={handleExportPdf} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <FileText className="h-4 w-4" />
            تصدير PDF / طباعة
          </Button>
        </div>
      </div>

      {/* Filter Controls Card */}
      <Card className="bg-muted/20 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            الفلاتر الزمنية المتقدمة للتقرير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5">
              <Label htmlFor="startDate" className="text-xs">من تاريخ</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-background text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endDate" className="text-xs">إلى تاريخ</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-background text-xs"
              />
            </div>
            <div className="space-y-1.5 flex gap-2 items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="selectedMonth" className="text-xs">أو تصفية بالشهر (YYYY-MM)</Label>
                <Input
                  id="selectedMonth"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-background text-xs"
                />
              </div>
              {(startDate || endDate || selectedMonth) && (
                <Button variant="ghost" size="icon" onClick={handleResetFilters} title="إلغاء الفلاتر">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">المسودات المطابقة للفلاتر</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{filteredDrafts.length} <span className="text-xs font-normal text-muted-foreground">من {approvedDrafts.length}</span></div><p className="text-xs text-muted-foreground mt-1">جاهزة للتصدير والترحيل المالي</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">إجمالي المبالغ المطابقة</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalAmount.toLocaleString("en-US")} EGP</div><p className="text-xs text-muted-foreground mt-1">مُدقق بشرياً</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">حالة السجل المالي</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-emerald-600">متزامن ومنتظم</div><p className="text-xs text-muted-foreground mt-1">مرتبط بسجل التدقيق (activity_log)</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Download className="h-5 w-5 text-primary" />قائمة المعاملات والمسودات المطابقة</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">جاري تحميل السجلات المالية...</div>
          ) : filteredDrafts.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
              <p className="text-sm font-medium text-muted-foreground">لا توجد مسودات مطابقة للفلاتر الزمنية المحددة.</p>
              <p className="text-xs text-muted-foreground">جرب تغيير نطاق التاريخ أو إلغاء الفلتر لعرض جميع المعاملات المعتمدة.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المعرف</TableHead>
                    <TableHead className="text-right">المصدر</TableHead>
                    <TableHead className="text-right">العنوان / المورد</TableHead>
                    <TableHead className="text-right">المبلغ (EGP)</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">رقم المرجع</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrafts.map((d: any) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono">#{d.id}</TableCell>
                      <TableCell><Badge variant="outline">{d.sourceType}</Badge></TableCell>
                      <TableCell className="font-medium">{d.title} {d.vendorName ? `(${d.vendorName})` : ""}</TableCell>
                      <TableCell className="font-bold">{Number(d.amount || 0).toLocaleString("en-US")} {d.currency || "EGP"}</TableCell>
                      <TableCell>{d.documentDate || "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{d.referenceNo || "—"}</TableCell>
                      <TableCell><Badge className="bg-emerald-600">{d.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
