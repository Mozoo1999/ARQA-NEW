import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  BookOpen,
  Building2,
  Calculator,
  ChevronRight,
  GitBranch,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Network,
  ScanText,
  PanelLeft,
  ShoppingCart,
  Sparkles,
  Truck,
  Users,
  User,
  ShieldCheck,
  Workflow,
  ArrowUpLeft,
  FileSpreadsheet,
  Database,
  Settings,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

// ─────────────────────────────────────────────────────────────────────────────
// NAVIGATION STRUCTURE
// ─────────────────────────────────────────────────────────────────────────────

const navGroups = [
  {
    label: "الرئيسية",
    items: [
      { icon: LayoutDashboard, label: "برج التحكم", path: "/" },
    ],
  },
  {
    label: "المنظمة",
    items: [
      { icon: Building2, label: "الشركة", path: "/organization/company" },
      { icon: GitBranch, label: "الفروع", path: "/organization/branches" },
      { icon: Network, label: "الأقسام", path: "/organization/departments" },
    ],
  },
  {
    label: "العمليات",
    items: [
      { icon: Calculator, label: "التسعير الذكي", path: "/smart-pricing" },
      { icon: Sparkles, label: "الأوامر والإشعارات", path: "/commands" },
      { icon: MessageSquare, label: "واتساب وقنوات الإدخال", path: "/integrations/whatsapp" },
      { icon: ScanText, label: "استخراج OCR للوثائق", path: "/ocr" },
      { icon: BookOpen, label: "المشاريع", path: "/projects" },
      { icon: Truck, label: "الموردون", path: "/suppliers" },
      { icon: ShoppingCart, label: "طلبات الشراء", path: "/procurement/requests" },
    ],
  },
  {
    label: "الحوكمة",
    items: [
      { icon: ChevronRight, label: "مراجعات البنية", path: "/governance/reviews" },
      { icon: ChevronRight, label: "قرارات البنية", path: "/governance/decisions" },
      { icon: ChevronRight, label: "مصفوفة التتبع", path: "/governance/traceability" },
      { icon: Database, label: "مستكشف قواعد البيانات (ERD)", path: "/erd/explorer" },
    ],
  },
  {
    label: "الإدارة",
    items: [
      { icon: Users, label: "المستخدمون", path: "/admin/users" },
      { icon: FileSpreadsheet, label: "التقارير والتصدير", path: "/reports/export" },
      { icon: Settings, label: "إعدادات الهوية والنظام", path: "/admin/settings" },
    ],
  },
];

const SIDEBAR_WIDTH_KEY = "narqa-sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 360;

// ─────────────────────────────────────────────────────────────────────────────
// ROLE BADGE
// ─────────────────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role?: string }) {
  if (!role) return null;
  const labels: Record<string, string> = { admin: "مدير النظام", manager: "مدير", user: "مستخدم" };
  const variants: Record<string, "default" | "secondary" | "outline"> = { admin: "default", manager: "secondary", user: "outline" };
  return (
    <Badge variant={variants[role] ?? "outline"} className="text-[10px] px-1.5 py-0">
      {labels[role] ?? role}
    </Badge>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN LAYOUT
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#07111f] text-white">
        <div className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-0 h-[28rem] w-[28rem] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-5 py-8 sm:px-8 lg:px-12">
          <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-20">
            <section className="space-y-8 text-right">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs text-slate-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.12)]" />
                منصة التشغيل المؤسسي · الإصدار التشغيلي 0.1
              </div>
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-300 text-xl font-black text-[#07111f] shadow-lg shadow-cyan-500/20">N</div>
                  <div>
                    <p className="text-sm font-semibold tracking-[0.18em] text-cyan-300">NARQA</p>
                    <p className="text-xs text-slate-400">Enterprise Business Operating System</p>
                  </div>
                </div>
                <h1 className="max-w-2xl text-4xl font-bold leading-[1.15] tracking-tight sm:text-5xl lg:text-6xl">
                  مساحة تشغيل واحدة تربط <span className="text-cyan-300">القرار</span> بالتنفيذ.
                </h1>
                <p className="max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
                  نظام NARQA EBOS ينظم الشركة وفروعها وأقسامها ومشاريعها ومورديها وطلبات الشراء ضمن مسار تشغيلي قابل للمتابعة والحوكمة.
                </p>
              </div>
              <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
                {[
                  { icon: Workflow, label: "تدفق تشغيلي مترابط", detail: "من الطلب إلى الاعتماد" },
                  { icon: ShieldCheck, label: "حوكمة قابلة للتتبع", detail: "مراجعات وقرارات موثقة" },
                  { icon: Network, label: "نموذج بيانات واضح", detail: "علاقات ERD متسقة" },
                ].map(({ icon: Icon, label, detail }) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-sm">
                    <Icon className="mb-4 h-5 w-5 text-cyan-300" />
                    <p className="text-sm font-semibold text-white">{label}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">{detail}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mx-auto w-full max-w-md lg:mr-0">
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.08] p-2 shadow-2xl shadow-black/20 backdrop-blur-xl">
                <div className="rounded-[1.6rem] border border-white/10 bg-[#0c1a2b]/95 p-7 sm:p-9">
                  <div className="mb-8 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-300">Secure access</p>
                      <h2 className="mt-2 text-2xl font-bold">مرحبًا بك مجددًا</h2>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3 text-slate-300">
                      <Users className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mb-7 text-sm leading-7 text-slate-400">
                    سجّل الدخول للوصول إلى برج التحكم والوحدات التشغيلية والصلاحيات المعتمدة لحسابك.
                  </p>
                  <Button
                    onClick={() => { window.location.href = getLoginUrl(); }}
                    size="lg"
                    className="group h-12 w-full justify-between rounded-xl bg-cyan-300 px-4 text-sm font-bold text-[#07111f] hover:bg-cyan-200"
                  >
                    <span>تسجيل الدخول الآمن</span>
                    <ArrowUpLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1" />
                  </Button>
                  <div className="mt-7 flex items-center gap-3 text-xs text-slate-500">
                    <Separator className="flex-1 bg-white/10" />
                    <span>صلاحيات مؤسسية</span>
                    <Separator className="flex-1 bg-white/10" />
                  </div>
                  <p className="mt-5 text-center text-xs leading-6 text-slate-500">
                    يتم التحكم في الوصول عبر مصادقة NARQA وصلاحيات الدور الوظيفي.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT CONTENT
// ─────────────────────────────────────────────────────────────────────────────

function DashboardLayoutContent({ children, setSidebarWidth }: { children: React.ReactNode; setSidebarWidth: (w: number) => void }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Active item detection
  const activeItem = navGroups.flatMap(g => g.items).find(item =>
    item.path === "/" ? location === "/" : location.startsWith(item.path)
  );

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      // RTL: sidebar is on the right, so we measure from right
      const sidebarEl = sidebarRef.current;
      if (!sidebarEl) return;
      const rect = sidebarEl.getBoundingClientRect();
      const newWidth = rect.right - e.clientX;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      {/* Sidebar */}
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-l border-r-0 bg-sidebar" side="right" disableTransition={isResizing}>
          {/* Header */}
          <SidebarHeader className="h-14 border-b border-sidebar-border">
            <div className="flex items-center gap-2.5 px-2">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-sidebar-accent transition-colors shrink-0 focus:outline-none"
                aria-label="تبديل القائمة الجانبية"
              >
                <PanelLeft className="h-4 w-4 text-sidebar-foreground/60" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary-foreground">N</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-sidebar-foreground truncate leading-none">NARQA EBOS</p>
                    <p className="text-[10px] text-sidebar-foreground/50 truncate mt-0.5">Enterprise OS</p>
                  </div>
                </div>
              )}
            </div>
          </SidebarHeader>

          {/* Navigation */}
          <SidebarContent className="py-2">
            {navGroups.map((group) => (
              <SidebarGroup key={group.label} className="px-2 py-0.5">
                {!isCollapsed && (
                  <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 px-2 mb-0.5">
                    {group.label}
                  </SidebarGroupLabel>
                )}
                <SidebarMenu>
                  {group.items.map((item) => {
                    const isActive = item.path === "/" ? location === "/" : location.startsWith(item.path);
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => setLocation(item.path)}
                          tooltip={item.label}
                          className="h-9 text-sm font-medium"
                        >
                          <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : "text-sidebar-foreground/60"}`} />
                          <span className="truncate">{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroup>
            ))}
          </SidebarContent>

          {/* Footer */}
          <SidebarFooter className="border-t border-sidebar-border p-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-sidebar-accent transition-colors w-full focus:outline-none group-data-[collapsible=icon]:justify-center">
                  <Avatar className="h-8 w-8 shrink-0 border border-sidebar-border">
                    <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground">
                      {user?.name?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0 text-right">
                      <p className="text-xs font-semibold text-sidebar-foreground truncate leading-none">{user?.name ?? "—"}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <RoleBadge role={user?.role} />
                      </div>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="w-52">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation("/profile")} className="cursor-pointer">
                  <User className="ml-2 h-4 w-4" />
                  <span>الملف الشخصي</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="ml-2 h-4 w-4" />
                  <span>تسجيل الخروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Resize handle */}
        {!isCollapsed && (
          <div
            className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors"
            style={{ zIndex: 50 }}
            onMouseDown={() => setIsResizing(true)}
          />
        )}
      </div>

      {/* Main content */}
      <SidebarInset>
        {/* Mobile header */}
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-4 backdrop-blur sticky top-0 z-40">
            <SidebarTrigger className="h-9 w-9 rounded-lg" />
            <span className="text-sm font-medium">{activeItem?.label ?? "NARQA EBOS"}</span>
          </div>
        )}
        {/* Desktop breadcrumb bar */}
        {!isMobile && (
          <div className="flex h-12 items-center border-b px-6 bg-background/80 backdrop-blur sticky top-0 z-30">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">NARQA EBOS</span>
              {activeItem && activeItem.path !== "/" && (
                <>
                  <span>/</span>
                  <span className="text-foreground">{activeItem.label}</span>
                </>
              )}
            </div>
          </div>
        )}
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
