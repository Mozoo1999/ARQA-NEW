import { describe, expect, it, vi } from "vitest";
import { analyzeEveryPdfPage, MAX_PDF_VISUAL_PAGES } from "./documentPdfPipeline";

describe("every-page PDF visual pipeline", () => {
  it("prepares and analyzes every rendered page in deterministic order", async () => {
    const analyzePage = vi.fn(async ({ pageNumber }: { pageNumber: number }) => ({ pageNumber, status: "readable" as const, documentType: "vehicle_load", fields: [{ key: "referenceNo" as const, value: `REF-${pageNumber}`, evidence: `مرجع ${pageNumber}`, confidence: 0.9 }], evidence: [`مرجع ${pageNumber}`], confidence: 0.9, warnings: [] }));
    const progress: string[] = [];
    const result = await analyzeEveryPdfPage({ uri: "file.pdf", fileName: "file.pdf", renderPdf: async () => ({ outputFiles: ["p1", "p2", "p3"] }), preparePage: async uri => `${uri}-prepared`, analyzePage, onProgress: event => progress.push(`${event.pageNumber}:${event.status}`) });
    expect(analyzePage).toHaveBeenCalledTimes(3);
    expect(result.preparedUris).toEqual(["p1-prepared", "p2-prepared", "p3-prepared"]);
    expect(result.pages.map(page => page.pageNumber)).toEqual([1, 2, 3]);
    expect(progress).toEqual(["1:preparing", "1:analyzing", "1:completed", "2:preparing", "2:analyzing", "2:completed", "3:preparing", "3:analyzing", "3:completed"]);
  });

  it("fails explicitly rather than silently truncating an oversized PDF", async () => {
    const outputFiles = Array.from({ length: MAX_PDF_VISUAL_PAGES + 1 }, (_, index) => `p${index + 1}`);
    await expect(analyzeEveryPdfPage({ uri: "large.pdf", fileName: "large.pdf", renderPdf: async () => ({ outputFiles }), preparePage: async uri => uri, analyzePage: vi.fn() })).rejects.toThrow("قسّم الملف");
  });

  it("fails when rendering produces no pages", async () => {
    await expect(analyzeEveryPdfPage({ uri: "empty.pdf", fileName: "empty.pdf", renderPdf: async () => ({ outputFiles: [] }), preparePage: async uri => uri, analyzePage: vi.fn() })).rejects.toThrow("تعذر تحويل صفحات PDF");
  });
});
