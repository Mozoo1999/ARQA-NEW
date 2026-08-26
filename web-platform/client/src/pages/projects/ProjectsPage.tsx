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
import { BookOpen, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { z } from "zod";

const STATUS_LABELS: Record<string, string> = {
  planning: "تخطيط", active: "نشط", on_hold: "متوقف",
  completed: "مكتمل", cancelled: "ملغى",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "منخفض", medium: "متوسط", high: "عالي", critical: "حرج",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  planning: "secondary", active: "default", on_hold: "outline",
  completed: "default", cancelled: "destructive",
};

const schema = z.object({
  code: z.string().min(1, "كود المشروع مطلوب"),
  name: z.string().min(1, "اسم المشروع مطلوب"),
  description: z.string().optional(),
  status: z.enum(["planning", "active", "on_hold", "completed", "cancelled"]).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  budget: z.string().optional(),
  currency: z.string().optional(),
  objectives: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function ProjectsPage() {
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: projects, isLoading } = trpc.projects.list.useQuery(
    statusFilter !== "all" ? { status: statusFilter } : undefined
  );

  const create = trpc.projects.create.useMutation({
    onSuccess: (data) => {
      toast.success("تم إنشاء المشروع بنجاح");
      utils.projects.list.invalidate();
      utils.controlTower.stats.invalidate();
      setOpen(false);
      setLocation(`/projects/${data.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const update = trpc.projects.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث المشروع بنجاح");
      utils.projects.list.invalidate();
      setOpen(false);
      setEditing(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const del = trpc.projects.delete.useMutation({
    onSuccess: () => { toast.success("تم حذف المشروع"); utils.projects.list.invalidate(); utils.controlTower.stats.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: "", name: "", status: "planning", priority: "medium", currency: "SAR" },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({ code: "", name: "", status: "planning", priority: "medium", currency: "SAR" });
    setOpen(true);
  };

  const openEdit = (project: NonNullable<typeof projects>[0]) => {
    setEditing(project.id);
    form.reset({
      code: project.code ?? "",
      name: project.name ?? "",
      description: project.description ?? "",
      status: (project.status as FormValues["status"]) ?? "planning",
      priority: (project.priority as FormValues["priority"]) ?? "medium",
      budget: project.budget ?? "",
      currency: project.currency ?? "SAR",
      objectives: project.objectives ?? "",
    });
    setOpen(true);
  };

  const onSubmit = (values: FormValues) => {
    if (editing) {
      update.mutate({ id: editing, ...values });
    } else {
      create.mutate(values);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            المشاريع
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">إدارة مشاريع الشركة</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          مشروع جديد
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["all", "planning", "active", "on_hold", "completed", "cancelled"].map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(s)}
          >
            {s === "all" ? "الكل" : STATUS_LABELS[s]}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
      ) : !projects || projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-base font-medium">لا توجد مشاريع</p>
            <p className="text-sm text-muted-foreground mt-1">أضف أول مشروع للشركة</p>
            <Button onClick={openCreate} className="mt-4 gap-2" variant="outline">
              <Plus className="h-4 w-4" />
              إضافة مشروع
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الكود</TableHead>
                <TableHead>المشروع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الأولوية</TableHead>
                <TableHead>الميزانية</TableHead>
                <TableHead className="w-24">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id} className="cursor-pointer" onClick={() => setLocation(`/projects/${project.id}`)}>
                  <TableCell className="font-mono text-sm text-muted-foreground">{project.code}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{project.name}</p>
                      {project.description && <p className="text-xs text-muted-foreground truncate max-w-xs">{project.description}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[project.status ?? "planning"]}>
                      {STATUS_LABELS[project.status ?? "planning"]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{PRIORITY_LABELS[project.priority ?? "medium"]}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {project.budget ? `${project.budget} ${project.currency ?? "SAR"}` : "—"}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setLocation(`/projects/${project.id}`)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(project)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => { if (confirm("هل أنت متأكد من حذف هذا المشروع؟")) del.mutate({ id: project.id }); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Form Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل المشروع" : "مشروع جديد"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="code" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الكود *</FormLabel>
                    <FormControl><Input {...field} placeholder="PRJ-001" dir="ltr" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>اسم المشروع *</FormLabel>
                    <FormControl><Input {...field} placeholder="اسم المشروع" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الحالة</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {Object.entries(STATUS_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
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
                <FormField control={form.control} name="budget" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الميزانية</FormLabel>
                    <FormControl><Input {...field} type="number" placeholder="0" /></FormControl>
                    <FormMessage />
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
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>الوصف</FormLabel>
                    <FormControl><Textarea {...field} placeholder="وصف مختصر للمشروع..." rows={2} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="objectives" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>الأهداف</FormLabel>
                    <FormControl><Textarea {...field} placeholder="أهداف المشروع..." rows={2} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
                <Button type="submit" disabled={create.isPending || update.isPending}>
                  {create.isPending || update.isPending ? "جاري الحفظ..." : "حفظ"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
