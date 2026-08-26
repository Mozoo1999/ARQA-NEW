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
import { BookOpen, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const STATUS_LABELS: Record<string, string> = {
  proposed: "مقترح", under_review: "قيد المراجعة", approved: "معتمد",
  deprecated: "مهجور", superseded: "مُستبدَل",
};
const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  proposed: "secondary", under_review: "outline", approved: "default",
  deprecated: "destructive", superseded: "destructive",
};
const CATEGORY_LABELS: Record<string, string> = {
  technology: "التقنية", process: "العمليات", data: "البيانات",
  security: "الأمن", integration: "التكامل", governance: "الحوكمة", infrastructure: "البنية التحتية",
};

const schema = z.object({
  title: z.string().min(1, "عنوان القرار مطلوب"),
  category: z.enum(["technology", "process", "data", "security", "integration", "governance", "infrastructure"]),
  problemStatement: z.string().optional(),
  decisionStatement: z.string().optional(),
  rationale: z.string().optional(),
  alternatives: z.string().optional(),
  implications: z.string().optional(),
  constraints: z.string().optional(),
  neafRevision: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function DecisionDetailPanel({ decisionId, onClose }: { decisionId: number; onClose: () => void }) {
  const utils = trpc.useUtils();
  const { data: dec, isLoading } = trpc.governance.decisions.getById.useQuery({ id: decisionId });
  const [editStatus, setEditStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  const update = trpc.governance.decisions.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث حالة القرار");
      utils.governance.decisions.list.invalidate();
      utils.governance.decisions.getById.invalidate({ id: decisionId });
      utils.controlTower.stats.invalidate();
      setEditStatus(false);
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <div className="p-4"><Skeleton className="h-32 w-full" /></div>;
  if (!dec) return null;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-mono text-muted-foreground mb-1">{dec.decisionId}</p>
            <CardTitle className="text-base">{dec.title}</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>إغلاق</Button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline">{CATEGORY_LABELS[dec.category ?? ""] ?? dec.category}</Badge>
          <Badge variant={STATUS_VARIANTS[dec.status ?? "proposed"]}>{STATUS_LABELS[dec.status ?? "proposed"]}</Badge>
          {dec.neafRevision && <Badge variant="outline" className="font-mono">NEAF {dec.neafRevision}</Badge>}
          <Button variant="outline" size="sm" className="mr-auto" onClick={() => { setNewStatus(dec.status ?? "proposed"); setEditStatus(true); }}>
            تغيير الحالة
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {dec.problemStatement && (
          <div><p className="font-semibold text-muted-foreground mb-1">بيان المشكلة</p><p>{dec.problemStatement}</p></div>
        )}
        {dec.decisionStatement && (
          <><Separator /><div><p className="font-semibold text-muted-foreground mb-1">بيان القرار</p><p>{dec.decisionStatement}</p></div></>
        )}
        {dec.rationale && (
          <><Separator /><div><p className="font-semibold text-muted-foreground mb-1">المبرر</p><p>{dec.rationale}</p></div></>
        )}
        {dec.alternatives && (
          <><Separator /><div><p className="font-semibold text-muted-foreground mb-1">البدائل المدروسة</p><p>{dec.alternatives}</p></div></>
        )}
        {dec.implications && (
          <><Separator /><div><p className="font-semibold text-muted-foreground mb-1">الانعكاسات</p><p>{dec.implications}</p></div></>
        )}
        {dec.constraints && (
          <><Separator /><div><p className="font-semibold text-muted-foreground mb-1">القيود</p><p>{dec.constraints}</p></div></>
        )}
        <Separator />
        <p className="text-xs text-muted-foreground">أُنشئ في: {new Date(dec.createdAt).toLocaleDateString("ar-SA")}</p>
      </CardContent>

      {/* Status Change Dialog */}
      <Dialog open={editStatus} onOpenChange={setEditStatus}>
        <DialogContent>
          <DialogHeader><DialogTitle>تغيير حالة القرار</DialogTitle></DialogHeader>
          <Select value={newStatus} onValueChange={setNewStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditStatus(false)}>إلغاء</Button>
            <Button
              onClick={() => update.mutate({ id: decisionId, status: newStatus as Parameters<typeof update.mutate>[0]["status"] })}
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

export default function ArchitectureDecisionsPage() {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: decisions, isLoading } = trpc.governance.decisions.list.useQuery(
    categoryFilter !== "all" ? { category: categoryFilter } : undefined
  );

  const create = trpc.governance.decisions.create.useMutation({
    onSuccess: (data) => {
      toast.success(`تم إنشاء القرار ${data.decisionId} بنجاح`);
      utils.governance.decisions.list.invalidate();
      utils.controlTower.stats.invalidate();
      form.reset({ title: "", category: "technology" });
      setOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", category: "technology" },
  });

  const onSubmit = (values: FormValues) => create.mutate(values);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            قرارات المعمارية
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Architecture Decision Records (ADR) — NEAF</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          قرار جديد
        </Button>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button variant={categoryFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setCategoryFilter("all")}>الكل</Button>
        {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
          <Button key={k} variant={categoryFilter === k ? "default" : "outline"} size="sm" onClick={() => setCategoryFilter(k)}>{v}</Button>
        ))}
      </div>

      {isLoading ? (
        <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
      ) : !decisions || decisions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-base font-medium">لا توجد قرارات معمارية</p>
            <p className="text-sm text-muted-foreground mt-1">أنشئ أول قرار معماري (ADR)</p>
            <Button onClick={() => setOpen(true)} className="mt-4 gap-2" variant="outline">
              <Plus className="h-4 w-4" />
              قرار جديد
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
                  <TableHead>الفئة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {decisions.map((dec) => (
                  <TableRow
                    key={dec.id}
                    className="cursor-pointer"
                    onClick={() => setExpandedId(expandedId === dec.id ? null : dec.id)}
                  >
                    <TableCell>
                      {expandedId === dec.id
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{dec.decisionId}</TableCell>
                    <TableCell className="font-medium">{dec.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{CATEGORY_LABELS[dec.category ?? ""] ?? dec.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[dec.status ?? "proposed"]}>
                        {STATUS_LABELS[dec.status ?? "proposed"]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(dec.createdAt).toLocaleDateString("ar-SA")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {expandedId !== null && (
            <DecisionDetailPanel decisionId={expandedId} onClose={() => setExpandedId(null)} />
          )}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>قرار معماري جديد (ADR)</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>عنوان القرار *</FormLabel>
                    <FormControl><Input {...field} placeholder="عنوان القرار المعماري" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الفئة *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {Object.entries(CATEGORY_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="neafRevision" render={({ field }) => (
                  <FormItem>
                    <FormLabel>مراجعة NEAF</FormLabel>
                    <FormControl><Input {...field} placeholder="v1.0" dir="ltr" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="problemStatement" render={({ field }) => (
                <FormItem>
                  <FormLabel>بيان المشكلة</FormLabel>
                  <FormControl><Textarea {...field} placeholder="ما المشكلة التي يعالجها هذا القرار؟" rows={2} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="decisionStatement" render={({ field }) => (
                <FormItem>
                  <FormLabel>بيان القرار</FormLabel>
                  <FormControl><Textarea {...field} placeholder="ما القرار الذي تم اتخاذه؟" rows={2} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="rationale" render={({ field }) => (
                <FormItem>
                  <FormLabel>المبرر</FormLabel>
                  <FormControl><Textarea {...field} placeholder="لماذا تم اتخاذ هذا القرار؟" rows={2} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="alternatives" render={({ field }) => (
                <FormItem>
                  <FormLabel>البدائل المدروسة</FormLabel>
                  <FormControl><Textarea {...field} placeholder="ما البدائل التي تم دراستها؟" rows={2} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="implications" render={({ field }) => (
                <FormItem>
                  <FormLabel>الانعكاسات</FormLabel>
                  <FormControl><Textarea {...field} placeholder="ما الانعكاسات المتوقعة لهذا القرار؟" rows={2} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? "جاري الإنشاء..." : "إنشاء القرار"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
