export type ReportSectionBoundary = {
  top: number;
  bottom: number;
  forceBreakBefore?: boolean;
};

export type PageSlice = {
  start: number;
  end: number;
};

export function buildPageSlices(
  totalHeight: number,
  pageHeight: number,
  sections: ReportSectionBoundary[],
): PageSlice[] {
  if (totalHeight <= 0 || pageHeight <= 0) {
    return [];
  }

  const normalizedSections = sections
    .map((section) => ({
      top: Math.max(0, Math.floor(section.top)),
      bottom: Math.max(0, Math.floor(section.bottom)),
      forceBreakBefore: Boolean(section.forceBreakBefore),
    }))
    .filter((section) => section.bottom > section.top)
    .sort((left, right) => left.top - right.top);

  const slices: PageSlice[] = [];
  let cursor = 0;
  const nearTopThreshold = 32;

  while (cursor < totalHeight) {
    const hardLimit = Math.min(totalHeight, cursor + pageHeight);
    const currentForcedSection = normalizedSections.find(
      (section) =>
        section.forceBreakBefore &&
        section.top >= cursor &&
        section.top - cursor <= nearTopThreshold,
    );
    const forcedBreak = normalizedSections.find(
      (section) => section.forceBreakBefore && section.top > cursor && section.top < hardLimit,
    );
    const previousCompletedBoundary = forcedBreak
      ? normalizedSections
          .filter((section) => section.bottom > cursor && section.bottom <= forcedBreak.top)
          .map((section) => section.bottom)
          .sort((left, right) => right - left)[0]
      : undefined;

    const preferredBoundary = normalizedSections
      .filter((section) => section.bottom > cursor && section.bottom <= hardLimit)
      .map((section) => section.bottom)
      .sort((left, right) => right - left)[0];

    const shouldIgnoreForcedBreak =
      forcedBreak &&
      previousCompletedBoundary == null &&
      forcedBreak.top - cursor <= nearTopThreshold;

    const forcedSectionFitsCurrentPage =
      currentForcedSection && currentForcedSection.bottom <= hardLimit
        ? currentForcedSection.bottom
        : undefined;

    let nextEnd = forcedSectionFitsCurrentPage
      ?? previousCompletedBoundary
      ?? (!shouldIgnoreForcedBreak ? forcedBreak?.top : undefined)
      ?? preferredBoundary
      ?? hardLimit;

    if (nextEnd <= cursor) {
      nextEnd = hardLimit;
    }

    slices.push({
      start: cursor,
      end: nextEnd,
    });

    cursor = nextEnd;
  }

  const trailingMergeThreshold = Math.max(24, Math.floor(pageHeight * 0.12));
  if (slices.length >= 2) {
    const lastSlice = slices[slices.length - 1];
    const trailingHeight = lastSlice.end - lastSlice.start;

    if (trailingHeight <= trailingMergeThreshold) {
      slices[slices.length - 2] = {
        start: slices[slices.length - 2].start,
        end: lastSlice.end,
      };
      slices.pop();
    }
  }

  return slices;
}
