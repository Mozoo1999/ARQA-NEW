import { createRoot } from "react-dom/client";
import LandingPage from "./pages/LandingPage";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("NARQA root element is missing.");
const root: HTMLElement = rootElement;

function mountPublicEntry() {
  createRoot(root).render(<LandingPage />);
}

function mountAuthenticatedPlatform() {
  root.innerHTML = "<main dir=\"rtl\" role=\"status\" aria-live=\"polite\" style=\"min-height:100vh;display:grid;place-items:center;background:#f6f7f4;color:#102432;font-family:IBM Plex Sans Arabic,system-ui,sans-serif;padding:1.5rem\"><section style=\"width:min(100%,28rem);border:1px solid #e2e8f0;border-radius:1.5rem;background:#fff;padding:2rem;box-shadow:0 18px 48px rgba(16,36,50,.08);text-align:right\"><div style=\"width:2.5rem;height:2.5rem;border:3px solid #dff9fb;border-top-color:#0f8aa1;border-radius:999px;animation:narqa-spin 700ms linear infinite\"></div><p style=\"margin:1.25rem 0 .25rem;font-size:1.05rem;font-weight:800\">يتم تجهيز مساحة التشغيل</p><p style=\"margin:0;color:#64748b;font-size:.9rem;line-height:1.7\">يتم تحميل الوحدات والصلاحيات المعتمدة لحسابك.</p></section><style>@keyframes narqa-spin{to{transform:rotate(360deg)}}</style></main>";
  import("./platform").then(({ mountPlatform }) => mountPlatform(root)).catch(error => {
    console.error("[Platform bootstrap failed]", error);
    root.innerHTML = "<main dir=\"rtl\" style=\"padding:2rem;font-family:system-ui\"><h1>تعذر فتح مساحة التشغيل</h1><p>أعد المحاولة. إذا استمر الخطأ، راجع اتصالك أو سجّل الدخول مجدداً.</p></main>";
  });
}

if (window.location.pathname === "/" || window.location.pathname === "") {
  mountPublicEntry();
} else {
  mountAuthenticatedPlatform();
}
