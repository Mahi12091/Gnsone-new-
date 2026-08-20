export type ImportAuditStatus = "RUNNING" | "SUCCESS" | "PARTIAL" | "FAILED";

export type ImportAuditRecord = {
  source: "NSE" | "BSE";
  startedAt: string;
  finishedAt?: string;
  status: ImportAuditStatus;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  insertedRows: number;
  updatedRows: number;
  skippedRows: number;
  failedRows: number;
  issueCount: number;
  sourceUrl?: string;
  sourceChecksum?: string;
  errorMessage?: string;
};

export function createImportAuditStart(source: ImportAuditRecord["source"], sourceUrl?: string): ImportAuditRecord {
  return {
    source,
    startedAt: new Date().toISOString(),
    status: "RUNNING",
    totalRows: 0,
    validRows: 0,
    invalidRows: 0,
    insertedRows: 0,
    updatedRows: 0,
    skippedRows: 0,
    failedRows: 0,
    issueCount: 0,
    sourceUrl,
  };
}

export function finalizeImportAudit(
  audit: ImportAuditRecord,
  patch: Omit<Partial<ImportAuditRecord>, "source" | "startedAt" | "finishedAt" | "status"> & { status: Exclude<ImportAuditStatus, "RUNNING"> },
): ImportAuditRecord {
  return {
    ...audit,
    ...patch,
    finishedAt: new Date().toISOString(),
  };
}
