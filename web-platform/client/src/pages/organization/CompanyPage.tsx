import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "@/lib/trpc";
import { Building2, Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMA - avoid z.coerce.number() to prevent zod v4 input type issues
// ─────────────────────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1, "اسم الشركة مطلوب"),
  nameEn: z.string().optional(),
  registrationNumber: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  description: z.string().optional(),
  foundedYear: z.string().optional(),
  employeeCount: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const INDUSTRIES = [
  "تقنية المعلومات", "الاستشارات", "الهندسة والمقاولات", "التعليم",
  "الرعاية الصحية", "التصنيع", "التجزئة", "الخدمات المالية",
  "النقل والخدمات اللوجستية", "الطاقة", "أخرى",
];

export default function CompanyPage() {
  const utils = trpc.useUtils();
  const { data: company, isLoading } = trpc.company.get.useQuery();
  const upsert = trpc.company.upsert.useMutation({
    onSuccess: () => {
      toast.success("تم حفظ بيانات الشركة بنجاح");
      utils.company.get.invalidate();
      utils.controlTower.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", country: "Saudi Arabia" },
  });

  useEffect(() => {
    if (company) {
      form.reset({
        name: company.name ?? "",
        nameEn: company.nameEn ?? "",
        registrationNumber: company.registrationNumber ?? "",
        industry: company.industry ?? "",
        website: company.website ?? "",
        email: company.email ?? "",
        phone: company.phone ?? "",
        address: company.address ?? "",
        city: company.city ?? "",
        country: company.country ?? "Saudi Arabia",
        description: company.description ?? "",
        foundedYear: company.foundedYear ? String(company.foundedYear) : "",
        employeeCount: company.employeeCount ? String(company.employeeCount) : "",
      });
    }
  }, [company, form]);

  const onSubmit = (values: FormValues) => {
    const foundedYear = values.foundedYear ? parseInt(values.foundedYear) : undefined;
    const employeeCount = values.employeeCount ? parseInt(values.employeeCount) : undefined;
    upsert.mutate({
      ...values,
      email: values.email || undefined,
      foundedYear: isNaN(foundedYear!) ? undefined : foundedYear,
      employeeCount: isNaN(employeeCount!) ? undefined : employeeCount,
    });
  };

  if (isLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          ملف الشركة
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">البيانات الأساسية للمنظمة</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">المعلومات الأساسية</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>اسم الشركة (عربي) *</FormLabel>
                  <FormControl><Input {...field} placeholder="شركة نارقا للاستشارات" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="nameEn" render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم الشركة (إنجليزي)</FormLabel>
                  <FormControl><Input {...field} placeholder="NARQA Consulting" dir="ltr" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="industry" render={({ field }) => (
                <FormItem>
                  <FormLabel>القطاع</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="اختر القطاع" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="registrationNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel>رقم السجل التجاري</FormLabel>
                  <FormControl><Input {...field} placeholder="1010XXXXXX" dir="ltr" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="foundedYear" render={({ field }) => (
                <FormItem>
                  <FormLabel>سنة التأسيس</FormLabel>
                  <FormControl><Input {...field} type="number" placeholder="2020" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="employeeCount" render={({ field }) => (
                <FormItem>
                  <FormLabel>عدد الموظفين</FormLabel>
                  <FormControl><Input {...field} type="number" placeholder="50" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">معلومات التواصل</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>البريد الإلكتروني</FormLabel>
                  <FormControl><Input {...field} type="email" placeholder="info@company.com" dir="ltr" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>رقم الهاتف</FormLabel>
                  <FormControl><Input {...field} placeholder="+966 XX XXX XXXX" dir="ltr" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="website" render={({ field }) => (
                <FormItem>
                  <FormLabel>الموقع الإلكتروني</FormLabel>
                  <FormControl><Input {...field} placeholder="https://www.company.com" dir="ltr" /></FormControl>
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
              <FormField control={form.control} name="country" render={({ field }) => (
                <FormItem>
                  <FormLabel>الدولة</FormLabel>
                  <FormControl><Input {...field} placeholder="المملكة العربية السعودية" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>العنوان</FormLabel>
                  <FormControl><Textarea {...field} placeholder="العنوان التفصيلي" rows={2} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">نبذة عن الشركة</CardTitle></CardHeader>
            <CardContent>
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormControl><Textarea {...field} placeholder="وصف مختصر عن الشركة ونشاطها..." rows={4} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={upsert.isPending} className="gap-2">
              <Save className="h-4 w-4" />
              {upsert.isPending ? "جاري الحفظ..." : "حفظ البيانات"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
