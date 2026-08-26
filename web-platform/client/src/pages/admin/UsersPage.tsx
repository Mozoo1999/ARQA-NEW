import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Pencil, Users } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const ROLE_LABELS: Record<string, string> = { admin: "مدير النظام", manager: "مدير", user: "مستخدم" };
const ROLE_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  admin: "default", manager: "secondary", user: "outline",
};

const editSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح").optional().or(z.literal("")),
  role: z.enum(["admin", "manager", "user"]),
  jobTitle: z.string().optional(),
  phone: z.string().optional(),
  departmentId: z.string().optional(),
  branchId: z.string().optional(),
  isActive: z.boolean(),
});

type EditValues = z.infer<typeof editSchema>;

export default function UsersPage() {
  const utils = trpc.useUtils();
  const { user: currentUser } = useAuth();
  const [editUser, setEditUser] = useState<{ id: number; name: string; email: string | null; role: string; jobTitle: string | null; phone: string | null; departmentId: number | null; branchId: number | null; isActive: boolean | null } | null>(null);

  const { data: users, isLoading } = trpc.users.list.useQuery();
  const { data: departments } = trpc.departments.list.useQuery();
  const { data: branches } = trpc.branches.list.useQuery();

  const update = trpc.users.update.useMutation({
    onSuccess: () => { toast.success("تم تحديث المستخدم بنجاح"); utils.users.list.invalidate(); setEditUser(null); },
    onError: (e) => toast.error(e.message),
  });

  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: "", role: "user", isActive: true },
  });

  type UserRow = { id: number; name: string | null; email: string | null; role: "admin" | "manager" | "user"; jobTitle: string | null; phone: string | null; departmentId: number | null; branchId: number | null; isActive: boolean | null };
  const openEdit = (u: UserRow) => {
    if (!u) return;
    setEditUser({ ...u, name: u.name ?? "" });
    form.reset({
      name: u.name ?? "",
      email: u.email ?? "",
      role: (u.role as "admin" | "manager" | "user") ?? "user",
      jobTitle: u.jobTitle ?? "",
      phone: u.phone ?? "",
      departmentId: u.departmentId ? String(u.departmentId) : undefined,
      branchId: u.branchId ? String(u.branchId) : undefined,
      isActive: u.isActive ?? true,
    });
  };

  const onSubmit = (values: EditValues) => {
    if (!editUser) return;
    update.mutate({
      id: editUser.id,
      name: values.name,
      email: values.email || undefined,
      role: values.role,
      jobTitle: values.jobTitle || undefined,
      phone: values.phone || undefined,
      departmentId: values.departmentId ? parseInt(values.departmentId) : null,
      branchId: values.branchId ? parseInt(values.branchId) : null,
      isActive: values.isActive,
    });
  };

  const isAdmin = currentUser?.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            إدارة المستخدمين
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAdmin ? "إدارة حسابات المستخدمين والصلاحيات" : "عرض قائمة المستخدمين"}
          </p>
        </div>
      </div>

      {isLoading ? (
        <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المستخدم</TableHead>
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>المسمى الوظيفي</TableHead>
                <TableHead>الحالة</TableHead>
                {isAdmin && <TableHead className="w-16">تعديل</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                        {(u.name ?? "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{u.name}</p>
                        {u.id === currentUser?.id && <p className="text-xs text-muted-foreground">أنت</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground" dir="ltr">{u.email ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={ROLE_VARIANTS[u.role ?? "user"]}>
                      {ROLE_LABELS[u.role ?? "user"]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.jobTitle ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={u.isActive ? "default" : "secondary"}>
                      {u.isActive ? "نشط" : "غير نشط"}
                    </Badge>
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(u as UserRow)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل المستخدم</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>الاسم *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="role" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الدور *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {Object.entries(ROLE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="jobTitle" render={({ field }) => (
                  <FormItem>
                    <FormLabel>المسمى الوظيفي</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
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
                <FormField control={form.control} name="branchId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الفرع</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="اختر الفرع" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {branches?.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>رقم الهاتف</FormLabel>
                  <FormControl><Input {...field} dir="ltr" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="isActive" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>الحساب نشط</FormLabel>
                    <p className="text-xs text-muted-foreground">تفعيل أو تعطيل الحساب</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditUser(null)}>إلغاء</Button>
                <Button type="submit" disabled={update.isPending}>
                  {update.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
