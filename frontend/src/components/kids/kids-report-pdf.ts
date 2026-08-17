"use client";

import { buildPageSlices, type ReportSectionBoundary } from "@/components/kids/kids-report-pagination";

export type GeneratedReportAssets = {
  pageImages: string[];
  pdfBlob: Blob;
};

const PDF_PAGE_WIDTH_MM = 210;
const PDF_PAGE_HEIGHT_MM = 297;
const PDF_MARGIN_X_MM = 8;
const PDF_MARGIN_TOP_MM = 9;
const PDF_MARGIN_BOTTOM_MM = 9;
const PDF_RENDER_EPSILON_MM = 0.2;

export function getKidsReportPdfMetrics(canvasWidth: number, sliceHeight: number) {
  const pageWidthMm = PDF_PAGE_WIDTH_MM;
  const pageHeightMm = PDF_PAGE_HEIGHT_MM;
  const offsetXMm = PDF_MARGIN_X_MM;
  const offsetYMm = PDF_MARGIN_TOP_MM;
  const contentWidthMm = pageWidthMm - offsetXMm * 2;
  const contentHeightMm = pageHeightMm - PDF_MARGIN_TOP_MM - PDF_MARGIN_BOTTOM_MM;
  const pageHeightPx = Math.floor(canvasWidth * (contentHeightMm / contentWidthMm));
  const renderedHeightMm = Math.min(
    contentHeightMm - PDF_RENDER_EPSILON_MM,
    contentWidthMm * (sliceHeight / canvasWidth),
  );

  return {
    pageWidthMm,
    pageHeightMm,
    offsetXMm,
    offsetYMm,
    contentWidthMm,
    contentHeightMm,
    pageHeightPx,
    renderedHeightMm,
  };
}

export async function buildKidsReportPdfAssets(target: HTMLElement): Promise<GeneratedReportAssets> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const captureScale = 2;
  const canvas = await html2canvas(target, {
    backgroundColor: "#ffffff",
    scale: captureScale,
    useCORS: true,
    scrollY: -window.scrollY,
    windowWidth: document.documentElement.clientWidth,
  });

  const pdfMetrics = getKidsReportPdfMetrics(canvas.width, 0);
  const pageHeightPx = pdfMetrics.pageHeightPx;
  const targetRect = target.getBoundingClientRect();
  const sections: ReportSectionBoundary[] = Array.from(
    target.querySelectorAll<HTMLElement>(".kids-print-section"),
  ).map((section) => {
    const sectionRect = section.getBoundingClientRect();
    const top = (sectionRect.top - targetRect.top) * captureScale;
    const bottom = top + sectionRect.height * captureScale;
    return {
      top,
      bottom,
      forceBreakBefore: section.classList.contains("kids-print-page-break"),
    };
  });

  const slices = buildPageSlices(canvas.height, pageHeightPx, sections);
  const pageImages: string[] = [];
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  slices.forEach((slice, pageIndex) => {
    const sliceHeight = slice.end - slice.start;
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceHeight;

    const context = pageCanvas.getContext("2d");
    if (!context) {
      throw new Error("PDF 캡처용 캔버스를 준비하지 못했습니다.");
    }

    context.drawImage(
      canvas,
      0,
      slice.start,
      canvas.width,
      sliceHeight,
      0,
      0,
      pageCanvas.width,
      pageCanvas.height,
    );

    const pageImage = pageCanvas.toDataURL("image/png");
    pageImages.push(pageImage);

    if (pageIndex > 0) {
      pdf.addPage();
    }

    const pageMetrics = getKidsReportPdfMetrics(canvas.width, sliceHeight);
    pdf.addImage(
      pageImage,
      "PNG",
      pageMetrics.offsetXMm,
      pageMetrics.offsetYMm,
      pageMetrics.contentWidthMm,
      pageMetrics.renderedHeightMm,
    );
  });

  return {
    pageImages,
    pdfBlob: pdf.output("blob"),
  };
}
