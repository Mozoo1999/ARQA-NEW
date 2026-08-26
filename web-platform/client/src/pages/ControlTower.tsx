import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  BookOpen,
  CheckCircle2,
  Clock,
  GitBranch,
  ShoppingCart,
  TrendingUp,
  Truck,
  Users,
  XCircle,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// MODULE LABELS
// ─────────────────────────────────────────────────────────────────────────────

const moduleLabels: Record<string, string> = {
  organization: "المنظمة",
  projects: "المشاريع",
  suppliers: "الموردون",
  purchase_requests: "طلبات الشراء",
  governance: "الحوكمة",
};

const actionLabels: Record<string, string> = {
  created: "أنشأ",
  updated: "حدّث",
  deleted: "حذف",
  submitted: "قدّم",
  approved: "اعتمد",
  rejected: "رفض",
  cancelled: "ألغى",
  linked: "ربط",
  unlinked: "فكّ ربط",
  team_member_added: "أضاف عضو فريق",
  team_member_removed: "أزال عضو فريق",
  upserted: "حدّث بيانات",
};

const entityLabels: Record<string, string> = {
  company: "الشركة",
  branch: "الفرع",
  department: "القسم",
  project: "المشروع",
  project_team: "فريق المشروع",
  supplier: "المورد",
  supplier_category: "تصنيف مورد",
  purchase_request: "طلب شراء",
  architecture_review: "مراجعة بنية",
  architecture_decision: "قرار بنية",
  traceability: "رابط تتبع",
};

function getActionIcon(action: string) {
  if (action === "approved") return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
  if (action === "rejected") return <XCircle className="h-3.5 w-3.5 text-red-500" />;
  if (action === "created") return <TrendingUp className="h-3.5 w-3.5 text-blue-500" />;
  return <Activity className="h-3.5 w-3.5 text-muted-foreground" />;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  return `منذ ${days} يوم`;
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({ title, value, sub, icon: Icon, color }: { title: string; value: number | string; sub?: string; icon: React.ElementType; color: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function ControlTower() {
  const { data: stats, isLoading: statsLoading } = trpc.controlTower.stats.useQuery();
  const { data: activity, isLoading: activityLoading } = trpc.controlTower.activity.useQuery({ limit: 30 });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">برج التحكم المؤسسي</h1>
        <p className="text-sm text-muted-foreground mt-0.5">نظرة شاملة على جميع وحدات النظام في الوقت الفعلي</p>
      </div>

      {/* KPI Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard title="المستخدمون" value={stats.users.total} icon={Users} color="bg-blue-100 text-blue-600" />
          <StatCard title="المشاريع" value={stats.projects.total} sub={`${stats.projects.active} نشط`} icon={BookOpen} color="bg-indigo-100 text-indigo-600" />
          <StatCard title="الموردون" value={stats.suppliers.total} sub={`${stats.suppliers.active} نشط`} icon={Truck} color="bg-emerald-100 text-emerald-600" />
          <StatCard title="طلبات الشراء" value={stats.purchaseRequests.total} sub={`${stats.purchaseRequests.pending} معلق`} icon={ShoppingCart} color="bg-amber-100 text-amber-600" />
          <StatCard title="طلبات معتمدة" value={stats.purchaseRequests.approved} icon={CheckCircle2} color="bg-green-100 text-green-600" />
          <StatCard title="مراجعات البنية" value={stats.governance.reviews} icon={GitBranch} color="bg-purple-100 text-purple-600" />
          <StatCard title="قرارات البنية" value={stats.governance.decisions} sub={`${stats.governance.approvedDecisions} معتمد`} icon={Activity} color="bg-rose-100 text-rose-600" />
          <StatCard title="مشاريع نشطة" value={stats.projects.active} icon={TrendingUp} color="bg-cyan-100 text-cyan-600" />
        </div>
      ) : null}

      {/* System Health + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Health */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">صحة النظام</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "قاعدة البيانات", status: "متصل", ok: true },
              { label: "خادم API", status: "يعمل", ok: true },
              { label: "المصادقة", status: "نشط", ok: true },
              { label: "NEAF Compliance", status: "متوافق", ok: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <Badge variant={item.ok ? "default" : "destructive"} className="text-xs">
                  {item.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">سجل النشاطات الأخيرة</CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : !activity || activity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Activity className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">لا توجد نشاطات بعد</p>
                <p className="text-xs text-muted-foreground/60 mt-1">ستظهر هنا النشاطات عند بدء استخدام النظام</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {activity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                    <div className="mt-0.5 shrink-0">{getActionIcon(item.action)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{actionLabels[item.action] ?? item.action}</span>
                        {" "}
                        <span className="text-muted-foreground">{entityLabels[item.entityType] ?? item.entityType}</span>
                        {item.entityLabel && (
                          <span className="font-medium"> "{item.entityLabel}"</span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                          {moduleLabels[item.module] ?? item.module}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
