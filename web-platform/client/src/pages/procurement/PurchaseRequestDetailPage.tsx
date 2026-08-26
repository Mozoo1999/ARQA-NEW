import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ArrowRight, CheckCircle, Send, ShoppingCart, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation, useParams } from "wouter";

const STATUS_LABELS: Record<string, string> = {
  draft: "مسودة", submitted: "مقدم", under_review: "قيد المراجعة",
  approved: "معتمد", rejected: "مرفوض", cancelled: "ملغى", completed: "مكتمل",
};
const PRIORITY_LABELS: Record<string, string> = {
  low: "منخفض", medium: "متوسط", high: "عالي", urgent: "عاجل",
};
const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "secondary", submitted: "outline", under_review: "outline",
  approved: "default", rejected: "destructive", cancelled: "destructive", completed: "default",
};

export default function PurchaseRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const requestId = parseInt(params.id ?? "0");

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">("approve");
  const [reviewNotes, setReviewNotes] = useState("");

  const utils = trpc.useUtils();
  const { data: request, isLoading } = trpc.purchaseRequests.getById.useQuery({ id: requestId }, { enabled: !!requestId });

  const submit = trpc.purchaseRequests.submit.useMutation({
    onSuccess: () => { toast.success("تم تقديم الطلب للمراجعة"); utils.purchaseRequests.getById.invalidate({ id: requestId }); utils.controlTower.stats.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const review = trpc.purchaseRequests.review.useMutation({
    onSuccess: () => {
      toast.success(reviewAction === "approve" ? "تم اعتماد الطلب" : "تم رفض الطلب");
      utils.purchaseRequests.getById.invalidate({ id: requestId });
      utils.controlTower.stats.invalidate();
      setReviewOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const cancel = trpc.purchaseRequests.cancel.useMutation({
    onSuccess: () => { toast.success("تم إلغاء الطلب"); utils.purchaseRequests.getById.invalidate({ id: requestId }); },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-48 w-full" />
    </div>
  );

  if (!request) return (
    <div className="flex flex-col items-center justify-center py-16">
      <p className="text-muted-foreground">الطلب غير موجود</p>
      <Button variant="link" onClick={() => setLocation("/procurement/requests")}>العودة</Button>
    </div>
  );

  const isOwner = request.requesterId === user?.id;
  const isManager = user?.role === "admin" || user?.role === "manager";
  const canSubmit = isOwner && request.status === "draft";
  const canReview = isManager && (request.status === "submitted" || request.status === "under_review");
  const canCancel = isOwner && ["draft", "submitted"].includes(request.status ?? "");

  const totalEstimated = request.items?.reduce((sum, item) => {
    return sum + (parseFloat(item.estimatedTotalPrice ?? "0") || 0);
  }, 0) ?? 0;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <button onClick={() => setLocation("/procurement/requests")} className="hover:text-foreground flex items-center gap-1">
              <ArrowRight className="h-3.5 w-3.5" />
              طلبات الشراء
            </button>
            <span>/</span>
            <span>{request.requestNumber}</span>
          </div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" />
            {request.title}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={STATUS_VARIANTS[request.status ?? "draft"]}>
              {STATUS_LABELS[request.status ?? "draft"]}
            </Badge>
            <Badge variant="outline">{PRIORITY_LABELS[request.priority ?? "medium"]}</Badge>
            <span className="text-sm text-muted-foreground font-mono">{request.requestNumber}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {canSubmit && (
            <Button onClick={() => submit.mutate({ id: requestId })} disabled={submit.isPending} className="gap-2">
              <Send className="h-4 w-4" />
              {submit.isPending ? "جاري التقديم..." : "تقديم للمراجعة"}
            </Button>
          )}
          {canReview && (
            <>
              <Button variant="outline" className="gap-2 text-destructive border-destructive hover:bg-destructive/10"
                onClick={() => { setReviewAction("reject"); setReviewNotes(""); setReviewOpen(true); }}>
                <XCircle className="h-4 w-4" />
                رفض
              </Button>
              <Button className="gap-2"
                onClick={() => { setReviewAction("approve"); setReviewNotes(""); setReviewOpen(true); }}>
                <CheckCircle className="h-4 w-4" />
                اعتماد
              </Button>
            </>
          )}
          {canCancel && (
            <Button variant="outline" onClick={() => { if (confirm("هل أنت متأكد من إلغاء الطلب؟")) cancel.mutate({ id: requestId }); }}>
              إلغاء الطلب
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          {request.description && (
            <Card>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground mb-1">الوصف</p>
                <p className="text-sm">{request.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Items */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">بنود الطلب</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>البند</TableHead>
                    <TableHead>الكمية</TableHead>
                    <TableHead>الوحدة</TableHead>
                    <TableHead>السعر التقديري</TableHead>
                    <TableHead>الإجمالي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {request.items?.map((item, i) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell>
                        <p className="font-medium">{item.itemName}</p>
                        {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell className="text-muted-foreground">{item.unit ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.estimatedUnitPrice ? `${parseFloat(item.estimatedUnitPrice).toLocaleString()} ${request.currency ?? "SAR"}` : "—"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.estimatedTotalPrice ? `${parseFloat(item.estimatedTotalPrice).toLocaleString()} ${request.currency ?? "SAR"}` : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {totalEstimated > 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-left font-semibold">الإجمالي التقديري</TableCell>
                      <TableCell className="font-bold text-primary">
                        {totalEstimated.toLocaleString()} {request.currency ?? "SAR"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Review Notes */}
          {request.reviewNotes && (
            <Card>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground mb-1">ملاحظات المراجعة</p>
                <p className="text-sm">{request.reviewNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">تاريخ الإنشاء</p>
                <p className="text-sm font-medium">{new Date(request.createdAt).toLocaleDateString("ar-SA")}</p>
              </div>
              {request.submittedAt && (
                <div>
                  <p className="text-xs text-muted-foreground">تاريخ التقديم</p>
                  <p className="text-sm font-medium">{new Date(request.submittedAt).toLocaleDateString("ar-SA")}</p>
                </div>
              )}
              {request.reviewedAt && (
                <div>
                  <p className="text-xs text-muted-foreground">تاريخ المراجعة</p>
                  <p className="text-sm font-medium">{new Date(request.reviewedAt).toLocaleDateString("ar-SA")}</p>
                </div>
              )}
              {request.requiredByDate && (
                <div>
                  <p className="text-xs text-muted-foreground">التاريخ المطلوب</p>
                  <p className="text-sm font-medium">{new Date(request.requiredByDate).toLocaleDateString("ar-SA")}</p>
                </div>
              )}
              {totalEstimated > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">الإجمالي التقديري</p>
                  <p className="text-sm font-bold text-primary">{totalEstimated.toLocaleString()} {request.currency ?? "SAR"}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{reviewAction === "approve" ? "اعتماد الطلب" : "رفض الطلب"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {reviewAction === "approve"
                ? "هل أنت متأكد من اعتماد هذا الطلب؟"
                : "هل أنت متأكد من رفض هذا الطلب؟"}
            </p>
            <div>
              <label className="text-sm font-medium">ملاحظات (اختياري)</label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="أضف ملاحظاتك هنا..."
                rows={3}
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewOpen(false)}>إلغاء</Button>
            <Button
              variant={reviewAction === "approve" ? "default" : "destructive"}
              onClick={() => review.mutate({ id: requestId, action: reviewAction, notes: reviewNotes || undefined })}
              disabled={review.isPending}
            >
              {review.isPending ? "جاري المعالجة..." : reviewAction === "approve" ? "اعتماد" : "رفض"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
