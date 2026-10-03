import { Bell, CheckCheck, Clock3, ExternalLink, Inbox, Loader2, ShieldCheck, TriangleAlert } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

const categoryLabels: Record<string, string> = {
  task: "مهمة مراجعة",
  approval: "قرار واعتماد",
  update: "تحديث تشغيلي",
  system: "النظام",
};

const priorityLabels: Record<string, string> = {
  low: "منخفضة",
  normal: "عادية",
  high: "مهمة",
  urgent: "عاجلة",
};

function formatTime(value: Date | string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function priorityClass(priority: string) {
  if (priority === "urgent") return "border-rose-300 bg-rose-50 text-rose-700";
  if (priority === "high") return "border-amber-300 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

export default function NotificationsPage() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const notificationList = trpc.notifications.list.useQuery({ limit: 60 }, { refetchInterval: 30_000, staleTime: 10_000 });
  const summary = trpc.notifications.summary.useQuery(undefined, { refetchInterval: 30_000, staleTime: 10_000 });
  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => { void utils.notifications.list.invalidate(); void utils.notifications.summary.invalidate(); },
  });
  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => { void utils.notifications.list.invalidate(); void utils.notifications.summary.invalidate(); },
  });

  const notifications = notificationList.data ?? [];
  const unread = summary.data?.unreadCount ?? 0;
  const urgent = summary.data?.urgentCount ?? 0;

  return (
    <div dir="rtl" className="mx-auto w-full max-w-6xl space-y-6 pb-10">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-[radial-gradient(circle_at_top_right,_rgba(45,212,191,0.14),_transparent_36%),linear-gradient(135deg,_#ffffff,_#f8fafc)] p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -left-12 -top-14 size-48 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl text-right">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800">
              <Bell className="size-3.5" /> مركز الإشعارات الداخلي
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">تنبيهاتك مرتبطة بالعمل الفعلي</h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">تظهر هنا مهام المراجعة وقرارات طلبات الشراء وتحديثات المسودات المعتمدة فقط. لا تُرسل هذه الصفحة رسائل إلى جهات خارجية ولا تعرض بيانات غير مصرح بها.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-64">
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-right shadow-sm">
              <p className="text-xs font-medium text-slate-500">غير مقروءة</p>
              <p className="mt-1 text-3xl font-black tabular-nums text-slate-950">{unread}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-right shadow-sm">
              <p className="text-xs font-medium text-amber-700">تحتاج انتباهاً</p>
              <p className="mt-1 text-3xl font-black tabular-nums text-amber-800">{urgent}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-600"><ShieldCheck className="size-4 text-emerald-600" /> كل إجراء قراءة يخص حسابك فقط.</div>
        <Button variant="outline" onClick={() => markAllRead.mutate()} disabled={unread === 0 || markAllRead.isPending} className="gap-2 self-start sm:self-auto">
          {markAllRead.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCheck className="size-4" />} تعليم الكل كمقروء
        </Button>
      </div>

      {notificationList.isLoading ? (
        <div className="flex min-h-64 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50"><Loader2 className="size-6 animate-spin text-slate-500" /></div>
      ) : notificationList.error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-right text-sm text-rose-800"><TriangleAlert className="mb-3 size-5" />تعذر تحميل الإشعارات. أعد المحاولة بعد التحقق من اتصال الحساب.</div>
      ) : notifications.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-white shadow-sm"><Inbox className="size-6 text-slate-500" /></div>
          <h2 className="mt-4 font-bold text-slate-900">لا توجد إشعارات حتى الآن</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">ستظهر المهام الجديدة والقرارات المؤثرة بعد حدوثها ضمن تدفق العمل المعتمد.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(notification => (
            <article key={notification.id} className={`group rounded-2xl border p-4 transition-all duration-200 ${notification.isRead ? "border-slate-200 bg-white" : "border-cyan-200 bg-cyan-50/35 shadow-sm"}`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 gap-3 text-right">
                  <div className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl ${notification.isRead ? "bg-slate-100 text-slate-500" : "bg-cyan-100 text-cyan-700"}`}><Bell className="size-4" /></div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center justify-start gap-2">
                      <h2 className="font-bold text-slate-950">{notification.title}</h2>
                      {!notification.isRead && <span className="size-2 rounded-full bg-cyan-500" aria-label="غير مقروء" />}
                      <Badge variant="outline" className={priorityClass(notification.priority)}>{priorityLabels[notification.priority] ?? notification.priority}</Badge>
                    </div>
                    <p className="mt-1 text-xs font-medium text-slate-500">{categoryLabels[notification.category] ?? notification.category} · {notification.module}</p>
                    {notification.body && <p className="mt-3 text-sm leading-6 text-slate-600">{notification.body}</p>}
                    <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-400"><Clock3 className="size-3.5" />{formatTime(notification.createdAt)}</p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                  {!notification.isRead && <Button size="sm" variant="ghost" disabled={markRead.isPending} onClick={() => markRead.mutate({ id: notification.id })}>قرأت الإشعار</Button>}
                  {notification.actionUrl && <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { if (!notification.isRead) markRead.mutate({ id: notification.id }); setLocation(notification.actionUrl!); }}>فتح المهمة <ExternalLink className="size-3.5" /></Button>}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
