import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "@/lib/trpc";
import { ChevronDown, ChevronUp, Plus, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const STATUS_LABELS: Record<string, string> = {
  scheduled: "مجدول", in_progress: "جاري", completed: "مكتمل", cancelled: "ملغى",
};
const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  scheduled: "outline", in_progress: "outline", completed: "default", cancelled: "destructive",
};
const OUTCOME_LABELS: Record<string, string> = {
  pass: "ناجح", conditional_pass: "ناجح مشروط", fail: "فاشل", deferred: "مؤجل",
};
const REVIEW_TYPE_LABELS: Record<string, string> = {
  architecture_alignment: "مواءمة المعمارية",
  design_review: "مراجعة التصميم",
  implementation_review: "مراجعة التنفيذ",
  compliance_review: "مراجعة الامتثال",
  post_implementation: "ما بعد التنفيذ",
};

const schema = z.object({
  title: z.string().min(1, "عنوان المراجعة مطلوب"),
  reviewType: z.enum(["architecture_alignment", "design_review", "implementation_review", "compliance_review", "post_implementation"]),
  description: z.string().optional(),
  scope: z.string().optional(),
  neafVersion: z.string().optional(),
  scheduledDate: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function ReviewDetailPanel({ reviewId, onClose }: { reviewId: number; onClose: () => void }) {
  const utils = trpc.useUtils();
  const { data: review, isLoading } = trpc.governance.reviews.getById.useQuery({ id: reviewId });
  const [editStatus, setEditStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [newOutcome, setNewOutcome] = useState<string>("");
  const [findings, setFindings] = useState("");
  const [recommendations, setRecommendations] = useState("");

  const update = trpc.governance.reviews.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث المراجعة");
      utils.governance.reviews.list.invalidate();
      utils.governance.reviews.getById.invalidate({ id: reviewId });
      utils.controlTower.stats.invalidate();
      setEditStatus(false);
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <div className="p-4"><Skeleton className="h-32 w-full" /></div>;
  if (!review) return null;

  const openEdit = () => {
    setNewStatus(review.status ?? "scheduled");
    setNewOutcome(review.outcome ?? "");
    setFindings(review.findings ?? "");
    setRecommendations(review.recommendations ?? "");
    setEditStatus(true);
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-mono text-muted-foreground mb-1">{review.reviewId}</p>
            <CardTitle className="text-base">{review.title}</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>إغلاق</Button>
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge variant="outline">{REVIEW_TYPE_LABELS[review.reviewType ?? ""] ?? review.reviewType}</Badge>
          <Badge variant={STATUS_VARIANTS[review.status ?? "scheduled"]}>{STATUS_LABELS[review.status ?? "scheduled"]}</Badge>
          {review.outcome && <Badge variant="outline">{OUTCOME_LABELS[review.outcome] ?? review.outcome}</Badge>}
          {review.neafVersion && <Badge variant="outline" className="font-mono">NEAF {review.neafVersion}</Badge>}
          <Button variant="outline" size="sm" className="mr-auto" onClick={openEdit}>
            تحديث المراجعة
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {review.scope && (
          <div><p className="font-semibold text-muted-foreground mb-1">النطاق</p><p>{review.scope}</p></div>
        )}
        {review.description && (
          <><Separator /><div><p className="font-semibold text-muted-foreground mb-1">الوصف</p><p>{review.description}</p></div></>
        )}
        {review.findings && (
          <><Separator /><div><p className="font-semibold text-muted-foreground mb-1">النتائج</p><p>{review.findings}</p></div></>
        )}
        {review.recommendations && (
          <><Separator /><div><p className="font-semibold text-muted-foreground mb-1">التوصيات</p><p>{review.recommendations}</p></div></>
        )}
        <Separator />
        <div className="flex gap-4 text-xs text-muted-foreground">
          {review.scheduledDate && <span>مجدول: {new Date(review.scheduledDate).toLocaleDateString("ar-SA")}</span>}
          {review.completedDate && <span>مكتمل: {new Date(review.completedDate).toLocaleDateString("ar-SA")}</span>}
          <span>أُنشئ: {new Date(review.createdAt).toLocaleDateString("ar-SA")}</span>
        </div>
      </CardContent>

      {/* Update Dialog */}
      <Dialog open={editStatus} onOpenChange={setEditStatus}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>تحديث المراجعة</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">الحالة</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">النتيجة</label>
              <Select value={newOutcome} onValueChange={setNewOutcome}>
                <SelectTrigger><SelectValue placeholder="اختر النتيجة (اختياري)" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(OUTCOME_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">النتائج</label>
              <Textarea value={findings} onChange={(e) => setFindings(e.target.value)} rows={2} placeholder="نتائج المراجعة..." />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">التوصيات</label>
              <Textarea value={recommendations} onChange={(e) => setRecommendations(e.target.value)} rows={2} placeholder="توصيات المراجعة..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditStatus(false)}>إلغاء</Button>
            <Button
              onClick={() => update.mutate({
                id: reviewId,
                status: newStatus as Parameters<typeof update.mutate>[0]["status"],
                outcome: newOutcome ? newOutcome as Parameters<typeof update.mutate>[0]["outcome"] : null,
                findings: findings || undefined,
                recommendations: recommendations || undefined,
                completedDate: newStatus === "completed" ? new Date() : null,
              })}
              disabled={update.isPending}
            >
              {update.isPending ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default function ArchitectureReviewsPage() {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: reviews, isLoading } = trpc.governance.reviews.list.useQuery();

  const create = trpc.governance.reviews.create.useMutation({
    onSuccess: (data) => {
      toast.success(`تم إنشاء المراجعة ${data.reviewId} بنجاح`);
      utils.governance.reviews.list.invalidate();
      utils.controlTower.stats.invalidate();
      form.reset({ title: "", reviewType: "architecture_alignment" });
      setOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", reviewType: "architecture_alignment" },
  });

  const onSubmit = (values: FormValues) => {
    const scheduledDate = values.scheduledDate ? new Date(values.scheduledDate) : undefined;
    create.mutate({ ...values, scheduledDate });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            مراجعات المعمارية
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Architecture Reviews — NEAF Governance</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          مراجعة جديدة
        </Button>
      </div>

      {isLoading ? (
        <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
      ) : !reviews || reviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ShieldCheck className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-base font-medium">لا توجد مراجعات معمارية</p>
            <p className="text-sm text-muted-foreground mt-1">أنشئ أول مراجعة معمارية وفق NEAF</p>
            <Button onClick={() => setOpen(true)} className="mt-4 gap-2" variant="outline">
              <Plus className="h-4 w-4" />
              مراجعة جديدة
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>المعرّف</TableHead>
                  <TableHead>العنوان</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>التاريخ المجدول</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow
                    key={review.id}
                    className="cursor-pointer"
                    onClick={() => setExpandedId(expandedId === review.id ? null : review.id)}
                  >
                    <TableCell>
                      {expandedId === review.id
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{review.reviewId}</TableCell>
                    <TableCell className="font-medium">{review.title}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {REVIEW_TYPE_LABELS[review.reviewType ?? ""] ?? review.reviewType}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[review.status ?? "scheduled"]}>
                        {STATUS_LABELS[review.status ?? "scheduled"]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {review.scheduledDate ? new Date(review.scheduledDate).toLocaleDateString("ar-SA") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {expandedId !== null && (
            <ReviewDetailPanel reviewId={expandedId} onClose={() => setExpandedId(null)} />
          )}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>مراجعة معمارية جديدة</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>عنوان المراجعة *</FormLabel>
                  <FormControl><Input {...field} placeholder="عنوان المراجعة المعمارية" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="reviewType" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>نوع المراجعة *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {Object.entries(REVIEW_TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="neafVersion" render={({ field }) => (
                  <FormItem>
                    <FormLabel>إصدار NEAF</FormLabel>
                    <FormControl><Input {...field} placeholder="v1.0" dir="ltr" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="scheduledDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>التاريخ المجدول</FormLabel>
                    <FormControl><Input {...field} type="date" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="scope" render={({ field }) => (
                <FormItem>
                  <FormLabel>النطاق</FormLabel>
                  <FormControl><Textarea {...field} placeholder="نطاق المراجعة..." rows={2} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>الوصف</FormLabel>
                  <FormControl><Textarea {...field} placeholder="وصف المراجعة..." rows={2} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? "جاري الإنشاء..." : "إنشاء"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
