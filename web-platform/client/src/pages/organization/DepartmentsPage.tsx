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
import { Network, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "اسم القسم مطلوب"),
  code: z.string().optional(),
  description: z.string().optional(),
  branchId: z.string().min(1, "الفرع مطلوب"),
});

type FormValues = z.infer<typeof schema>;

export default function DepartmentsPage() {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);

  const { data: branches } = trpc.branches.list.useQuery();
  const { data: departments, isLoading } = trpc.departments.list.useQuery();

  const create = trpc.departments.create.useMutation({
    onSuccess: () => { toast.success("تم إنشاء القسم بنجاح"); utils.departments.list.invalidate(); setOpen(false); },
    onError: (e) => toast.error(e.message),
  });

  const update = trpc.departments.update.useMutation({
    onSuccess: () => { toast.success("تم تحديث القسم بنجاح"); utils.departments.list.invalidate(); setOpen(false); setEditing(null); },
    onError: (e) => toast.error(e.message),
  });

  const del = trpc.departments.delete.useMutation({
    onSuccess: () => { toast.success("تم حذف القسم"); utils.departments.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", branchId: "" },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({ name: "", code: "", description: "", branchId: branches?.[0]?.id ? String(branches[0].id) : "" });
    setOpen(true);
  };

  const openEdit = (dept: NonNullable<typeof departments>[0]) => {
    setEditing(dept.id);
    form.reset({
      name: dept.name ?? "",
      code: dept.code ?? "",
      description: dept.description ?? "",
      branchId: dept.branchId ? String(dept.branchId) : "",
    });
    setOpen(true);
  };

  const onSubmit = (values: FormValues) => {
    const branchId = parseInt(values.branchId);
    if (editing) {
      update.mutate({ id: editing, name: values.name, code: values.code, description: values.description });
    } else {
      create.mutate({ branchId, name: values.name, code: values.code, description: values.description });
    }
  };

  const getBranchName = (branchId: number | null) => branches?.find(b => b.id === branchId)?.name ?? "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Network className="h-6 w-6 text-primary" />
            الأقسام
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">إدارة أقسام الشركة</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          قسم جديد
        </Button>
      </div>

      {isLoading ? (
        <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
      ) : !departments || departments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Network className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-base font-medium">لا توجد أقسام</p>
            <p className="text-sm text-muted-foreground mt-1">أضف أول قسم للشركة</p>
            <Button onClick={openCreate} className="mt-4 gap-2" variant="outline">
              <Plus className="h-4 w-4" />
              إضافة قسم
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>القسم</TableHead>
                <TableHead>الكود</TableHead>
                <TableHead>الفرع</TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="w-20">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell className="font-medium">{dept.name}</TableCell>
                  <TableCell className="text-muted-foreground">{dept.code ?? "—"}</TableCell>
                  <TableCell>{getBranchName(dept.branchId)}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">{dept.description ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={dept.isActive ? "default" : "secondary"}>
                      {dept.isActive ? "نشط" : "غير نشط"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(dept)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => { if (confirm("هل أنت متأكد من حذف هذا القسم؟")) del.mutate({ id: dept.id }); }}>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل القسم" : "قسم جديد"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم القسم *</FormLabel>
                  <FormControl><Input {...field} placeholder="قسم تقنية المعلومات" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="code" render={({ field }) => (
                <FormItem>
                  <FormLabel>الكود</FormLabel>
                  <FormControl><Input {...field} placeholder="IT" dir="ltr" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              {!editing && (
                <FormField control={form.control} name="branchId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الفرع *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="اختر الفرع" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {branches?.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>الوصف</FormLabel>
                  <FormControl><Textarea {...field} placeholder="وصف مختصر للقسم..." rows={3} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
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
