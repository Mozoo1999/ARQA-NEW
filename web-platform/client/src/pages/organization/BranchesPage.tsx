import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "@/lib/trpc";
import { GitBranch, MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "اسم الفرع مطلوب"),
  code: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  isHeadquarters: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function BranchesPage() {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);

  const { data: company } = trpc.company.get.useQuery();
  const { data: branches, isLoading } = trpc.branches.list.useQuery();

  const create = trpc.branches.create.useMutation({
    onSuccess: () => { toast.success("تم إنشاء الفرع بنجاح"); utils.branches.list.invalidate(); setOpen(false); },
    onError: (e) => toast.error(e.message),
  });

  const update = trpc.branches.update.useMutation({
    onSuccess: () => { toast.success("تم تحديث الفرع بنجاح"); utils.branches.list.invalidate(); setOpen(false); setEditing(null); },
    onError: (e) => toast.error(e.message),
  });

  const del = trpc.branches.delete.useMutation({
    onSuccess: () => { toast.success("تم حذف الفرع"); utils.branches.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", isHeadquarters: false },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({ name: "", code: "", city: "", address: "", phone: "", email: "", isHeadquarters: false });
    setOpen(true);
  };

  const openEdit = (branch: NonNullable<typeof branches>[0]) => {
    setEditing(branch.id);
    form.reset({
      name: branch.name ?? "",
      code: branch.code ?? "",
      city: branch.city ?? "",
      address: branch.address ?? "",
      phone: branch.phone ?? "",
      email: branch.email ?? "",
      isHeadquarters: branch.isHeadquarters ?? false,
    });
    setOpen(true);
  };

  const onSubmit = (values: FormValues) => {
    if (!company) { toast.error("يجب إنشاء ملف الشركة أولاً"); return; }
    if (editing) {
      update.mutate({ id: editing, ...values });
    } else {
      create.mutate({ companyId: company.id, ...values });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GitBranch className="h-6 w-6 text-primary" />
            الفروع
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">إدارة فروع الشركة</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          فرع جديد
        </Button>
      </div>

      {isLoading ? (
        <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
      ) : !branches || branches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <GitBranch className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-base font-medium">لا توجد فروع</p>
            <p className="text-sm text-muted-foreground mt-1">أضف أول فرع للشركة</p>
            <Button onClick={openCreate} className="mt-4 gap-2" variant="outline">
              <Plus className="h-4 w-4" />
              إضافة فرع
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الفرع</TableHead>
                <TableHead>الكود</TableHead>
                <TableHead>المدينة</TableHead>
                <TableHead>الهاتف</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="w-20">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {branch.name}
                      {branch.isHeadquarters && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{branch.code ?? "—"}</TableCell>
                  <TableCell>
                    {branch.city ? (
                      <span className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        {branch.city}
                      </span>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground" dir="ltr">{branch.phone ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={branch.isActive ? "default" : "secondary"}>
                      {branch.isActive ? "نشط" : "غير نشط"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(branch)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => { if (confirm("هل أنت متأكد من حذف هذا الفرع؟")) del.mutate({ id: branch.id }); }}>
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
            <DialogTitle>{editing ? "تعديل الفرع" : "فرع جديد"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>اسم الفرع *</FormLabel>
                    <FormControl><Input {...field} placeholder="الفرع الرئيسي" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="code" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الكود</FormLabel>
                    <FormControl><Input {...field} placeholder="HQ" dir="ltr" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem>
                    <FormLabel>المدينة</FormLabel>
                    <FormControl><Input {...field} placeholder="الرياض" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الهاتف</FormLabel>
                    <FormControl><Input {...field} placeholder="+966..." dir="ltr" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني</FormLabel>
                    <FormControl><Input {...field} type="email" placeholder="branch@..." dir="ltr" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>العنوان</FormLabel>
                    <FormControl><Input {...field} placeholder="العنوان التفصيلي" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="isHeadquarters" render={({ field }) => (
                  <FormItem className="col-span-2 flex items-center gap-3">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">المقر الرئيسي</FormLabel>
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
