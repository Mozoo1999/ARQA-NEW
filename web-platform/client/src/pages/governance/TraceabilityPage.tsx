import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "@/lib/trpc";
import { GitMerge, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const LINK_TYPE_LABELS: Record<string, string> = {
  originated_from: "نشأ من",
  validated_by: "تم التحقق منه بواسطة",
  superseded_by: "استُبدل بواسطة",
  related_to: "مرتبط بـ",
};

const schema = z.object({
  decisionId: z.string().min(1, "القرار المعماري مطلوب"),
  reviewId: z.string().min(1, "مراجعة المعمارية مطلوبة"),
  linkType: z.enum(["originated_from", "validated_by", "superseded_by", "related_to"]),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function TraceabilityPage() {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);

  const { data: links, isLoading } = trpc.governance.traceability.list.useQuery();
  const { data: decisions } = trpc.governance.decisions.list.useQuery();
  const { data: reviews } = trpc.governance.reviews.list.useQuery();

  const create = trpc.governance.traceability.create.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء الرابط بنجاح");
      utils.governance.traceability.list.invalidate();
      setOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteLink = trpc.governance.traceability.delete.useMutation({
    onSuccess: () => { toast.success("تم حذف الرابط"); utils.governance.traceability.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { linkType: "related_to" },
  });

  const onSubmit = (values: FormValues) => {
    create.mutate({
      decisionId: parseInt(values.decisionId),
      reviewId: parseInt(values.reviewId),
      linkType: values.linkType,
      notes: values.notes,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GitMerge className="h-6 w-6 text-primary" />
            مصفوفة التتبع
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Traceability Matrix — ربط القرارات بالمراجعات المعمارية</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة رابط
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">إجمالي الروابط</p>
            <p className="text-2xl font-bold mt-1">{links?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">القرارات المرتبطة</p>
            <p className="text-2xl font-bold mt-1">{new Set(links?.map(l => l.decisionId)).size ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">المراجعات المرتبطة</p>
            <p className="text-2xl font-bold mt-1">{new Set(links?.map(l => l.reviewId)).size ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
      ) : !links || links.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <GitMerge className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-base font-medium">لا توجد روابط تتبع</p>
            <p className="text-sm text-muted-foreground mt-1">اربط القرارات المعمارية بمراجعات المعمارية</p>
            <Button onClick={() => setOpen(true)} className="mt-4 gap-2" variant="outline">
              <Plus className="h-4 w-4" />
              إضافة رابط
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">روابط التتبع</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>القرار المعماري</TableHead>
                <TableHead>نوع الرابط</TableHead>
                <TableHead>مراجعة المعمارية</TableHead>
                <TableHead>ملاحظات</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead className="w-16">حذف</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.map((link) => {
                const decision = decisions?.find(d => d.id === link.decisionId);
                const review = reviews?.find(r => r.id === link.reviewId);
                return (
                  <TableRow key={link.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{decision?.title ?? `#${link.decisionId}`}</p>
                        <p className="text-xs text-muted-foreground font-mono">{decision?.decisionId}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{LINK_TYPE_LABELS[link.linkType ?? "related_to"]}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{review?.title ?? `#${link.reviewId}`}</p>
                        <p className="text-xs text-muted-foreground font-mono">{review?.reviewId}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                      {link.notes ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(link.createdAt).toLocaleDateString("ar-SA")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => { if (confirm("حذف هذا الرابط؟")) deleteLink.mutate({ id: link.id }); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة رابط تتبع</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="decisionId" render={({ field }) => (
                <FormItem>
                  <FormLabel>القرار المعماري *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="اختر القرار" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {decisions?.map(d => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          <span className="font-mono text-xs text-muted-foreground me-2">{d.decisionId}</span>
                          {d.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="linkType" render={({ field }) => (
                <FormItem>
                  <FormLabel>نوع الرابط *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {Object.entries(LINK_TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="reviewId" render={({ field }) => (
                <FormItem>
                  <FormLabel>مراجعة المعمارية *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="اختر المراجعة" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {reviews?.map(r => (
                        <SelectItem key={r.id} value={String(r.id)}>
                          <span className="font-mono text-xs text-muted-foreground me-2">{r.reviewId}</span>
                          {r.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات</FormLabel>
                  <FormControl><Textarea {...field} placeholder="ملاحظات إضافية..." rows={2} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? "جاري الإضافة..." : "إضافة الرابط"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
