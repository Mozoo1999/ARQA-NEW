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
import { Eye, Pencil, Plus, Settings2, Star, Trash2, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { z } from "zod";

const STATUS_LABELS: Record<string, string> = { active: "نشط", inactive: "غير نشط", blacklisted: "محظور" };
const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive"> = {
  active: "default", inactive: "secondary", blacklisted: "destructive",
};

const schema = z.object({
  code: z.string().min(1, "كود المورد مطلوب"),
  name: z.string().min(1, "اسم المورد مطلوب"),
  nameEn: z.string().optional(),
  categoryId: z.string().optional(),
  registrationNumber: z.string().optional(),
  taxNumber: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  rating: z.enum(["1", "2", "3", "4", "5"]).optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function StarRating({ rating }: { rating: string | null }) {
  if (!rating) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < parseInt(rating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );
}

export default function SuppliersPage() {
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryEditing, setCategoryEditing] = useState<number | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("manageCategories") === "1") setCategoryOpen(true);
  }, []);

  const { data: categories } = trpc.suppliers.categories.list.useQuery();
  const { data: suppliers, isLoading } = trpc.suppliers.list.useQuery(
    search ? { search } : undefined
  );

  const create = trpc.suppliers.create.useMutation({
    onSuccess: () => { toast.success("تم إنشاء المورد بنجاح"); utils.suppliers.list.invalidate(); utils.controlTower.stats.invalidate(); setOpen(false); },
    onError: (e) => toast.error(e.message),
  });

  const update = trpc.suppliers.update.useMutation({
    onSuccess: () => { toast.success("تم تحديث المورد بنجاح"); utils.suppliers.list.invalidate(); setOpen(false); setEditing(null); },
    onError: (e) => toast.error(e.message),
  });

  const del = trpc.suppliers.delete.useMutation({
    onSuccess: () => { toast.success("تم حذف المورد"); utils.suppliers.list.invalidate(); utils.controlTower.stats.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const createCategory = trpc.suppliers.categories.create.useMutation({
    onSuccess: () => { toast.success("تم إنشاء التصنيف"); utils.suppliers.categories.list.invalidate(); resetCategoryForm(); },
    onError: (e) => toast.error(e.message),
  });
  const updateCategory = trpc.suppliers.categories.update.useMutation({
    onSuccess: () => { toast.success("تم تحديث التصنيف"); utils.suppliers.categories.list.invalidate(); resetCategoryForm(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteCategory = trpc.suppliers.categories.delete.useMutation({
    onSuccess: () => { toast.success("تم حذف التصنيف"); utils.suppliers.categories.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  function resetCategoryForm() {
    setCategoryEditing(null);
    setCategoryName("");
    setCategoryDescription("");
  }

  function saveCategory() {
    const name = categoryName.trim();
    if (!name) {
      toast.error("اسم التصنيف مطلوب");
      return;
    }
    if (categoryEditing) {
      updateCategory.mutate({ id: categoryEditing, name, description: categoryDescription.trim() || undefined });
    } else {
      createCategory.mutate({ name, description: categoryDescription.trim() || undefined });
    }
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: "", name: "", country: "Saudi Arabia" },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({ code: "", name: "", country: "Saudi Arabia" });
    setOpen(true);
  };

  const openEdit = (supplier: NonNullable<typeof suppliers>[0]) => {
    setEditing(supplier.id);
    form.reset({
      code: supplier.code ?? "",
      name: supplier.name ?? "",
      nameEn: supplier.nameEn ?? "",
      categoryId: supplier.categoryId ? String(supplier.categoryId) : "",
      registrationNumber: supplier.registrationNumber ?? "",
      taxNumber: supplier.taxNumber ?? "",
      contactPerson: supplier.contactPerson ?? "",
      email: supplier.email ?? "",
      phone: supplier.phone ?? "",
      website: supplier.website ?? "",
      address: supplier.address ?? "",
      city: supplier.city ?? "",
      country: supplier.country ?? "Saudi Arabia",
      rating: (supplier.rating as FormValues["rating"]) ?? undefined,
      notes: supplier.notes ?? "",
    });
    setOpen(true);
  };

  const onSubmit = (values: FormValues) => {
    const categoryId = values.categoryId ? parseInt(values.categoryId) : undefined;
    if (editing) {
      update.mutate({ id: editing, ...values, categoryId, email: values.email || undefined });
    } else {
      create.mutate({ ...values, categoryId, email: values.email || undefined });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            الموردون
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">إدارة قاعدة بيانات الموردين والتصنيفات المرتبطة بها</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setCategoryOpen(true)} className="gap-2">
            <Settings2 className="h-4 w-4" />
            إدارة التصنيفات
          </Button>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            مورد جديد
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <Input
          placeholder="بحث باسم المورد أو الكود..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
      ) : !suppliers || suppliers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Truck className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-base font-medium">لا يوجد موردون</p>
            <p className="text-sm text-muted-foreground mt-1">أضف أول مورد للشركة</p>
            <Button onClick={openCreate} className="mt-4 gap-2" variant="outline">
              <Plus className="h-4 w-4" />
              إضافة مورد
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الكود</TableHead>
                <TableHead>المورد</TableHead>
                <TableHead>جهة الاتصال</TableHead>
                <TableHead>الهاتف</TableHead>
                <TableHead>التقييم</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="w-24">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-mono text-sm text-muted-foreground">{supplier.code}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{supplier.name}</p>
                      {supplier.nameEn && <p className="text-xs text-muted-foreground">{supplier.nameEn}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{supplier.contactPerson ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground" dir="ltr">{supplier.phone ?? "—"}</TableCell>
                  <TableCell><StarRating rating={supplier.rating} /></TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[supplier.status ?? "active"]}>
                      {STATUS_LABELS[supplier.status ?? "active"]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setLocation(`/suppliers/${supplier.id}`)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(supplier)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => { if (confirm("هل أنت متأكد من حذف هذا المورد؟")) del.mutate({ id: supplier.id }); }}>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل المورد" : "مورد جديد"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="code" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الكود *</FormLabel>
                    <FormControl><Input {...field} placeholder="SUP-001" dir="ltr" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>اسم المورد *</FormLabel>
                    <FormControl><Input {...field} placeholder="اسم المورد" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="nameEn" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم (إنجليزي)</FormLabel>
                    <FormControl><Input {...field} placeholder="Supplier Name" dir="ltr" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="categoryId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>التصنيف</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="اختر التصنيف" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {categories?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="registrationNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم السجل</FormLabel>
                    <FormControl><Input {...field} placeholder="1010XXXXXX" dir="ltr" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="taxNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الرقم الضريبي</FormLabel>
                    <FormControl><Input {...field} placeholder="3XXXXXXXXXXXXXXXXX3" dir="ltr" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="contactPerson" render={({ field }) => (
                  <FormItem>
                    <FormLabel>جهة الاتصال</FormLabel>
                    <FormControl><Input {...field} placeholder="اسم المسؤول" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني</FormLabel>
                    <FormControl><Input {...field} type="email" placeholder="supplier@..." dir="ltr" /></FormControl>
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
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem>
                    <FormLabel>المدينة</FormLabel>
                    <FormControl><Input {...field} placeholder="الرياض" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="rating" render={({ field }) => (
                  <FormItem>
                    <FormLabel>التقييم</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="اختر التقييم" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {["1","2","3","4","5"].map(v => <SelectItem key={v} value={v}>{"⭐".repeat(parseInt(v))} ({v}/5)</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>ملاحظات</FormLabel>
                    <FormControl><Textarea {...field} placeholder="ملاحظات إضافية..." rows={2} /></FormControl>
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

      <Dialog open={categoryOpen} onOpenChange={(nextOpen) => { setCategoryOpen(nextOpen); if (!nextOpen) resetCategoryForm(); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>إدارة تصنيفات الموردين</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl border bg-muted/20 p-4">
              <p className="mb-3 text-sm font-semibold">{categoryEditing ? "تعديل التصنيف" : "إضافة تصنيف"}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="اسم التصنيف" />
                <Input value={categoryDescription} onChange={(event) => setCategoryDescription(event.target.value)} placeholder="وصف مختصر (اختياري)" />
              </div>
              <div className="mt-3 flex gap-2">
                <Button onClick={saveCategory} disabled={createCategory.isPending || updateCategory.isPending} size="sm">
                  {createCategory.isPending || updateCategory.isPending ? "جاري الحفظ..." : categoryEditing ? "تحديث التصنيف" : "إضافة التصنيف"}
                </Button>
                {categoryEditing && <Button variant="ghost" size="sm" onClick={resetCategoryForm}>إلغاء التعديل</Button>}
              </div>
            </div>
            <div className="space-y-2">
              {(categories ?? []).map((category) => (
                <div key={category.id} className="flex items-center justify-between rounded-xl border px-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{category.name}</p>
                    {category.description && <p className="truncate text-xs text-muted-foreground">{category.description}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setCategoryEditing(category.id); setCategoryName(category.name); setCategoryDescription(category.description ?? ""); }} aria-label={`تعديل ${category.name}`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { if (confirm(`هل أنت متأكد من حذف تصنيف ${category.name}؟`)) deleteCategory.mutate({ id: category.id }); }} aria-label={`حذف ${category.name}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {(!categories || categories.length === 0) && <p className="py-6 text-center text-sm text-muted-foreground">لا توجد تصنيفات مسجلة</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryOpen(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
