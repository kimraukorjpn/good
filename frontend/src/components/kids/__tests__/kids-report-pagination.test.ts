import { describe, expect, test } from "vitest";

import { buildPageSlices, type ReportSectionBoundary } from "@/components/kids/kids-report-pagination";

describe("buildPageSlices", () => {
  test("prefers section boundaries instead of cutting through a section when possible", () => {
    const sections: ReportSectionBoundary[] = [
      { top: 0, bottom: 260 },
      { top: 280, bottom: 520 },
      { top: 540, bottom: 790 },
    ];

    expect(buildPageSlices(790, 400, sections)).toEqual([
      { start: 0, end: 260 },
      { start: 260, end: 520 },
      { start: 520, end: 790 },
    ]);
  });

  test("respects explicit forced page breaks before a section", () => {
    const sections: ReportSectionBoundary[] = [
      { top: 0, bottom: 240 },
      { top: 260, bottom: 460, forceBreakBefore: true },
      { top: 480, bottom: 700 },
    ];

    expect(buildPageSlices(700, 500, sections)).toEqual([
      { start: 0, end: 240 },
      { start: 240, end: 460 },
      { start: 460, end: 700 },
    ]);
  });

  test("falls back to raw page height when a section is taller than one page", () => {
    const sections: ReportSectionBoundary[] = [{ top: 0, bottom: 1100 }];

    expect(buildPageSlices(1100, 400, sections)).toEqual([
      { start: 0, end: 400 },
      { start: 400, end: 800 },
      { start: 800, end: 1100 },
    ]);
  });

  test("does not overflow a page when a forced-break section is taller than one page", () => {
    const sections: ReportSectionBoundary[] = [
      { top: 0, bottom: 240 },
      { top: 260, bottom: 980, forceBreakBefore: true },
      { top: 1000, bottom: 1200 },
    ];

    expect(buildPageSlices(1200, 500, sections)).toEqual([
      { start: 0, end: 240 },
      { start: 240, end: 740 },
      { start: 740, end: 1200 },
    ]);
  });

  test("merges a tiny trailing remainder into the previous page instead of creating a blank last page", () => {
    const sections: ReportSectionBoundary[] = [
      { top: 0, bottom: 500 },
      { top: 500, bottom: 1000 },
      { top: 1000, bottom: 1490 },
      { top: 1490, bottom: 1510 },
    ];

    expect(buildPageSlices(1510, 500, sections)).toEqual([
      { start: 0, end: 500 },
      { start: 500, end: 1000 },
      { start: 1000, end: 1510 },
    ]);
  });
});
