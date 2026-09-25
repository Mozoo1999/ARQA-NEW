import { createRoot } from "react-dom/client";
import LandingPage from "./pages/LandingPage";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("NARQA root element is missing.");
const root: HTMLElement = rootElement;

function mountPublicEntry() {
  createRoot(root).render(<LandingPage />);
}

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function renderWorkspaceBootstrap() {
  root.innerHTML = `
    <main class="workspace-boot" dir="rtl" role="status" aria-live="polite" aria-label="يتم تجهيز مساحة التشغيل">
      <span class="workspace-boot__ambient workspace-boot__ambient--one" aria-hidden="true"></span>
      <span class="workspace-boot__ambient workspace-boot__ambient--two" aria-hidden="true"></span>
      <section class="workspace-boot__card">
        <div class="workspace-boot__identity">
          <span class="workspace-boot__mark" aria-hidden="true">N</span>
          <span><strong>NARQA EBOS</strong><small>OPERATIONS, IN FLOW</small></span>
        </div>
        <div class="workspace-boot__progress" aria-hidden="true"><span></span></div>
        <p class="workspace-boot__eyebrow">مساحة تشغيل محمية</p>
        <h1>يتم تجهيز مساحة العمل</h1>
        <p class="workspace-boot__copy">يتم تحميل الصلاحيات والوحدات التشغيلية المعتمدة لحسابك بأمان.</p>
        <div class="workspace-boot__stages" aria-hidden="true">
          <span><i></i>التحقق من الجلسة</span>
          <span><i></i>تجهيز مساحة العمل</span>
          <span><i></i>عرض المسارات المسموح بها</span>
        </div>
      </section>
    </main>
  `;
}

function renderWorkspaceError(error: unknown) {
  console.error("[Platform bootstrap failed]", error);
  root.innerHTML = `
    <main class="workspace-boot workspace-boot--error" dir="rtl" role="alert">
      <section class="workspace-boot__card">
        <div class="workspace-boot__identity"><span class="workspace-boot__mark" aria-hidden="true">N</span><strong>NARQA EBOS</strong></div>
        <p class="workspace-boot__eyebrow">تعذر فتح مساحة التشغيل</p>
        <h1>لم يكتمل تحميل مساحة العمل</h1>
        <p class="workspace-boot__copy">أعد المحاولة. إذا استمر الخطأ، تحقق من اتصالك أو سجّل الدخول مجدداً.</p>
        <button class="workspace-boot__retry" type="button" onclick="window.location.reload()">إعادة المحاولة</button>
      </section>
    </main>
  `;
}

async function mountAuthenticatedPlatform() {
  renderWorkspaceBootstrap();

  try {
    const { mountPlatform } = await import("./platform");
    const bootScreen = root.querySelector<HTMLElement>(".workspace-boot");
    bootScreen?.classList.add("is-leaving");

    window.setTimeout(
      () => mountPlatform(root),
      prefersReducedMotion() ? 0 : 180,
    );
  } catch (error) {
    renderWorkspaceError(error);
  }
}

if (window.location.pathname === "/" || window.location.pathname === "") {
  mountPublicEntry();
} else {
  void mountAuthenticatedPlatform();
}
