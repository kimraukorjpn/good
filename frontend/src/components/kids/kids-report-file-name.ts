"use client";

export function buildKidsReportFileName(participantName?: string) {
  const normalized = (participantName ?? "")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "_");

  if (!normalized) {
    return "kids-future-report.pdf";
  }

  return `${normalized}_진로리포트.pdf`;
}
