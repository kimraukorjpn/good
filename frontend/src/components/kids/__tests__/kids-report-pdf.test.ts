import { describe, expect, test } from "vitest";

import { getKidsReportPdfMetrics } from "@/components/kids/kids-report-pdf";

describe("getKidsReportPdfMetrics", () => {
  test("keeps a full content slice within the printable content box", () => {
    const metrics = getKidsReportPdfMetrics(2000, 0);
    const fullPageSlice = getKidsReportPdfMetrics(2000, metrics.pageHeightPx);

    expect(fullPageSlice.renderedHeightMm).toBeLessThanOrEqual(metrics.contentHeightMm);
    expect(fullPageSlice.renderedHeightMm).toBeGreaterThan(metrics.contentHeightMm - 0.5);
  });

  test("adds visible page margins instead of full-bleed rendering", () => {
    const metrics = getKidsReportPdfMetrics(2000, 500);

    expect(metrics.offsetXMm).toBeGreaterThan(0);
    expect(metrics.offsetYMm).toBeGreaterThan(0);
    expect(metrics.contentWidthMm).toBeLessThan(metrics.pageWidthMm);
    expect(metrics.contentHeightMm).toBeLessThan(metrics.pageHeightMm);
  });
});
