import { AnnualReportCopy, AnnualReportQuery } from "../../constants/annualReport";
import type { LedgerEntry } from "../../types/ledger";
import { fetchLedgerEntries, type LedgerEntriesPageCursor } from "../ledgerEntries";

export async function fetchAnnualReportEntries(bookId: string, dateFrom: string, dateTo: string) {
  const entries: LedgerEntry[] = [];
  const seen = new Set<string>();
  let cursor: LedgerEntriesPageCursor | null = null;
  while (true) {
    const page = await fetchLedgerEntries(bookId, dateFrom, dateTo, {
      ascending: true,
      orderBy: "created_at",
      cursor,
      limit: AnnualReportQuery.pageSize,
      includePhotoSignedUrls: false,
    });
    if (!page.length) break;
    for (const entry of page) {
      if (seen.has(entry.id)) throw new Error(AnnualReportCopy.incompleteDataMessage);
      seen.add(entry.id);
      entries.push(entry);
    }
    const last = page[page.length - 1];
    if (!last.createdAt) throw new Error(AnnualReportCopy.incompleteDataMessage);
    cursor = { createdAt: last.createdAt, id: last.id };
  }
  return entries.sort((a, b) => a.date.localeCompare(b.date)
    || (a.createdAt ?? "").localeCompare(b.createdAt ?? "") || a.id.localeCompare(b.id));
}
