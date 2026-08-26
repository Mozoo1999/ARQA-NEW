import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "@/lib/trpc";
import { Eye, Minus, Plus, ShoppingCart } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { z } from "zod";

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

const itemSchema = z.object({
  itemName: z.string().min(1, "اسم البند مطلوب"),
  description: z.string().optional(),
  quantity: z.string().min(1, "الكمية مطلوبة"),
  unit: z.string().optional(),
  estimatedUnitPrice: z.string().optional(),
  notes: z.string().optional(),
});

const schema = z.object({
  title: z.string().min(1, "عنوان الطلب مطلوب"),
  description: z.string().optional(),
  projectId: z.string().optional(),
  departmentId: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  currency: z.string().optional(),
  justification: z.string().optional(),
  items: z.array(itemSchema).min(1, "يجب إضافة بند واحد على الأقل"),
});

type FormValues = z.infer<typeof schema>;

export default function PurchaseRequestsPage() {
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();

  const { data: projects } = trpc.projects.list.useQuery();
  const { data: departments } = trpc.departments.list.useQuery();
  const { data: requests, isLoading } = trpc.purchaseRequests.list.useQuery();

  const create = trpc.purchaseRequests.create.useMutation({
    onSuccess: (data) => {
      toast.success("تم إنشاء طلب الشراء بنجاح");
      utils.purchaseRequests.list.invalidate();
      utils.controlTower.stats.invalidate();
      setLocation(`/procurement/requests/${data.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "", priority: "medium", currency: "SAR",
      items: [{ itemName: "", quantity: "1", unit: "قطعة" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });

  const onSubmit = (values: FormValues) => {
    const projectId = values.projectId ? parseInt(values.projectId) : undefined;
    const departmentId = values.departmentId ? parseInt(values.departmentId) : undefined;
    create.mutate({ ...values, projectId, departmentId });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" />
            طلبات الشراء
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">إدارة طلبات الشراء والمشتريات</p>
        </div>
        <Button onClick={() => setLocation("/procurement/requests/new")} className="gap-2">
          <Plus className="h-4 w-4" />
          طلب جديد
        </Button>
      </div>

      {isLoading ? (
        <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
      ) : !requests || requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingCart className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-base font-medium">لا توجد طلبات شراء</p>
            <p className="text-sm text-muted-foreground mt-1">أنشئ أول طلب شراء</p>
            <Button onClick={() => setLocation("/procurement/requests/new")} className="mt-4 gap-2" variant="outline">
              <Plus className="h-4 w-4" />
              طلب جديد
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الرقم</TableHead>
                <TableHead>العنوان</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الأولوية</TableHead>
                <TableHead>المشروع</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead className="w-16">عرض</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req.id} className="cursor-pointer" onClick={() => setLocation(`/procurement/requests/${req.id}`)}>
                  <TableCell className="font-mono text-sm text-muted-foreground">{req.requestNumber}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{req.title}</p>
                      {req.description && <p className="text-xs text-muted-foreground truncate max-w-xs">{req.description}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[req.status ?? "draft"]}>
                      {STATUS_LABELS[req.status ?? "draft"]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{PRIORITY_LABELS[req.priority ?? "medium"]}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {req.projectId ? projects?.find(p => p.id === req.projectId)?.name ?? "—" : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(req.createdAt).toLocaleDateString("ar-SA")}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setLocation(`/procurement/requests/${req.id}`)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW PURCHASE REQUEST PAGE (separate route)
// ─────────────────────────────────────────────────────────────────────────────

export function NewPurchaseRequestPage() {
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();

  const { data: projects } = trpc.projects.list.useQuery();
  const { data: departments } = trpc.departments.list.useQuery();

  const create = trpc.purchaseRequests.create.useMutation({
    onSuccess: (data) => {
      toast.success("تم إنشاء طلب الشراء بنجاح");
      utils.purchaseRequests.list.invalidate();
      utils.controlTower.stats.invalidate();
      setLocation(`/procurement/requests/${data.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "", priority: "medium", currency: "SAR",
      items: [{ itemName: "", quantity: "1", unit: "قطعة" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });

  const onSubmit = (values: FormValues) => {
    const projectId = values.projectId ? parseInt(values.projectId) : undefined;
    const departmentId = values.departmentId ? parseInt(values.departmentId) : undefined;
    create.mutate({ ...values, projectId, departmentId });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <button onClick={() => setLocation("/procurement/requests")} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
          ← طلبات الشراء
        </button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingCart className="h-6 w-6 text-primary" />
          طلب شراء جديد
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold">معلومات الطلب</h3>
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>عنوان الطلب *</FormLabel>
                  <FormControl><Input {...field} placeholder="عنوان طلب الشراء" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="priority" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الأولوية</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {Object.entries(PRIORITY_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="currency" render={({ field }) => (
                  <FormItem>
                    <FormLabel>العملة</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                        <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                        <SelectItem value="EUR">يورو (EUR)</SelectItem>
                        <SelectItem value="AED">درهم إماراتي (AED)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="projectId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>المشروع</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="اختر المشروع" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {projects?.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="departmentId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>القسم</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="اختر القسم" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {departments?.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>الوصف</FormLabel>
                  <FormControl><Textarea {...field} placeholder="وصف مختصر للطلب..." rows={2} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="justification" render={({ field }) => (
                <FormItem>
                  <FormLabel>المبرر</FormLabel>
                  <FormControl><Textarea {...field} placeholder="مبرر طلب الشراء..." rows={2} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">بنود الطلب</h3>
                <Button type="button" variant="outline" size="sm" className="gap-1"
                  onClick={() => append({ itemName: "", quantity: "1", unit: "قطعة" })}>
                  <Plus className="h-3.5 w-3.5" />
                  إضافة بند
                </Button>
              </div>
              {fields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4 space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">بند {index + 1}</span>
                    {fields.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => remove(index)}>
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name={`items.${index}.itemName`} render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>اسم البند *</FormLabel>
                        <FormControl><Input {...field} placeholder="اسم المنتج أو الخدمة" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => (
                      <FormItem>
                        <FormLabel>الكمية *</FormLabel>
                        <FormControl><Input {...field} type="number" placeholder="1" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name={`items.${index}.unit`} render={({ field }) => (
                      <FormItem>
                        <FormLabel>الوحدة</FormLabel>
                        <FormControl><Input {...field} placeholder="قطعة، كيلو، متر..." /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name={`items.${index}.estimatedUnitPrice`} render={({ field }) => (
                      <FormItem>
                        <FormLabel>السعر التقديري للوحدة</FormLabel>
                        <FormControl><Input {...field} type="number" placeholder="0.00" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name={`items.${index}.description`} render={({ field }) => (
                      <FormItem>
                        <FormLabel>الوصف</FormLabel>
                        <FormControl><Input {...field} placeholder="وصف إضافي..." /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setLocation("/procurement/requests")}>
              إلغاء
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "جاري الإنشاء..." : "إنشاء الطلب"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
