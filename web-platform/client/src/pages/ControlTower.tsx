import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  ArrowLeft,
  ArrowUpLeft,
  Building2,
  CheckCircle2,
  ChevronLeft,
  CircleAlert,
  Clock3,
  FilePlus2,
  FileSpreadsheet,
  FolderKanban,
  GitBranch,
  Mic,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Truck,
  Users,
} from "lucide-react";
import { useMemo, useState, type ElementType } from "react";
import { useLocation } from "wouter";

const moduleLabels: Record<string, string> = {
  organization: "المنظمة",
  projects: "المشاريع",
  suppliers: "الموردون",
  purchase_requests: "طلبات الشراء",
  governance: "الحوكمة",
  smart_intake: "التحليل الذكي",
  operational: "العمليات",
};

const actionLabels: Record<string, string> = {
  created: "أُنشئ",
  updated: "حُدّث",
  deleted: "حُذف",
  submitted: "قُدّم للمراجعة",
  approved: "اعتُمد",
  rejected: "رُفض",
  cancelled: "أُلغي",
  linked: "رُبط",
  unlinked: "فُكّ الربط",
  team_member_added: "أُضيف عضو",
  team_member_removed: "أُزيل عضو",
  upserted: "حُدّث",
  draft_created: "أُنشئت مسودة",
};

const entityLabels: Record<string, string> = {
  company: "الشركة",
  branch: "فرع",
  department: "قسم",
  user: "مستخدم",
  project: "مشروع",
  project_team: "فريق مشروع",
  supplier: "مورد",
  supplier_category: "تصنيف مورد",
  purchase_request: "طلب شراء",
  architecture_review: "مراجعة بنية",
  architecture_decision: "قرار بنية",
  traceability: "رابط تتبع",
  smart_intake_draft: "مسودة تحليل",
};

const coreAreas: Array<{ title: string; detail: string; path: string; icon: ElementType }> = [
  { title: "المشاريع", detail: "متابعة الحالة والفرق", path: "/projects", icon: FolderKanban },
  { title: "الموردون", detail: "البيانات والتصنيفات", path: "/suppliers", icon: Truck },
  { title: "طلبات الشراء", detail: "الإنشاء والاعتماد", path: "/procurement/requests", icon: ShoppingCart },
  { title: "الحوكمة", detail: "المراجعات والقرارات", path: "/governance/reviews", icon: GitBranch },
  { title: "المستخدمون", detail: "الأدوار والصلاحيات", path: "/admin/users", icon: Users },
];

function formatRelativeTime(date: Date): string {
  const difference = Date.now() - new Date(date).getTime();
  const minutes = Math.max(0, Math.floor(difference / 60_000));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  return `منذ ${days} يوم`;
}

function ActivityIcon({ action }: { action: string }) {
  if (action === "approved") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  if (action === "rejected" || action === "cancelled") return <CircleAlert className="h-4 w-4 text-rose-600" />;
  if (action === "submitted") return <Clock3 className="h-4 w-4 text-amber-600" />;
  return <Activity className="h-4 w-4 text-cyan-700" />;
}

function MetricCard({ label, value, detail, icon: Icon, tone }: { label: string; value: number; detail: string; icon: typeof FolderKanban; tone: "cyan" | "emerald" | "amber" | "violet" }) {
  const tones = {
    cyan: "bg-cyan-50 text-cyan-700 ring-cyan-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
  } as const;

  return (
    <Card className="group overflow-hidden border-slate-200/80 bg-white shadow-[0_12px_30px_rgba(15,35,50,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(15,35,50,0.09)]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-[#102432]">{value.toLocaleString("ar-EG")}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
          </div>
          <div className={`grid h-11 w-11 place-items-center rounded-2xl ring-1 ${tones[tone]}`}><Icon className="h-5 w-5" /></div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({ title, detail, icon: Icon, tone, onClick }: { title: string; detail: string; icon: typeof Mic; tone: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group flex min-h-36 w-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 text-right shadow-[0_10px_28px_rgba(15,35,50,0.04)] transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_20px_40px_rgba(15,35,50,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500">
      <div className="flex items-start justify-between gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-2xl ${tone}`}><Icon className="h-5 w-5" /></span>
        <ArrowLeft className="h-4 w-4 text-slate-300 transition-transform duration-200 group-hover:-translate-x-1 group-hover:text-[#102432]" />
      </div>
      <div className="mt-5"><p className="text-base font-black text-[#102432]">{title}</p><p className="mt-1.5 text-xs leading-5 text-slate-500">{detail}</p></div>
    </button>
  );
}

function SignalRow({ label, value, detail, tone }: { label: string; value: number; detail: string; tone: "neutral" | "warning" | "success" }) {
  const styles = {
    neutral: "bg-slate-100 text-slate-700",
    warning: "bg-amber-50 text-amber-700",
    success: "bg-emerald-50 text-emerald-700",
  } as const;
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 px-3.5 py-3">
      <div className="min-w-0"><p className="text-sm font-bold text-[#102432]">{label}</p><p className="mt-0.5 text-xs text-slate-500">{detail}</p></div>
      <span className={`grid h-9 min-w-9 place-items-center rounded-xl px-2 text-sm font-black ${styles[tone]}`}>{value.toLocaleString("ar-EG")}</span>
    </div>
  );
}

export default function ControlTower() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const pendingDraftInput = useMemo(() => ({ status: "pending_review" }), []);
  const { data: stats, isLoading: statsLoading, isError: statsError } = trpc.controlTower.stats.useQuery();
  const { data: activity, isLoading: activityLoading, isError: activityError } = trpc.controlTower.activity.useQuery({ limit: 12 });
  const { data: pendingDrafts } = trpc.smartIntake.list.useQuery(pendingDraftInput);
  const [refreshing, setRefreshing] = useState(false);

  const pendingItems = (stats?.purchaseRequests.pending ?? 0) + (pendingDrafts?.length ?? 0);
  const greetingName = user?.name?.trim() || "فريق التشغيل";

  const refresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        utils.controlTower.stats.invalidate(),
        utils.controlTower.activity.invalidate(),
        utils.smartIntake.list.invalidate(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-8">
      <section className="relative isolate overflow-hidden rounded-[2rem] bg-[#102432] px-5 py-6 text-white shadow-[0_24px_55px_rgba(15,35,50,0.16)] sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -left-24 -top-36 h-80 w-80 rounded-full bg-cyan-300/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-56 w-[45%] bg-[linear-gradient(135deg,transparent_0%,rgba(103,232,249,0.10)_100%)]" />
        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-bold text-cyan-100"><span className="h-2 w-2 rounded-full bg-emerald-300" />مركز التشغيل · بيانات حية</div>
            <h1 className="mt-5 text-3xl font-black leading-tight tracking-[-0.035em] sm:text-4xl">صباح الخير، {greetingName}.<br /><span className="text-cyan-200">هذه هي الأولويات الفعلية لمساحة العمل.</span></h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">ابدأ من إجراء تشغيلي واضح، وتابع ما يحتاج إلى مراجعة، ثم راجع أثر كل قرار من نفس المساحة.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-sm"><p className="text-[10px] font-black tracking-[0.12em] text-slate-400">تحتاج مراجعة</p><p className="mt-1 text-2xl font-black text-white">{pendingItems.toLocaleString("ar-EG")}</p></div>
            <Button onClick={() => void refresh()} disabled={refreshing} className="h-12 rounded-2xl bg-cyan-200 px-4 font-black text-[#102432] hover:bg-white"><RefreshCw className={`ml-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />تحديث البيانات</Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statsLoading ? Array.from({ length: 4 }).map((_, index) => <Card key={index}><CardContent className="p-5"><Skeleton className="h-24 w-full" /></CardContent></Card>) : stats ? <>
          <MetricCard label="المشاريع النشطة" value={stats.projects.active} detail={`${stats.projects.total} مشروعاً مسجلاً`} icon={FolderKanban} tone="cyan" />
          <MetricCard label="الموردون النشطون" value={stats.suppliers.active} detail={`${stats.suppliers.total} موردًا في السجل`} icon={Truck} tone="emerald" />
          <MetricCard label="طلبات تحت المراجعة" value={stats.purchaseRequests.pending} detail="طلبات شراء مقدمة أو قيد المراجعة" icon={ShoppingCart} tone="amber" />
          <MetricCard label="قرارات معتمدة" value={stats.governance.approvedDecisions} detail={`${stats.governance.decisions} قرارًا مسجلاً`} icon={ShieldCheck} tone="violet" />
        </> : <div className="col-span-full rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">{statsError ? "تعذر تحميل مؤشرات التشغيل الحية. استخدم التحديث لإعادة المحاولة." : "لا توجد مؤشرات متاحة لهذا الحساب."}</div>}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.22fr_0.78fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-[#f6f8f7] p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-[10px] font-black tracking-[0.16em] text-cyan-700">START WITH AN ACTION</p><h2 className="mt-1 text-2xl font-black tracking-[-0.025em] text-[#102432]">ما الذي تريد إنجازه الآن؟</h2></div><p className="max-w-xs text-xs leading-5 text-slate-500">كل اختصار يفتح وحدة حقيقية في المنصة، وليس شاشة تعريفية.</p></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <QuickAction title="بدء أمر صوتي" detail="جلسة عربية متعددة الخطوات مع مراجعة قبل التنفيذ." icon={Mic} tone="bg-cyan-100 text-cyan-700" onClick={() => setLocation("/commands")} />
            <QuickAction title="تحليل مستند" detail="ارفع صورة أو ملفاً، ثم راجع القيم والدليل قبل الحفظ." icon={ScanLine} tone="bg-violet-100 text-violet-700" onClick={() => setLocation("/ocr")} />
            <QuickAction title="طلب شراء جديد" detail="أنشئ طلباً ببنود قابلة للاعتماد والتتبع." icon={FilePlus2} tone="bg-amber-100 text-amber-700" onClick={() => setLocation("/procurement/requests/new")} />
            <QuickAction title="تقرير وتصدير" detail="صفِّ البيانات وراجع النتيجة قبل تصدير التقرير." icon={FileSpreadsheet} tone="bg-emerald-100 text-emerald-700" onClick={() => setLocation("/reports/export")} />
          </div>
        </div>

        <Card className="overflow-hidden border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,35,50,0.05)]">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center justify-between"><div><p className="text-[10px] font-black tracking-[0.16em] text-cyan-700">OPERATING SIGNALS</p><h2 className="mt-1 text-xl font-black text-[#102432]">إشارات المتابعة</h2></div><Sparkles className="h-5 w-5 text-cyan-600" /></div>
            <div className="mt-5 space-y-2.5">
              <SignalRow label="مسودات التحليل" value={pendingDrafts?.length ?? 0} detail="تتطلب مراجعة بشرية قبل الاعتماد" tone={(pendingDrafts?.length ?? 0) > 0 ? "warning" : "success"} />
              <SignalRow label="طلبات الشراء" value={stats?.purchaseRequests.pending ?? 0} detail="قُدمت وتنتظر قرار المراجع" tone={(stats?.purchaseRequests.pending ?? 0) > 0 ? "warning" : "neutral"} />
              <SignalRow label="مراجعات البنية" value={stats?.governance.reviews ?? 0} detail="سجل الحوكمة المعماري" tone="neutral" />
              <SignalRow label="المستخدمون" value={stats?.users.total ?? 0} detail="حسابات مسجلة في مساحة العمل" tone="neutral" />
            </div>
            <button onClick={() => setLocation("/integrations/whatsapp")} className="mt-5 flex w-full items-center justify-between rounded-2xl bg-[#102432] px-4 py-3 text-right text-sm font-bold text-white transition-colors hover:bg-[#173748]"><span>قنوات الإدخال والصلاحيات</span><ChevronLeft className="h-4 w-4 text-cyan-200" /></button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <Card className="border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,35,50,0.05)]"><CardContent className="p-5 sm:p-6">
          <div className="flex items-center justify-between"><div><p className="text-[10px] font-black tracking-[0.16em] text-cyan-700">CORE AREAS</p><h2 className="mt-1 text-xl font-black text-[#102432]">الوحدات الأساسية</h2></div><Building2 className="h-5 w-5 text-slate-400" /></div>
          <div className="mt-4 space-y-1.5">
            {coreAreas.map(({ title, detail, path, icon: Icon }) => <button key={path} onClick={() => setLocation(path)} className="group flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-right transition-colors hover:bg-slate-50"><span className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100 text-slate-600"><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-[#102432]">{title}</span><span className="mt-0.5 block text-xs text-slate-500">{detail}</span></span><ArrowUpLeft className="h-3.5 w-3.5 text-slate-300 transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" /></button>)}
          </div>
        </CardContent></Card>

        <Card className="border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,35,50,0.05)]"><CardContent className="p-5 sm:p-6">
          <div className="flex items-center justify-between"><div><p className="text-[10px] font-black tracking-[0.16em] text-cyan-700">AUDIT TRAIL</p><h2 className="mt-1 text-xl font-black text-[#102432]">النشاطات الأخيرة</h2></div><button onClick={() => setLocation("/governance/traceability")} className="text-xs font-bold text-cyan-700 hover:text-cyan-800">عرض التتبع</button></div>
          {activityLoading ? <div className="mt-5 space-y-3">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-14 w-full" />)}</div> : activity?.length ? <div className="mt-4 divide-y divide-slate-100">{activity.slice(0, 6).map(item => <div key={item.id} className="flex gap-3 py-3.5"><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-slate-50"><ActivityIcon action={item.action} /></span><div className="min-w-0 flex-1"><p className="text-sm leading-6 text-[#102432]"><span className="font-bold">{actionLabels[item.action] ?? item.action}</span><span className="text-slate-500"> {entityLabels[item.entityType] ?? item.entityType}</span>{item.entityLabel ? <span className="font-bold"> · {item.entityLabel}</span> : null}</p><div className="mt-1 flex items-center gap-2"><Badge variant="outline" className="h-5 border-slate-200 px-1.5 text-[10px] font-bold text-slate-500">{moduleLabels[item.module] ?? item.module}</Badge><span className="flex items-center gap-1 text-[11px] text-slate-400"><Clock3 className="h-3 w-3" />{formatRelativeTime(item.createdAt)}</span></div></div></div>)}</div> : <div className="mt-5 flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 text-center"><Activity className="h-7 w-7 text-slate-300" /><p className="mt-3 text-sm font-bold text-slate-600">لا يوجد نشاط مسجل بعد</p><p className="mt-1 text-xs leading-5 text-slate-500">ستظهر هنا الإجراءات المعتمدة عند استخدام المنصة.</p></div>}
          {activityError ? <p className="mt-4 text-xs text-rose-700">تعذر تحميل سجل النشاط. أعد المحاولة عبر تحديث البيانات.</p> : null}
        </CardContent></Card>
      </section>
    </div>
  );
}
