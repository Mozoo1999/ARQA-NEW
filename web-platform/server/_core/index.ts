import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { registerMobileRoutes } from "../mobileRoutes";
import { createContext } from "./context";
import * as db from "../db";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerMobileRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Financial Intake Export Endpoints (Excel/CSV & HTML/PDF Report)
  app.get("/api/reports/approved-drafts.csv", async (req, res) => {
    try {
      const { startDate, endDate, month } = req.query;
      let drafts = await db.getSmartIntakeDrafts("approved");
      if (startDate) {
        drafts = drafts.filter((d: any) => !d.documentDate || d.documentDate >= String(startDate));
      }
      if (endDate) {
        drafts = drafts.filter((d: any) => !d.documentDate || d.documentDate <= String(endDate));
      }
      if (month) {
        drafts = drafts.filter((d: any) => d.documentDate && d.documentDate.startsWith(String(month)));
      }
      let csv = "\uFEFFمعرف المسودة,نوع المصدر,العنوان,النية,المورد,المبلغ,العملة,التاريخ,رقم المرجع,الرقم الضريبي,الحالة\n";
      for (const d of drafts) {
        csv += `"${d.id}","${d.sourceType}","${d.title}","${d.intent}","${d.vendorName || ""}","${d.amount || 0}","${d.currency || "EGP"}","${d.documentDate || ""}","${d.referenceNo || ""}","${d.taxNo || ""}","${d.status}"\n`;
      }
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="arqa-approved-financial-drafts.csv"');
      res.send(csv);
    } catch (err: any) {
      res.status(500).send(`Export error: ${err.message}`);
    }
  });

  app.get("/api/reports/approved-drafts.pdf", async (req, res) => {
    try {
      const { startDate, endDate, month } = req.query;
      let drafts = await db.getSmartIntakeDrafts("approved");
      if (startDate) {
        drafts = drafts.filter((d: any) => !d.documentDate || d.documentDate >= String(startDate));
      }
      if (endDate) {
        drafts = drafts.filter((d: any) => !d.documentDate || d.documentDate <= String(endDate));
      }
      if (month) {
        drafts = drafts.filter((d: any) => !d.documentDate || d.documentDate.startsWith(String(month)));
      }
      const totalAmount = drafts.reduce((sum, d) => sum + Number(d.amount || 0), 0);
      let html = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <title>تقرير المسودات المالية المعتمدة - ARQA EBOS</title>
          <style>
            body { font-family: Tahoma, Arial, sans-serif; padding: 30px; color: #111; direction: rtl; background: #fff; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border: none; }
            .header-table td { border: none; padding: 0; vertical-align: middle; }
            .logo-box { width: 60px; height: 60px; background: #0B1220; color: #D6A756; font-weight: bold; font-size: 24px; text-align: center; line-height: 60px; border-radius: 8px; }
            .org-title { font-size: 18px; font-weight: bold; color: #0B1220; margin: 0; }
            .org-sub { font-size: 11px; color: #666; margin-top: 2px; }
            .report-title { font-size: 16px; font-weight: bold; color: #0B1220; border-bottom: 2px solid #D6A756; padding-bottom: 8px; margin-top: 15px; }
            .meta { font-size: 11px; color: #555; margin: 15px 0; background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0; }
            table.data-table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
            table.data-table th, table.data-table td { border: 1px solid #cbd5e1; padding: 8px; text-align: right; }
            table.data-table th { background-color: #0B1220; color: #fff; }
            .total { margin-top: 15px; font-weight: bold; font-size: 13px; text-align: left; background: #f1f5f9; padding: 10px; border-radius: 6px; }
            .signature-section { margin-top: 40px; width: 100%; border-collapse: collapse; border: none; page-break-inside: avoid; }
            .signature-section td { border: none; width: 50%; vertical-align: top; padding: 10px; }
            .sig-box { border-top: 1px dashed #94a3b8; padding-top: 8px; text-align: center; font-size: 12px; color: #334155; }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td style="width: 70px;">
                <div class="logo-box">AQ</div>
              </td>
              <td>
                <div class="org-title">مجموعة المؤسسة الهندسية (ARQA EBOS)</div>
                <div class="org-sub">نظام التشغيل المؤسسي المتكامل · تقارير المعاملات والمسودات المالية المعتمدة</div>
              </td>
              <td style="text-align: left; font-size: 11px; color: #555;">
                تاريخ الإصدار: ${new Date().toLocaleDateString("ar-EG")}<br/>
                الحالة: <strong>معتمد رسمياً</strong>
              </td>
            </tr>
          </table>

          <div class="report-title">تقرير المسودات والمدخلات المالية المعتمدة</div>
          <div class="meta">
            النطاق المفلتر: ${startDate || endDate ? `من ${startDate || 'البداية'} إلى ${endDate || 'النهاية'}` : month ? `شهر ${month}` : 'جميع الفترات'} | إجمالي المعاملات: ${drafts.length} مستند
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>المعرف</th>
                <th>المصدر</th>
                <th>العنوان / المورد</th>
                <th>المبلغ (EGP)</th>
                <th>التاريخ</th>
                <th>رقم المرجع</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
      `;
      for (const d of drafts) {
        html += `
          <tr>
            <td>#${d.id}</td>
            <td>${d.sourceType}</td>
            <td>${d.title} (${d.vendorName || "—"})</td>
            <td>${Number(d.amount || 0).toLocaleString("en-US")}</td>
            <td>${d.documentDate || "—"}</td>
            <td>${d.referenceNo || "—"}</td>
            <td>${d.status}</td>
          </tr>
        `;
      }
      html += `
            </tbody>
          </table>
          <div class="total">إجمالي المبالغ المعتمدة والمطابقة: ${totalAmount.toLocaleString("en-US")} EGP</div>

          <table class="signature-section">
            <tr>
              <td>
                <div class="sig-box">
                  <strong>إعداد المراجعة والتدقيق</strong><br/><br/><br/>
                  التوقيع: ........................................<br/>
                  التاريخ: ${new Date().toLocaleDateString("ar-EG")}
                </div>
              </td>
              <td>
                <div class="sig-box">
                  <strong>اعتماد المدير المالي (CFO)</strong><br/><br/><br/>
                  التوقيع والخاتم: ........................................<br/>
                  التاريخ: ${new Date().toLocaleDateString("ar-EG")}
                </div>
              </td>
            </tr>
          </table>

          <script>window.print();</script>
        </body>
        </html>
      `;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    } catch (err: any) {
      res.status(500).send(`PDF Report error: ${err.message}`);
    }
  });
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
