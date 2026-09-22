import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  ArrowLeft,
  ArrowUpLeft,
  BadgeCheck,
  BrainCircuit,
  Check,
  ChevronLeft,
  FileScan,
  Menu,
  Mic,
  Network,
  Play,
  ShieldCheck,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const HERO_IMAGE = "/manus-storage/narqa-command-center-hero_373be1e8.jpg";
const EVIDENCE_IMAGE = "/manus-storage/narqa-operational-evidence_d8bb7329.jpg";

const capabilityCards = [
  {
    number: "01",
    icon: Mic,
    eyebrow: "لغة التشغيل",
    title: "أوامر تتحدث بلغتك",
    detail: "جلسة عربية تسأل عن الحقول الناقصة، تعرض الملخص، ولا تنفّذ أي تغيير قبل المصادقة والموافقة الصريحة.",
    accent: "from-cyan-300 to-blue-500",
  },
  {
    number: "02",
    icon: FileScan,
    eyebrow: "دليل قابل للمراجعة",
    title: "المستند ليس مجرد ملف",
    detail: "تحليل مرئي منظم للصور وPDF متعدد الصفحات، مع أدلة وثقة وتعارضات واضحة للمراجعة البشرية.",
    accent: "from-violet-300 to-fuchsia-500",
  },
  {
    number: "03",
    icon: ShieldCheck,
    eyebrow: "حوكمة أصلية",
    title: "كل إدراج له أثر",
    detail: "صلاحية الدور، المستخدم، القناة، التاريخ ونتيجة الموافقة محفوظة ضمن مسار تشغيلي قابل للتتبع.",
    accent: "from-emerald-300 to-teal-500",
  },
];

const operatingSteps = [
  { label: "التقاط", detail: "صوت · صورة · مستند", icon: Mic },
  { label: "فهم", detail: "استخراج منظم", icon: BrainCircuit },
  { label: "مراجعة", detail: "أدلة وتعارضات", icon: BadgeCheck },
  { label: "تنفيذ", detail: "اعتماد وصلاحية", icon: Truck },
];

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const openPlatform = () => {
    if (isAuthenticated) {
      setLocation("/app");
      return;
    }
    window.location.href = getLoginUrl();
  };

  return (
    <div className="landing-shell min-h-screen overflow-x-hidden bg-[#f4f5f1] text-[#12202d]" dir="rtl">
      <header className="landing-nav fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 lg:px-10">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between rounded-2xl border border-white/60 bg-[#f7f8f5]/85 px-4 shadow-[0_12px_40px_rgba(16,31,44,0.06)] backdrop-blur-xl sm:px-5">
          <button onClick={() => setLocation("/")} className="group flex items-center gap-3 text-right" aria-label="العودة إلى الصفحة الرئيسية">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#102432] text-sm font-black text-cyan-200 shadow-[0_8px_18px_rgba(16,36,50,0.22)] transition-transform duration-200 group-hover:-rotate-6">
              N
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-black tracking-tight text-[#102432]">NARQA <span className="font-medium text-slate-500">EBOS</span></span>
              <span className="block text-[9px] font-semibold tracking-[0.16em] text-slate-400">OPERATIONS, IN FLOW</span>
            </span>
          </button>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 lg:flex">
            <button onClick={() => scrollToId("system")} className="transition-colors hover:text-[#102432]">كيف يعمل النظام</button>
            <button onClick={() => scrollToId("capabilities")} className="transition-colors hover:text-[#102432]">القدرات</button>
            <button onClick={() => scrollToId("governance")} className="transition-colors hover:text-[#102432]">الحوكمة</button>
          </nav>

          <div className="hidden items-center gap-2 sm:flex">
            <button onClick={openPlatform} className="rounded-xl px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100">
              دخول المنصة
            </button>
            <button onClick={openPlatform} className="group flex items-center gap-2 rounded-xl bg-[#102432] px-4 py-2.5 text-sm font-bold text-white shadow-[0_9px_20px_rgba(16,36,50,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#173748]">
              ابدأ مساحة التشغيل <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            </button>
          </div>

          <button onClick={() => setMenuOpen(value => !value)} className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-[#102432] sm:hidden" aria-label="فتح قائمة التنقل">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen ? (
          <div className="mx-auto mt-2 max-w-[1440px] rounded-2xl border border-white/60 bg-white/95 p-2 shadow-xl backdrop-blur-xl sm:hidden">
            {[['كيف يعمل النظام', 'system'], ['القدرات', 'capabilities'], ['الحوكمة', 'governance']].map(([label, id]) => (
              <button key={id} onClick={() => { setMenuOpen(false); scrollToId(id); }} className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-right text-sm font-bold text-slate-700 hover:bg-slate-100">
                {label}<ChevronLeft className="h-4 w-4" />
              </button>
            ))}
            <button onClick={openPlatform} className="mt-1 w-full rounded-xl bg-[#102432] px-4 py-3 text-sm font-bold text-white">دخول المنصة</button>
          </div>
        ) : null}
      </header>

      <main>
        <section className="relative isolate min-h-[840px] overflow-hidden bg-[#0d1d29] px-4 pb-14 pt-32 text-white sm:px-7 lg:min-h-[790px] lg:px-12 lg:pt-40">
          <div className="landing-grid pointer-events-none absolute inset-0 opacity-70" />
          <div className="pointer-events-none absolute -right-28 top-12 h-[30rem] w-[30rem] rounded-full bg-cyan-400/15 blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-32 left-[20%] h-[26rem] w-[26rem] rounded-full bg-blue-500/15 blur-[100px]" />
          {HERO_IMAGE ? <div className="absolute inset-y-0 left-0 w-full opacity-55 lg:w-[58%]" style={{ backgroundImage: `linear-gradient(90deg, rgba(13,29,41,0) 0%, rgba(13,29,41,0.22) 42%, rgba(13,29,41,0.98) 100%), url(${HERO_IMAGE})`, backgroundSize: "cover", backgroundPosition: "center left" }} /> : null}
          <div className="relative mx-auto max-w-[1370px]">
            <div className="grid items-end gap-12 lg:grid-cols-[1fr_0.86fr] lg:gap-20">
              <div className="max-w-3xl text-right">
                <div className="landing-reveal inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-cyan-100 backdrop-blur-md">
                  <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-200" /></span>
                  منصة تشغيل مؤسسية عربية، تحفظ الدليل قبل القرار
                </div>
                <h1 className="landing-reveal mt-7 max-w-4xl text-5xl font-black leading-[1.06] tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl xl:text-[5.3rem]">
                  لا تترك العمل <span className="text-cyan-200">يتبعثر</span><br />بين المحادثة والملف والقرار.
                </h1>
                <p className="landing-reveal mt-7 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg sm:leading-9">
                  NARQA EBOS مساحة تشغيل واحدة تحوّل الإشارات اليومية إلى مسودات منظّمة، وتربط المراجعة البشرية بالتنفيذ المصرّح به.
                </p>
                <div className="landing-reveal mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button onClick={openPlatform} className="group flex h-14 items-center justify-center gap-3 rounded-2xl bg-cyan-200 px-6 text-base font-black text-[#102432] shadow-[0_14px_32px_rgba(111,238,248,0.2)] transition-all duration-200 hover:-translate-y-1 hover:bg-white">
                    افتح مساحة التشغيل <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                  </button>
                  <button onClick={() => scrollToId("system")} className="group flex h-14 items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/[0.05] px-6 text-base font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/10">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10"><Play className="mr-0.5 h-3 w-3 fill-current" /></span>
                    تعرّف على المسار
                  </button>
                </div>
              </div>

              <div className="landing-reveal relative mx-auto w-full max-w-[500px] lg:ml-0">
                <div className="absolute -inset-10 rounded-[3rem] bg-cyan-400/10 blur-3xl" />
                <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-[#132b3a]/75 p-3 shadow-2xl shadow-black/30 backdrop-blur-xl">
                  <div className="rounded-[1.55rem] border border-white/10 bg-[#0f222e]/95 p-5 sm:p-6">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <div className="flex items-center gap-2 text-xs text-slate-400"><span className="h-2 w-2 rounded-full bg-emerald-300" />جلسة تشغيل حية</div>
                      <div className="rounded-lg bg-white/5 px-2 py-1 font-mono text-[10px] tracking-wider text-cyan-200">NQ · 024</div>
                    </div>
                    <div className="mt-6 flex items-start gap-4">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-200 text-[#102432]"><Mic className="h-5 w-5" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-cyan-200">أمر صوتي</p>
                        <p className="mt-1 text-sm font-semibold leading-6 text-white">إضافة حمولة للسيارة</p>
                        <p className="mt-2 text-xs leading-5 text-slate-400">يطلب النظام العميل واللوحة والخامة والكمية قبل إنشاء المسودة.</p>
                      </div>
                    </div>
                    <div className="mt-5 space-y-2.5">
                      {[['العميل', 'شركة العمران'], ['السيارة', 'د س م 4382'], ['الحالة', 'جاهزة للمراجعة']].map(([label, value], index) => (
                        <div key={label} className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-2.5">
                          <span className="text-xs text-slate-400">{label}</span>
                          <span className={`text-xs font-bold ${index === 2 ? "text-emerald-200" : "text-slate-100"}`}>{value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 flex items-center gap-2 rounded-xl bg-cyan-200/10 px-3 py-3 text-xs leading-5 text-cyan-100">
                      <Check className="h-4 w-4 shrink-0" />لا يتم الإدراج إلا بعد الموافقة وصلاحية الدور.
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-5 -right-5 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-xs font-bold text-white shadow-xl backdrop-blur-xl">صوت · مستند · مراجعة</div>
              </div>
            </div>

            <div className="landing-reveal mt-16 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3 lg:mt-20">
              {[['إدخال مسؤول', 'لا تنفيذ محلي بلا جلسة وهوية'], ['تحليل مرئي', 'كل صفحة PDF دليل قابل للفحص'], ['أثر قابل للتتبع', 'المستخدم والقناة والقرار محفوظة']].map(([title, detail]) => (
                <div key={title} className="bg-[#102432]/70 px-5 py-5 backdrop-blur-sm sm:px-6">
                  <p className="text-sm font-black text-white">{title}</p>
                  <p className="mt-1.5 text-xs leading-5 text-slate-400">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="system" className="scroll-mt-24 bg-[#f4f5f1] px-4 py-20 sm:px-7 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-[1370px]">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end lg:gap-20">
              <div>
                <p className="text-xs font-black tracking-[0.18em] text-[#0e8ca5]">OPERATING MODEL</p>
                <h2 className="mt-4 max-w-lg text-4xl font-black leading-tight tracking-[-0.035em] text-[#102432] sm:text-5xl">مسار واحد،<br />لكن كل قرار في مكانه الصحيح.</h2>
              </div>
              <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">بدلاً من نقل المعلومات يدوياً بين التطبيقات، يجمع NARQA المصدر ويُنظمه، ثم يضعه أمام الشخص المخوّل للمراجعة والاعتماد.</p>
            </div>

            <div className="mt-12 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {operatingSteps.map(({ label, detail, icon: Icon }, index) => (
                <div key={label} className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(16,36,50,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(16,36,50,0.10)]">
                  <span className="font-mono text-xs font-bold text-slate-300">0{index + 1}</span>
                  <div className="mt-10 flex items-end justify-between">
                    <div><p className="text-xl font-black text-[#102432]">{label}</p><p className="mt-1 text-xs font-medium text-slate-500">{detail}</p></div>
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#eaf4f4] text-[#0e8ca5] transition-transform duration-300 group-hover:rotate-6"><Icon className="h-5 w-5" /></span>
                  </div>
                  {index < operatingSteps.length - 1 ? <ChevronLeft className="absolute -left-2 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-slate-300 lg:block" /> : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="capabilities" className="scroll-mt-24 bg-[#e8ece8] px-4 py-20 sm:px-7 lg:px-12 lg:py-28">
          <div className="mx-auto grid max-w-[1370px] gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div>
              <p className="text-xs font-black tracking-[0.18em] text-[#0e8ca5]">BUILT FOR REAL OPERATIONS</p>
              <h2 className="mt-4 max-w-2xl text-4xl font-black leading-tight tracking-[-0.035em] text-[#102432] sm:text-5xl">مرونة في الإدخال،<br />صرامة في التنفيذ.</h2>
              <div className="mt-10 space-y-3">
                {capabilityCards.map(({ number, icon: Icon, eyebrow, title, detail, accent }) => (
                  <article key={title} className="group rounded-3xl border border-slate-200/80 bg-white p-5 transition-all duration-300 hover:-translate-x-1 hover:shadow-[0_18px_40px_rgba(16,36,50,0.09)] sm:p-6">
                    <div className="flex gap-4">
                      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${accent} text-[#102432]`}><Icon className="h-5 w-5" /></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-4"><p className="text-[10px] font-black tracking-[0.14em] text-slate-400">{eyebrow}</p><span className="font-mono text-xs font-bold text-slate-300">{number}</span></div>
                        <h3 className="mt-1 text-xl font-black text-[#102432]">{title}</h3>
                        <p className="mt-2 max-w-xl text-sm leading-7 text-slate-600">{detail}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <div className="relative min-h-[500px] overflow-hidden rounded-[2.5rem] bg-[#102432] p-6 text-white shadow-[0_30px_70px_rgba(16,36,50,0.18)] sm:p-9">
              {EVIDENCE_IMAGE ? <div className="absolute inset-0 opacity-30" style={{ backgroundImage: `linear-gradient(180deg, rgba(16,36,50,0.08), rgba(16,36,50,0.94)), url(${EVIDENCE_IMAGE})`, backgroundSize: "cover", backgroundPosition: "center" }} /> : null}
              <div className="relative flex h-full flex-col justify-between">
                <div>
                  <span className="inline-flex rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-cyan-100">مراجعة بشرية إلزامية</span>
                  <h3 className="mt-6 max-w-sm text-3xl font-black leading-tight tracking-[-0.03em]">الذكاء الاصطناعي يوضّح الدليل. الإنسان يملك القرار.</h3>
                </div>
                <div className="space-y-3">
                  {["يعرض المصدر والصفحة والثقة لكل قيمة", "يحفظ التعارضات والصفحات غير المقروءة", "يمنع الإدراج قبل الاعتماد المصرّح"].map(item => (
                    <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-slate-100 backdrop-blur-sm"><span className="grid h-6 w-6 place-items-center rounded-full bg-cyan-200 text-[#102432]"><Check className="h-3.5 w-3.5 stroke-[3]" /></span>{item}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="governance" className="scroll-mt-24 bg-[#102432] px-4 py-20 text-white sm:px-7 lg:px-12 lg:py-28">
          <div className="mx-auto grid max-w-[1370px] gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-xs font-black tracking-[0.18em] text-cyan-200">GOVERNANCE BY DESIGN</p>
              <h2 className="mt-4 max-w-2xl text-4xl font-black leading-tight tracking-[-0.035em] sm:text-5xl">سرعة لا تتجاوز الصلاحيات.</h2>
              <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">كل مسودة تمر بدورة واضحة: جمع، مراجعة، تأكيد أو رفض. لا توجد عمليات تجارية خفية أو إدخال بلا هوية.</p>
              <div className="mt-8 flex flex-wrap gap-2.5">{["مصادقة خادمية", "صلاحيات أدوار", "موافقة صريحة", "سجل تدقيق"].map(item => <span key={item} className="rounded-full border border-white/15 bg-white/[0.05] px-4 py-2 text-sm font-bold text-slate-100">{item}</span>)}</div>
            </div>
            <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.05] p-5 backdrop-blur-md sm:p-7">
              <div className="flex items-center justify-between border-b border-white/10 pb-5"><span className="text-sm font-black">تسلسل قرار محفوظ</span><Network className="h-5 w-5 text-cyan-200" /></div>
              <div className="mt-6 space-y-3">
                {[['01', 'جلسة مصادق عليها', 'ربط المستخدم وقناة الإدخال'], ['02', 'مسودة واضحة', 'الحقول والأدلة والملخص'], ['03', 'اعتماد صريح', 'تأكيد أو رفض قابل للتدقيق'], ['04', 'تنفيذ مقيّد', 'فقط ضمن الدور والسياسة']].map(([step, title, detail], index) => (
                  <div key={step} className="flex gap-4 rounded-2xl bg-[#0b1a24] p-4"><span className="font-mono text-xs font-bold text-cyan-200">{step}</span><div><p className="text-sm font-black">{title}</p><p className="mt-1 text-xs text-slate-400">{detail}</p></div>{index < 3 ? <span className="mr-auto text-slate-600">↓</span> : null}</div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f4f5f1] px-4 py-16 sm:px-7 lg:px-12 lg:py-20">
          <div className="mx-auto flex max-w-[1370px] flex-col justify-between gap-8 rounded-[2rem] border border-slate-200 bg-white px-6 py-8 shadow-[0_14px_36px_rgba(16,36,50,0.06)] sm:px-9 sm:py-10 lg:flex-row lg:items-center">
            <div><p className="text-xs font-black tracking-[0.16em] text-[#0e8ca5]">NARQA EBOS</p><h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-[#102432]">جاهز لفتح مساحة التشغيل؟</h2></div>
            <button onClick={openPlatform} className="group flex h-14 items-center justify-center gap-3 rounded-2xl bg-[#102432] px-6 text-base font-black text-white shadow-[0_12px_24px_rgba(16,36,50,0.20)] transition-all duration-200 hover:-translate-y-1 hover:bg-[#173748]">الدخول الآمن للمنصة <ArrowUpLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1" /></button>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-[#edf0ed] px-4 py-7 sm:px-7 lg:px-12">
        <div className="mx-auto flex max-w-[1370px] flex-col gap-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><p>© 2026 NARQA EBOS · Enterprise Business Operating System</p><p>منصة تشغيل مؤسسية — المراجعة قبل التنفيذ.</p></div>
      </footer>
    </div>
  );
}
