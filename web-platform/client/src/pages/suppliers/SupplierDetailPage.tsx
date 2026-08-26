import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Globe, Mail, MapPin, Phone, Star, Truck, User } from "lucide-react";
import { useLocation, useParams } from "wouter";

const STATUS_LABELS: Record<string, string> = { active: "نشط", inactive: "غير نشط", blacklisted: "محظور" };
const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive"> = {
  active: "default", inactive: "secondary", blacklisted: "destructive",
};

function StarRating({ rating }: { rating: string | null }) {
  if (!rating) return <span className="text-muted-foreground text-sm">لم يُقيَّم</span>;
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < parseInt(rating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`} />
      ))}
      <span className="text-sm text-muted-foreground ms-1">({rating}/5)</span>
    </div>
  );
}

export default function SupplierDetailPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const supplierId = parseInt(params.id ?? "0");

  const { data: supplier, isLoading } = trpc.suppliers.getById.useQuery({ id: supplierId }, { enabled: !!supplierId });

  if (isLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );

  if (!supplier) return (
    <div className="flex flex-col items-center justify-center py-16">
      <p className="text-muted-foreground">المورد غير موجود</p>
      <Button variant="link" onClick={() => setLocation("/suppliers")}>العودة للموردين</Button>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <button onClick={() => setLocation("/suppliers")} className="hover:text-foreground flex items-center gap-1">
              <ArrowRight className="h-3.5 w-3.5" />
              الموردون
            </button>
            <span>/</span>
            <span>{supplier.code}</span>
          </div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            {supplier.name}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={STATUS_VARIANTS[supplier.status ?? "active"]}>
              {STATUS_LABELS[supplier.status ?? "active"]}
            </Badge>
            <span className="text-sm text-muted-foreground font-mono">{supplier.code}</span>
          </div>
        </div>
        <Button variant="outline" onClick={() => setLocation("/suppliers")}>العودة</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Info */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">معلومات التواصل</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {supplier.contactPerson && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{supplier.contactPerson}</span>
              </div>
            )}
            {supplier.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${supplier.email}`} className="text-primary hover:underline" dir="ltr">{supplier.email}</a>
              </div>
            )}
            {supplier.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span dir="ltr">{supplier.phone}</span>
              </div>
            )}
            {supplier.website && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a href={supplier.website} target="_blank" rel="noreferrer" className="text-primary hover:underline" dir="ltr">{supplier.website}</a>
              </div>
            )}
            {(supplier.city || supplier.country) && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{[supplier.city, supplier.country].filter(Boolean).join("، ")}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Business Info */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">المعلومات التجارية</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {supplier.registrationNumber && (
              <div>
                <p className="text-xs text-muted-foreground">رقم السجل التجاري</p>
                <p className="text-sm font-medium" dir="ltr">{supplier.registrationNumber}</p>
              </div>
            )}
            {supplier.taxNumber && (
              <div>
                <p className="text-xs text-muted-foreground">الرقم الضريبي</p>
                <p className="text-sm font-medium" dir="ltr">{supplier.taxNumber}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground mb-1">التقييم</p>
              <StarRating rating={supplier.rating} />
            </div>
            {supplier.notes && (
              <div>
                <p className="text-xs text-muted-foreground">ملاحظات</p>
                <p className="text-sm">{supplier.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Metadata */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">تاريخ الإضافة</p>
              <p className="font-medium">{new Date(supplier.createdAt).toLocaleDateString("ar-SA")}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">آخر تحديث</p>
              <p className="font-medium">{new Date(supplier.updatedAt).toLocaleDateString("ar-SA")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
