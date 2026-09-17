import { mergeDocumentPageAnalyses, type DocumentPageAnalysis, type MergedDocumentAnalysis } from "../../../packages/document-intelligence/src/page-analysis";

export const MAX_PDF_VISUAL_PAGES = 25;

export interface PdfPageProgress {
  pageNumber: number;
  totalPages: number;
  status: "preparing" | "analyzing" | "completed";
}

export async function analyzeEveryPdfPage(input: {
  uri: string;
  fileName: string;
  renderPdf: (uri: string) => Promise<{ outputFiles?: string[] }>;
  preparePage: (uri: string) => Promise<string>;
  analyzePage: (page: { pageNumber: number; totalPages: number; preparedUri: string; fileName: string }) => Promise<DocumentPageAnalysis>;
  onProgress?: (progress: PdfPageProgress) => void;
}): Promise<{ preparedUris: string[]; pages: DocumentPageAnalysis[]; merged: MergedDocumentAnalysis }> {
  const rendered = await input.renderPdf(input.uri);
  const outputFiles = rendered.outputFiles ?? [];
  if (!outputFiles.length) throw new Error("تعذر تحويل صفحات PDF إلى صور. تحقق من أن الملف صالح وغير محمي.");
  if (outputFiles.length > MAX_PDF_VISUAL_PAGES) throw new Error(`يحتوي الملف على ${outputFiles.length} صفحة. الحد الآمن للتحليل المرئي هو ${MAX_PDF_VISUAL_PAGES} صفحة لكل ملف؛ قسّم الملف ثم أعد المحاولة.`);

  const preparedUris: string[] = [];
  const pages: DocumentPageAnalysis[] = [];
  for (let index = 0; index < outputFiles.length; index += 1) {
    const pageNumber = index + 1;
    input.onProgress?.({ pageNumber, totalPages: outputFiles.length, status: "preparing" });
    const preparedUri = await input.preparePage(outputFiles[index]);
    preparedUris.push(preparedUri);
    input.onProgress?.({ pageNumber, totalPages: outputFiles.length, status: "analyzing" });
    pages.push(await input.analyzePage({ pageNumber, totalPages: outputFiles.length, preparedUri, fileName: input.fileName }));
    input.onProgress?.({ pageNumber, totalPages: outputFiles.length, status: "completed" });
  }
  return { preparedUris, pages, merged: mergeDocumentPageAnalyses(pages) };
}
