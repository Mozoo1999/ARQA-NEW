import {
  ArrowLeft,
  ArrowUpLeft,
  Check,
  ChevronLeft,
  FileScan,
  Menu,
  Mic,
  Network,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import { useState } from "react";

const operatingFlow = [
  { step: "01", title: "التقاط المصدر", detail: "صوت أو صورة أو مستند يطلبه المستخدم", icon: Mic },
  { step: "02", title: "تكوين مسودة", detail: "حقول واضحة لا تفترض قيمة غير موجودة", icon: FileScan },
  { step: "03", title: "مراجعة الدليل", detail: "ثقة وتعارضات وصلاحية المستخدم ظاهرة", icon: ShieldCheck },
  { step: "04", title: "تنفيذ مقيّد", detail: "موافقة صريحة ثم أثر قابل للتتبع", icon: Network },
];

const workAreas = [
  { title: "إدخال صوتي منضبط", detail: "حوار عربي متعدد الجولات يجمع النواقص قبل المراجعة.", icon: Mic, accent: "bg-cyan-100 text-cyan-800" },
  { title: "تحليل وثائق قابل للفحص", detail: "صور وPDF متعدد الصفحات مع الأدلة والتعارضات.", icon: FileScan, accent: "bg-violet-100 text-violet-800" },
  { title: "طلبات وعمليات مترابطة", detail: "مشاريع وموردون وطلبات شراء ضمن مسار واحد.", icon: ShoppingCart, accent: "bg-amber-100 text-amber-800" },
  { title: "حوكمة دون تعطيل", detail: "الصلاحية والموافقة والأثر محفوظة مع كل إجراء.", icon: ShieldCheck, accent: "bg-emerald-100 text-emerald-800" },
];

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  const openPlatform = () => {
    window.location.assign("/app");
  };

  return (
    <div className="landing-shell min-h-screen overflow-x-hidden bg-[#f6f7f4] text-[#102432]" dir="rtl">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-[#f6f7f4]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1360px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-3 text-right" aria-label="العودة إلى الصفحة الرئيسية">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#102432] text-sm font-black text-cyan-200 shadow-[0_6px_16px_rgba(16,36,50,0.16)]">N</span>
            <span className="leading-tight"><span className="block text-sm font-black tracking-tight">NARQA <span className="font-medium text-slate-500">EBOS</span></span><span className="block text-[9px] font-semibold tracking-[0.14em] text-slate-400">OPERATIONS, IN FLOW</span></span>
          </button>

          <nav className="hidden items-center gap-6 text-sm font-bold text-slate-600 md:flex">
            <button onClick={() => scrollToId("workflow")} className="transition-colors hover:text-cyan-800">مسار العمل</button>
            <button onClick={() => scrollToId("work-areas")} className="transition-colors hover:text-cyan-800">المجالات</button>
            <button onClick={() => scrollToId("governance")} className="transition-colors hover:text-cyan-800">الحوكمة</button>
          </nav>

          <div className="hidden items-center gap-2 sm:flex">
            <button onClick={openPlatform} className="rounded-xl px-3 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200/70">دخول المنصة</button>
            <button onClick={openPlatform} className="group flex items-center gap-2 rounded-xl bg-[#102432] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1a3a4c]">ابدأ العمل <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" /></button>
          </div>

          <button onClick={() => setMenuOpen(value => !value)} className="grid h-10 w-10 place-items-center rounded-xl bg-slate-200/70 text-[#102432] sm:hidden" aria-label="فتح قائمة التنقل">{menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
        {menuOpen ? <div className="border-t border-slate-200 bg-white px-4 py-2 shadow-lg sm:hidden">
          {[['مسار العمل', 'workflow'], ['المجالات', 'work-areas'], ['الحوكمة', 'governance']].map(([label, id]) => <button key={id} onClick={() => { setMenuOpen(false); scrollToId(id); }} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-right text-sm font-bold text-slate-700 hover:bg-slate-50">{label}<ChevronLeft className="h-4 w-4" /></button>)}
          <button onClick={openPlatform} className="mt-1 w-full rounded-xl bg-[#102432] px-4 py-3 text-sm font-bold text-white">دخول المنصة</button>
        </div> : null}
      </header>

      <main>
        <section className="mx-auto max-w-[1360px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(16,36,50,0.07)]">
            <div className="grid lg:grid-cols-[1.16fr_0.84fr]">
              <div className="relative p-7 sm:p-10 lg:p-14">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-cyan-400 via-cyan-300 to-transparent" />
                <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-800"><span className="h-2 w-2 rounded-full bg-emerald-500" />منصة تشغيل عربية بمراجعة بشرية</div>
                <h1 className="mt-7 max-w-3xl text-4xl font-black leading-[1.16] tracking-[-0.04em] text-[#102432] sm:text-5xl lg:text-6xl">اجعل كل إشارة تشغيلية<br /><span className="text-cyan-700">خطوة قابلة للمراجعة.</span></h1>
                <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">NARQA EBOS يجمع المصدر، يوضح ما ينقصه، ثم يضع مسودة منضبطة أمام الشخص المخوّل. لا توجد قفزة من الصوت أو المستند إلى سجل الأعمال دون هوية وصلاحية وموافقة.</p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button onClick={openPlatform} className="group flex h-13 items-center justify-center gap-3 rounded-2xl bg-[#102432] px-6 py-3 text-base font-black text-white shadow-[0_12px_24px_rgba(16,36,50,0.18)] transition-colors hover:bg-[#1a3a4c]">دخول مساحة التشغيل <ArrowLeft className="h-5 w-5 transition-transform duration-200 group-hover:-translate-x-1" /></button>
                  <button onClick={() => scrollToId("workflow")} className="flex h-13 items-center justify-center gap-3 rounded-2xl border border-slate-200 px-6 py-3 text-base font-bold text-slate-700 transition-colors hover:bg-slate-50">كيف يعمل المسار <ChevronLeft className="h-5 w-5" /></button>
                </div>
                <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
                  {[['مصدر واضح', 'صوت، مستند أو إدخال'], ['مراجعة مرئية', 'دليل وثقة وتعارضات'], ['قرار مقيّد', 'دور وموافقة وتدقيق']].map(([title, detail]) => <div key={title} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"><p className="text-sm font-black text-[#102432]">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p></div>)}
                </div>
              </div>

              <aside className="bg-[#102432] p-5 text-white sm:p-8 lg:p-10">
                <div className="flex items-center justify-between border-b border-white/10 pb-5"><div><p className="text-[10px] font-black tracking-[0.16em] text-cyan-200">OPERATION MODEL</p><h2 className="mt-1 text-xl font-black">من المصدر إلى القرار</h2></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-200 text-[#102432]"><Sparkles className="h-5 w-5" /></span></div>
                <div className="mt-7 space-y-3">
                  {operatingFlow.map(({ step, title, detail, icon: Icon }, index) => <div key={step} className="relative flex gap-4 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                    {index < operatingFlow.length - 1 ? <span className="absolute right-7 top-[calc(100%-2px)] h-3 w-px bg-white/15" /> : null}
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-cyan-200"><Icon className="h-4 w-4" /></span>
                    <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="text-sm font-black">{title}</p><span className="font-mono text-[10px] text-slate-500">{step}</span></div><p className="mt-1 text-xs leading-5 text-slate-400">{detail}</p></div>
                  </div>)}
                </div>
                <p className="mt-6 rounded-xl bg-cyan-200/10 px-3 py-3 text-xs leading-6 text-cyan-100"><Check className="ml-1 inline h-4 w-4" />المسارات المعروضة تمثل إجراءات حقيقية داخل المنصة وليست تنفيذًا تلقائياً.</p>
              </aside>
            </div>
          </div>
        </section>

        <section id="work-areas" className="border-y border-slate-200 bg-[#eef1ee] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-[1360px]">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-black tracking-[0.16em] text-cyan-700">START WITH THE WORK</p><h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-[#102432] sm:text-4xl">واجهة تبدأ من العمل الفعلي.</h2></div><p className="max-w-md text-sm leading-7 text-slate-600">تظهر المسارات الأكثر استخداماً أولاً، ثم تترك الحوكمة والتقارير والوحدات الأساسية في متناول يد واحدة.</p></div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {workAreas.map(({ title, detail, icon: Icon, accent }) => <article key={title} className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_8px_22px_rgba(16,36,50,0.04)] transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(16,36,50,0.09)]"><span className={`grid h-11 w-11 place-items-center rounded-2xl ${accent}`}><Icon className="h-5 w-5" /></span><h3 className="mt-8 text-lg font-black text-[#102432]">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p></article>)}
            </div>
          </div>
        </section>

        <section id="workflow" className="mx-auto max-w-[1360px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_12px_36px_rgba(16,36,50,0.04)] lg:grid-cols-[0.7fr_1.3fr] lg:p-10">
            <div><p className="text-xs font-black tracking-[0.16em] text-cyan-700">ONE OPERATING THREAD</p><h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.03em] text-[#102432]">لا تنتقل بين أدوات متفرقة لتصل إلى قرار واحد.</h2></div>
            <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-slate-50 p-5"><Truck className="h-5 w-5 text-cyan-700" /><p className="mt-5 text-sm font-black text-[#102432]">بيانات تشغيلية مترابطة</p><p className="mt-2 text-xs leading-6 text-slate-600">الشركة، المشاريع، الموردون، الطلبات والعمليات ضمن مسار يمكن الرجوع إليه.</p></div><div className="rounded-2xl bg-slate-50 p-5"><ArrowUpLeft className="h-5 w-5 text-cyan-700" /><p className="mt-5 text-sm font-black text-[#102432]">قرارات قابلة للتفسير</p><p className="mt-2 text-xs leading-6 text-slate-600">تظهر المسودة ومصدرها والموثوقية قبل أن يقرر المستخدم المخول التنفيذ.</p></div></div>
          </div>
        </section>

        <section id="governance" className="bg-[#102432] px-4 py-14 text-white sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto grid max-w-[1360px] gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center"><div><p className="text-xs font-black tracking-[0.16em] text-cyan-200">GOVERNANCE BY DEFAULT</p><h2 className="mt-3 max-w-2xl text-3xl font-black leading-tight tracking-[-0.03em] sm:text-4xl">السرعة مفيدة فقط عندما تبقى قابلة للمراجعة.</h2><p className="mt-5 max-w-xl text-base leading-8 text-slate-300">يربط NARQA EBOS المستخدم وقناة الإدخال ووقت القرار والنتيجة بسجل التدقيق. ويبقى الذكاء الاصطناعي مساعداً للمراجعة، لا بديلاً عن الموافقة.</p></div><div className="grid gap-3 sm:grid-cols-2">{["مصادقة خادمية", "أدوار وصلاحيات", "موافقة صريحة", "أثر قابل للتتبع"].map(item => <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-4 text-sm font-bold text-cyan-50"><Check className="ml-2 inline h-4 w-4 text-cyan-200" />{item}</div>)}</div></div>
        </section>

        <section className="mx-auto max-w-[1360px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20"><div className="flex flex-col justify-between gap-6 rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_12px_32px_rgba(16,36,50,0.05)] sm:p-10 lg:flex-row lg:items-center"><div><p className="text-xs font-black tracking-[0.16em] text-cyan-700">NARQA EBOS</p><h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-[#102432]">ابدأ من مسار تشغيلي واضح.</h2><p className="mt-2 text-sm text-slate-600">سجّل الدخول للوصول إلى مساحة العمل والوحدات التي يسمح بها دورك.</p></div><button onClick={openPlatform} className="group flex h-13 items-center justify-center gap-3 rounded-2xl bg-[#102432] px-6 py-3 text-base font-black text-white transition-colors hover:bg-[#1a3a4c]">الدخول الآمن للمنصة <ArrowUpLeft className="h-5 w-5 transition-transform duration-200 group-hover:-translate-x-1 group-hover:-translate-y-1" /></button></div></section>
      </main>

      <footer className="border-t border-slate-200 bg-[#eef1ee] px-4 py-6 text-xs text-slate-500 sm:px-6 lg:px-8"><div className="mx-auto flex max-w-[1360px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><p>© 2026 NARQA EBOS · Enterprise Business Operating System</p><p>منصة تشغيل مؤسسية — المراجعة قبل التنفيذ.</p></div></footer>
    </div>
  );
}
